// HearthLedger entry point: owns the state, the hash router, and every control
// on the page. Views only return HTML; this file makes it all do something.

import {
  HOUSEHOLD, loadState, saveState, resetState, monthOf, money,
} from './data.js';
import {
  TODAY, renderDashboard, renderTransactions, renderBudgets, renderGoals,
  renderReports, resolveCategory,
} from './views.js';

const viewEl = document.querySelector('#view');
const navLinks = [...document.querySelectorAll('.main-nav a')];

let state = loadState();

// UI state that is not saved: the month on screen, the transaction filters,
// which budget is being edited, and which dialog (if any) to open after render.
const ctx = {
  month: HOUSEHOLD.currentMonth,
  filters: { q: '', category: 'all', kind: 'all' },
  editingBudget: null,
  dialogToOpen: null,
  editTxId: null,
};

const ROUTES = {
  '': renderDashboard,
  transactions: renderTransactions,
  budgets: renderBudgets,
  goals: renderGoals,
  reports: renderReports,
};

function currentRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return ROUTES[hash] ? hash : '';
}

function render(restoreFocusId) {
  const route = currentRoute();
  const renderFn = ROUTES[route];
  viewEl.innerHTML = renderFn(state, ctx);
  for (const link of navLinks) link.classList.toggle('active', link.dataset.route === route);
  document.title = route === '' ? 'HearthLedger — Household Budget' : `HearthLedger — ${linkLabel(route)}`;
  if (ctx.dialogToOpen) {
    const dialog = document.querySelector(ctx.dialogToOpen);
    if (dialog) dialog.showModal();
    ctx.dialogToOpen = null;
  }
  if (restoreFocusId) {
    const el = document.getElementById(restoreFocusId);
    if (el) { el.focus(); if (el.setSelectionRange && el.value) el.setSelectionRange(el.value.length, el.value.length); }
  }
}

function linkLabel(route) {
  return { transactions: 'Transactions', budgets: 'Budgets', goals: 'Goals', reports: 'Reports' }[route] || 'Dashboard';
}

function rerender() {
  saveState(state);
  render();
}

// ---- month stepping ----

function stepMonth(direction) {
  const idx = HOUSEHOLD.months.indexOf(ctx.month);
  const next = HOUSEHOLD.months[idx + direction];
  if (next) { ctx.month = next; render(); }
}

// ---- transaction dialog ----

function openTxDialog(txId) {
  ctx.editTxId = txId || null;
  ctx.dialogToOpen = '#tx-dialog';
  render();
  const dialog = document.querySelector('#tx-dialog');
  if (!dialog) return;
  const title = document.querySelector('#tx-dialog-title');
  if (txId) {
    const t = state.transactions.find((x) => x.id === txId);
    if (!t) return;
    title.textContent = 'Edit transaction';
    document.querySelector('#tx-id').value = t.id;
    document.querySelector('#tx-date').value = t.date;
    document.querySelector('#tx-amount').value = t.amount;
    document.querySelector('#tx-payee').value = t.payee;
    document.querySelector('#tx-category').value = t.category;
    document.querySelector('#tx-kind').value = t.kind;
  } else {
    title.textContent = 'Add a transaction';
    document.querySelector('#tx-id').value = '';
    document.querySelector('#tx-date').value = TODAY;
    document.querySelector('#tx-amount').value = '';
    document.querySelector('#tx-payee').value = '';
    document.querySelector('#tx-category').value = 'groceries';
    document.querySelector('#tx-kind').value = 'out';
  }
  document.querySelector('#tx-error').textContent = '';
}

function submitTxForm(form) {
  const id = document.querySelector('#tx-id').value;
  const date = document.querySelector('#tx-date').value;
  const amount = Number(document.querySelector('#tx-amount').value);
  const payee = document.querySelector('#tx-payee').value.trim();
  const category = document.querySelector('#tx-category').value;
  const kind = document.querySelector('#tx-kind').value;
  const error = document.querySelector('#tx-error');
  if (!date || !payee || !Number.isFinite(amount) || amount <= 0) {
    error.textContent = 'Please fill in a date, a description, and an amount over $0.';
    return;
  }
  if (id) {
    const t = state.transactions.find((x) => x.id === id);
    if (t) Object.assign(t, { date, amount: Math.round(amount * 100) / 100, payee, category, kind });
  } else {
    state.transactions.push({
      id: `t${state.nextId++}`, date, amount: Math.round(amount * 100) / 100, payee, category, kind,
    });
  }
  const dialog = document.querySelector('#tx-dialog');
  if (dialog) dialog.close();
  rerender();
}

function deleteTransaction(id) {
  const t = state.transactions.find((x) => x.id === id);
  if (!t) return;
  if (!window.confirm(`Delete "${t.payee}" (${money(t.amount)})? This cannot be undone.`)) return;
  state.transactions = state.transactions.filter((x) => x.id !== id);
  rerender();
}

// ---- CSV export and reset ----

function exportCsv() {
  const header = 'date,payee,category,kind,amount_usd';
  const lines = [...state.transactions]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((t) => [t.date, `"${t.payee.replaceAll('"', '""')}"`, resolveCategory(state, t.category).label, t.kind, t.amount.toFixed(2)].join(','));
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hearthledger-transactions.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ---- delegated clicks ----

viewEl.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;

  if (action === 'month-prev') stepMonth(-1);
  else if (action === 'month-next') stepMonth(1);
  else if (action === 'add-transaction') openTxDialog(null);
  else if (action === 'edit-transaction') openTxDialog(id);
  else if (action === 'delete-transaction') deleteTransaction(id);
  else if (action === 'close-dialog') {
    const dialog = button.closest('dialog');
    if (dialog) dialog.close();
  } else if (action === 'edit-budget') {
    ctx.editingBudget = id;
    render();
    const input = document.querySelector(`#budget-input-${id}`);
    if (input) input.focus();
  } else if (action === 'cancel-budget-edit') {
    ctx.editingBudget = null;
    render();
  } else if (action === 'save-budget') {
    const input = document.querySelector(`#budget-input-${id}`);
    const value = input ? Number(input.value) : NaN;
    if (!Number.isFinite(value) || value < 0) {
      if (input) input.focus();
      return;
    }
    state.budgets[id] = Math.round(value);
    ctx.editingBudget = null;
    rerender();
  } else if (action === 'contribute-goal') {
    const input = document.querySelector(`#contribute-${id}`);
    const value = input ? Number(input.value) : NaN;
    const goal = state.goals.find((g) => g.id === id);
    if (!goal || !Number.isFinite(value) || value <= 0) {
      if (input) input.focus();
      return;
    }
    goal.saved = Math.round((goal.saved + value) * 100) / 100;
    state.transactions.push({
      id: `t${state.nextId++}`, date: TODAY, payee: `To ${goal.name}`, category: 'saving', amount: Math.round(value * 100) / 100, kind: 'save',
    });
    rerender();
  } else if (action === 'export-csv') exportCsv();
  else if (action === 'reset-data') {
    if (!window.confirm('Reset everything back to the demo household? Your edits will be lost.')) return;
    state = resetState();
    ctx.editingBudget = null;
    rerender();
  }
});

// ---- forms and filters (wired fresh after every render) ----

function wirePage() {
  const txForm = document.querySelector('#tx-form');
  if (txForm) txForm.addEventListener('submit', (e) => { e.preventDefault(); submitTxForm(txForm); });

  const q = document.querySelector('#filter-q');
  if (q) q.addEventListener('input', () => { ctx.filters.q = q.value; saveState(state); render('filter-q'); });
  const cat = document.querySelector('#filter-category');
  if (cat) cat.addEventListener('change', () => { ctx.filters.category = cat.value; render(); });
  const kind = document.querySelector('#filter-kind');
  if (kind) kind.addEventListener('change', () => { ctx.filters.kind = kind.value; render(); });

  const catForm = document.querySelector('#category-form');
  if (catForm) catForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.querySelector('#cat-name').value.trim();
    const budget = Number(document.querySelector('#cat-budget').value);
    const error = document.querySelector('#cat-error');
    if (!name || !Number.isFinite(budget) || budget < 0) {
      error.textContent = 'Give the category a name and a budget of $0 or more.';
      return;
    }
    const id = 'custom-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!state.customCategories) state.customCategories = [];
    if (state.customCategories.some((c) => c.id === id) || state.budgets[id] !== undefined) {
      error.textContent = 'A category with that name already exists.';
      return;
    }
    const palette = ['#2e8b7a', '#b0713a', '#6a5588', '#33617e', '#8a5fbf'];
    state.customCategories.push({ id, label: name, color: palette[state.customCategories.length % palette.length] });
    state.budgets[id] = Math.round(budget);
    rerender();
  });

  const goalForm = document.querySelector('#goal-form');
  if (goalForm) goalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.querySelector('#goal-name').value.trim();
    const target = Number(document.querySelector('#goal-target').value);
    const saved = Number(document.querySelector('#goal-saved').value) || 0;
    const note = document.querySelector('#goal-note').value.trim();
    const error = document.querySelector('#goal-error');
    if (!name || !Number.isFinite(target) || target <= 0 || saved < 0 || saved > target) {
      error.textContent = 'Give the goal a name, a target over $0, and a saved amount between $0 and the target.';
      return;
    }
    state.goals.push({ id: `g${Date.now()}`, name, target: Math.round(target), saved: Math.round(saved), note: note || 'A new goal for the household.' });
    rerender();
  });
}

// Re-wire after each render: render() replaces the DOM, so listeners must follow.
const observer = new MutationObserver(() => wirePage());
observer.observe(viewEl, { childList: true });

window.addEventListener('hashchange', () => render());
render();
