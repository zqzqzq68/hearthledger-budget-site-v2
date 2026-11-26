// HearthLedger views: one render function per page. Each returns an HTML string
// for #view; main.js wires the buttons afterwards. Nothing here fetches anything:
// every number comes from the state passed in.

import {
  CATEGORIES, HOUSEHOLD, BILLS, categoryById, monthLabel, monthTotals,
  spendingByCategory, money, moneyShort, prettyDate, escapeHtml, monthOf,
} from './data.js';
import { donutChart, monthBars, progressBar } from './charts.js';

export const TODAY = '2026-11-26';

function allCategories(state) {
  return [...CATEGORIES, ...((state && state.customCategories) || [])];
}

export function resolveCategory(state, id) {
  return allCategories(state).find((c) => c.id === id) || { id, label: id, color: '#8a978f' };
}

function monthPicker(state, ctx) {
  const idx = HOUSEHOLD.months.indexOf(ctx.month);
  const prev = HOUSEHOLD.months[idx - 1];
  const next = HOUSEHOLD.months[idx + 1];
  return `<div class="month-picker" role="group" aria-label="Choose month">
    <button class="btn ghost small" data-action="month-prev" ${prev ? '' : 'disabled'}>← ${prev ? monthLabel(prev).split(' ')[0] : ''}</button>
    <span class="month-label">${monthLabel(ctx.month)}</span>
    <button class="btn ghost small" data-action="month-next" ${next ? '' : 'disabled'}>${next ? monthLabel(next).split(' ')[0] : ''} →</button>
  </div>`;
}

function statCard(label, value, sub, tone = '') {
  return `<div class="stat ${tone}">
    <div class="label">${label}</div>
    <div class="value num">${value}</div>
    <div class="sub">${sub}</div>
  </div>`;
}

// ---------------- Dashboard ----------------

export function renderDashboard(state, ctx) {
  const totals = monthTotals(state, ctx.month);
  const left = totals.income - totals.spending - totals.saving;
  const rate = totals.income > 0 ? Math.round(((totals.income - totals.spending) / totals.income) * 100) : 0;
  const byCat = spendingByCategory(state, ctx.month);
  const slices = Object.entries(byCat)
    .map(([id, value]) => ({ label: resolveCategory(state, id).label, value, color: resolveCategory(state, id).color }))
    .sort((a, b) => b.value - a.value);
  const topSlices = slices.slice(0, 7);
  const otherTotal = slices.slice(7).reduce((s, x) => s + x.value, 0);
  if (otherTotal > 0) topSlices.push({ label: 'Everything else', value: Math.round(otherTotal * 100) / 100, color: '#b9b09a' });

  const budgetRows = Object.entries(state.budgets)
    .map(([id, budget]) => ({ id, budget, spent: byCat[id] || 0 }))
    .sort((a, b) => (b.spent / b.budget) - (a.spent / a.budget))
    .slice(0, 5);
  const budgetHtml = budgetRows.map(({ id, budget, spent }) => {
    const frac = budget > 0 ? spent / budget : 0;
    const tone = frac > 1 ? 'over' : frac >= 0.85 ? 'near' : '';
    const remaining = budget - spent;
    return `<div class="bar-row">
      <span>${escapeHtml(resolveCategory(state, id).label)}</span>
      ${progressBar(frac, tone)}
      <span class="bar-val num">${moneyShort(spent)} / ${moneyShort(budget)}</span>
    </div>
    <div class="muted" style="font-size:0.82rem;margin:-4px 0 6px 160px">${remaining >= 0 ? `${moneyShort(remaining)} left` : `${moneyShort(-remaining)} over budget`}</div>`;
  }).join('');

  const billsHtml = BILLS.map((bill) => {
    // Match a bill to the transaction that paid it by a distinctive word from
    // its name (the part after the dash when there is one, else the whole name).
    const key = (bill.name.split('—')[1] || bill.name).trim().toLowerCase().slice(0, 8);
    const paid = state.transactions.some((t) => t.kind === 'out' && monthOf(t.date) === ctx.month
      && t.payee.toLowerCase().includes(key));
    const todayDay = Number(TODAY.slice(8, 10));
    const status = paid
      ? '<span class="pill paid">Paid</span>'
      : bill.day <= todayDay + 3
        ? '<span class="pill due-soon">Due soon</span>'
        : '<span class="pill upcoming">Upcoming</span>';
    return `<div class="bill">
      <div><div>${escapeHtml(bill.name)}</div><div class="due">Due on the ${bill.day}${bill.day === 1 ? 'st' : bill.day === 2 ? 'nd' : bill.day === 3 ? 'rd' : 'th'} of ${monthLabel(ctx.month)}</div></div>
      <div style="display:flex;gap:10px;align-items:center"><span class="num"><b>${money(bill.amount)}</b></span>${status}</div>
    </div>`;
  }).join('');

  const recent = [...state.transactions]
    .filter((t) => monthOf(t.date) === ctx.month)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 8);
  const recentRows = recent.map((t) => `<tr>
    <td>${prettyDate(t.date)}</td>
    <td>${escapeHtml(t.payee)}</td>
    <td><span class="chip cat-${t.category}">${escapeHtml(resolveCategory(state, t.category).label)}</span></td>
    <td class="amount ${t.kind === 'in' ? 'pos' : t.kind === 'save' ? '' : 'neg'} num">${t.kind === 'in' ? '+' : t.kind === 'save' ? '→ ' : '−'}${money(t.amount)}</td>
  </tr>`).join('');

  return `
  <div class="page-head">
    <div>
      <h1>Good to see you, Alvarez family</h1>
      <p>Here is where the household stands in ${monthLabel(ctx.month)} — what came in, what went out, and what is left for the rest of the month.</p>
    </div>
    ${monthPicker(state, ctx)}
  </div>

  <div class="stats">
    ${statCard('Money in', money(totals.income), `${state.transactions.filter((t) => t.kind === 'in' && monthOf(t.date) === ctx.month).length} paydays and receipts`, 'good')}
    ${statCard('Spent', money(totals.spending), 'Across ' + Object.keys(byCat).length + ' categories', totals.spending > totals.income ? 'bad' : '')}
    ${statCard('Left to spend', money(left), 'Income minus spending and savings', left < 0 ? 'bad' : left < 500 ? 'warn' : 'good')}
    ${statCard('Savings rate', rate + '%', money(totals.saving) + ' moved to goals this month', rate >= 10 ? 'good' : 'warn')}
  </div>

  <div class="grid-2">
    <section class="card">
      <h2>Where the money went</h2>
      <div class="donut-flex">
        ${donutChart(topSlices)}
        <ul class="legend">
          ${topSlices.map((s) => `<li><span class="swatch" style="background:${s.color}"></span>${escapeHtml(s.label)}<span class="amt num">${money(s.value)}</span></li>`).join('')}
        </ul>
      </div>
      <p class="muted" style="margin-top:12px">Housing is the biggest slice, as usual — rent alone is ${money(1850)} of the month's spending. Groceries come next.</p>
    </section>

    <section class="card">
      <h2>Budgets to watch</h2>
      ${budgetHtml}
      <p style="margin-top:12px"><a href="#/budgets">See all budgets →</a></p>
    </section>
  </div>

  <div class="grid-2">
    <section class="card">
      <h2>Bills this month</h2>
      ${billsHtml}
    </section>

    <section class="card">
      <h2>Recent activity</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>Date</th><th>What</th><th>Category</th><th class="amount">Amount</th></tr></thead>
        <tbody>${recentRows}</tbody>
      </table></div>
      <p style="margin-top:12px"><a href="#/transactions">All transactions →</a></p>
    </section>
  </div>

  <section class="card">
    <h2>Your household</h2>
    <p>${HOUSEHOLD.members.map((m) => `<b>${escapeHtml(m.name)}</b> — ${escapeHtml(m.role)}`).join(' · ')}</p>
    <p class="muted">Four people, one shared pot. Everyone's spending lands in the same books, so the totals above are the whole household's, not one person's.</p>
    <div class="form-actions">
      <button class="btn ghost" data-action="export-csv">Download transactions (CSV)</button>
      <button class="btn danger" data-action="reset-data">Reset demo data</button>
    </div>
  </section>`;
}

// ---------------- Transactions ----------------

export function renderTransactions(state, ctx) {
  const f = ctx.filters;
  const cats = allCategories(state);
  const rows = [...state.transactions]
    .filter((t) => monthOf(t.date) === ctx.month)
    .filter((t) => (f.kind === 'all' ? true : t.kind === f.kind))
    .filter((t) => (f.category === 'all' ? true : t.category === f.category))
    .filter((t) => (f.q ? (t.payee + ' ' + resolveCategory(state, t.category).label).toLowerCase().includes(f.q.toLowerCase()) : true))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.id < b.id ? 1 : -1));
  const spent = rows.filter((t) => t.kind === 'out').reduce((s, t) => s + t.amount, 0);
  const got = rows.filter((t) => t.kind === 'in').reduce((s, t) => s + t.amount, 0);
  const body = rows.length ? rows.map((t) => `<tr>
    <td>${prettyDate(t.date)}</td>
    <td>${escapeHtml(t.payee)}</td>
    <td><span class="chip cat-${t.category}">${escapeHtml(resolveCategory(state, t.category).label)}</span></td>
    <td class="amount ${t.kind === 'in' ? 'pos' : t.kind === 'save' ? '' : 'neg'} num">${t.kind === 'in' ? '+' : t.kind === 'save' ? '→ ' : '−'}${money(t.amount)}</td>
    <td style="white-space:nowrap">
      <button class="btn ghost small" data-action="edit-transaction" data-id="${t.id}">Edit</button>
      <button class="btn danger small" data-action="delete-transaction" data-id="${t.id}">Delete</button>
    </td>
  </tr>`).join('') : `<tr><td colspan="5" class="muted">Nothing matches these filters. Try clearing the search or picking another category.</td></tr>`;

  return `
  <div class="page-head">
    <div>
      <h1>Transactions</h1>
      <p>Every dollar in and out for ${monthLabel(ctx.month)}. Search it, filter it, fix a mistake, or add the thing you just paid for.</p>
    </div>
    ${monthPicker(state, ctx)}
  </div>

  <section class="card">
    <div class="form-row">
      <label class="field">Search
        <input type="search" id="filter-q" placeholder="Payee or category…" value="${escapeHtml(f.q)}" autocomplete="off">
      </label>
      <label class="field">Category
        <select id="filter-category">
          <option value="all">All categories</option>
          ${cats.map((c) => `<option value="${c.id}" ${f.category === c.id ? 'selected' : ''}>${escapeHtml(c.label)}</option>`).join('')}
        </select>
      </label>
      <label class="field">Type
        <select id="filter-kind">
          <option value="all" ${f.kind === 'all' ? 'selected' : ''}>Money in and out</option>
          <option value="in" ${f.kind === 'in' ? 'selected' : ''}>Money in</option>
          <option value="out" ${f.kind === 'out' ? 'selected' : ''}>Money out</option>
          <option value="save" ${f.kind === 'save' ? 'selected' : ''}>To savings</option>
        </select>
      </label>
    </div>
    <div class="form-actions">
      <button class="btn" data-action="add-transaction">+ Add a transaction</button>
      <span class="form-note num">${rows.length} shown · in ${money(got)} · out ${money(spent)}</span>
    </div>
  </section>

  <section class="card">
    <div class="table-wrap"><table>
      <thead><tr><th>Date</th><th>What</th><th>Category</th><th class="amount">Amount</th><th>Actions</th></tr></thead>
      <tbody>${body}</tbody>
    </table></div>
  </section>

  <dialog id="tx-dialog">
    <form method="dialog" id="tx-form">
      <h2 id="tx-dialog-title">Add a transaction</h2>
      <input type="hidden" id="tx-id" value="">
      <div class="form-row">
        <label class="field">Date<input type="date" id="tx-date" required value="${TODAY}"></label>
        <label class="field">Amount ($)<input type="number" id="tx-amount" min="0.01" step="0.01" required placeholder="0.00"></label>
      </div>
      <label class="field">What was it?
        <input type="text" id="tx-payee" required maxlength="80" placeholder="e.g. GreenMart weekly shop">
      </label>
      <div class="form-row">
        <label class="field">Category
          <select id="tx-category">${cats.map((c) => `<option value="${c.id}">${escapeHtml(c.label)}</option>`).join('')}</select>
        </label>
        <label class="field">Type
          <select id="tx-kind">
            <option value="out">Money out (spending)</option>
            <option value="in">Money in (income)</option>
            <option value="save">To savings</option>
          </select>
        </label>
      </div>
      <div class="form-actions">
        <button class="btn" type="submit" id="tx-submit">Save transaction</button>
        <button class="btn ghost" type="button" data-action="close-dialog">Cancel</button>
      </div>
      <p class="form-note" id="tx-error" role="alert"></p>
    </form>
  </dialog>`;
}

// ---------------- Budgets ----------------

export function renderBudgets(state, ctx) {
  const totals = monthTotals(state, ctx.month);
  const byCat = spendingByCategory(state, ctx.month);
  const totalBudget = Object.values(state.budgets).reduce((s, v) => s + v, 0);
  const spentBudgeted = Object.keys(state.budgets).reduce((s, id) => s + (byCat[id] || 0), 0);
  const cards = Object.entries(state.budgets)
    .map(([id, budget]) => {
      const spent = byCat[id] || 0;
      const frac = budget > 0 ? spent / budget : 0;
      const tone = frac > 1 ? 'over' : frac >= 0.85 ? 'near' : '';
      const remaining = budget - spent;
      const editing = ctx.editingBudget === id;
      const editor = editing ? `
        <div class="goal-actions">
          <label class="field" style="margin:0">Monthly budget ($)
            <input type="number" id="budget-input-${id}" min="0" step="1" value="${budget}">
          </label>
          <button class="btn small" data-action="save-budget" data-id="${id}">Save</button>
          <button class="btn ghost small" data-action="cancel-budget-edit">Cancel</button>
        </div>` : `
        <div class="goal-actions">
          <button class="btn ghost small" data-action="edit-budget" data-id="${id}">Change budget</button>
          <span class="form-note">${remaining >= 0 ? `${moneyShort(remaining)} left` : `${moneyShort(-remaining)} over`}</span>
        </div>`;
      return `<div class="card">
        <div class="goal-head"><h3>${escapeHtml(resolveCategory(state, id).label)}</h3>
          <span class="num"><b>${moneyShort(spent)}</b> <span class="muted">of ${moneyShort(budget)}</span></span></div>
        ${progressBar(frac, tone)}
        <p class="muted" style="margin-top:8px">${frac > 1 ? 'Over budget — time to ease off this category.' : frac >= 0.85 ? 'Nearly there — most of this budget is used.' : 'On track for the month.'}</p>
        ${editor}
      </div>`;
    }).join('');

  return `
  <div class="page-head">
    <div>
      <h1>Budgets</h1>
      <p>One monthly limit per category for ${monthLabel(ctx.month)}. Change any limit and the dashboard, the bars and the reports all follow it.</p>
    </div>
    ${monthPicker(state, ctx)}
  </div>

  <div class="stats">
    ${statCard('Total budget', money(totalBudget), 'Across ' + Object.keys(state.budgets).length + ' categories')}
    ${statCard('Spent in budget', money(spentBudgeted), Math.round((spentBudgeted / totalBudget) * 100) + '% of the total budget', spentBudgeted > totalBudget ? 'bad' : '')}
    ${statCard('Budget left', money(totalBudget - spentBudgeted), 'For the rest of ' + monthLabel(ctx.month), totalBudget - spentBudgeted < 0 ? 'bad' : 'good')}
  </div>

  <div class="grid-3">${cards}</div>

  <section class="card">
    <h2>Add a category</h2>
    <p class="muted">Need a limit for something new — a hobby, a trip, a pet project? Add the category here and it appears in budgets and in the transaction form.</p>
    <form id="category-form">
      <div class="form-row">
        <label class="field">Category name<input type="text" id="cat-name" required maxlength="40" placeholder="e.g. Hobbies"></label>
        <label class="field">Monthly budget ($)<input type="number" id="cat-budget" min="0" step="1" required placeholder="100"></label>
      </div>
      <div class="form-actions">
        <button class="btn" type="submit">Add category</button>
        <span class="form-note" id="cat-error" role="alert"></span>
      </div>
    </form>
  </section>`;
}

// ---------------- Goals ----------------

export function renderGoals(state, ctx) {
  const totalSaved = state.goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = state.goals.reduce((s, g) => s + g.target, 0);
  const cards = state.goals.map((goal) => {
    const frac = goal.target > 0 ? goal.saved / goal.target : 0;
    const done = goal.saved >= goal.target;
    return `<div class="card">
      <div class="goal-head"><h3>${escapeHtml(goal.name)}</h3><span class="pill ${done ? 'paid' : 'upcoming'}">${done ? 'Reached' : Math.round(frac * 100) + '%'}</span></div>
      <div class="goal-amounts"><b class="num">${money(goal.saved)}</b> saved of <span class="num">${money(goal.target)}</span> · <span class="num">${money(Math.max(goal.target - goal.saved, 0))}</span> to go</div>
      ${progressBar(frac, done ? '' : frac >= 0.75 ? 'near' : '')}
      <p class="muted" style="margin-top:8px">${escapeHtml(goal.note)}</p>
      <div class="goal-actions">
        <label class="field" style="margin:0">Add ($)
          <input type="number" id="contribute-${goal.id}" min="1" step="1" placeholder="50">
        </label>
        <button class="btn small" data-action="contribute-goal" data-id="${goal.id}">Add to goal</button>
      </div>
    </div>`;
  }).join('');

  return `
  <div class="page-head">
    <div>
      <h1>Savings goals</h1>
      <p>What the household is saving for, and how close each goal is. Adding money moves it out of this month's spending and into the goal.</p>
    </div>
  </div>

  <div class="stats">
    ${statCard('Saved in total', money(totalSaved), 'Across ' + state.goals.length + ' goals', 'good')}
    ${statCard('All targets', money(totalTarget), Math.round((totalSaved / totalTarget) * 100) + '% of the way there')}
    ${statCard('Still to save', money(totalTarget - totalSaved), 'Until every goal is reached')}
  </div>

  <div class="grid-2">${cards}</div>

  <section class="card">
    <h2>Start a new goal</h2>
    <form id="goal-form">
      <div class="form-row">
        <label class="field">Goal name<input type="text" id="goal-name" required maxlength="60" placeholder="e.g. New washing machine"></label>
        <label class="field">Target ($)<input type="number" id="goal-target" min="1" step="1" required placeholder="800"></label>
        <label class="field">Already saved ($)<input type="number" id="goal-saved" min="0" step="1" value="0"></label>
      </div>
      <label class="field">Why this goal? (optional)
        <input type="text" id="goal-note" maxlength="120" placeholder="e.g. The old one leaks">
      </label>
      <div class="form-actions">
        <button class="btn" type="submit">Add goal</button>
        <span class="form-note" id="goal-error" role="alert"></span>
      </div>
    </form>
  </section>`;
}

// ---------------- Reports ----------------

export function renderReports(state, ctx) {
  const months = HOUSEHOLD.months.map((m) => {
    const t = monthTotals(state, m);
    return { label: monthLabel(m).split(' ')[0], income: t.income, spending: t.spending };
  });
  const totals = monthTotals(state, ctx.month);
  const byCat = spendingByCategory(state, ctx.month);
  const catRows = Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .map(([id, value]) => {
      const share = totals.spending > 0 ? Math.round((value / totals.spending) * 100) : 0;
      const budget = state.budgets[id];
      return `<tr>
        <td>${escapeHtml(resolveCategory(state, id).label)}</td>
        <td class="amount num">${money(value)}</td>
        <td class="amount num">${share}%</td>
        <td class="amount num">${budget ? money(budget) : '—'}</td>
        <td>${budget ? (value > budget ? '<span class="pill over">Over</span>' : '<span class="pill paid">Inside</span>') : '<span class="pill upcoming">No budget</span>'}</td>
      </tr>`;
    }).join('');

  const payees = {};
  for (const t of state.transactions) {
    if (t.kind !== 'out' || monthOf(t.date) !== ctx.month) continue;
    payees[t.payee] = Math.round(((payees[t.payee] || 0) + t.amount) * 100) / 100;
  }
  const topPayees = Object.entries(payees).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const payeeRows = topPayees.map(([name, value], i) => `<tr><td>${i + 1}</td><td>${escapeHtml(name)}</td><td class="amount num">${money(value)}</td></tr>`).join('');

  const dayCount = Number(TODAY.slice(8, 10));
  const dailyAvg = totals.spending / dayCount;
  const projected = Math.round(dailyAvg * 30);
  const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
  const bestMonth = months.slice().sort((a, b) => a.spending - b.spending)[0];
  const rate = totals.income > 0 ? Math.round(((totals.income - totals.spending) / totals.income) * 100) : 0;

  return `
  <div class="page-head">
    <div>
      <h1>Reports</h1>
      <p>Three months side by side for ${monthLabel(ctx.month)}, so the household can see what is a habit and what was a one-off.</p>
    </div>
    ${monthPicker(state, ctx)}
  </div>

  <section class="card">
    <h2>Income vs spending — September to November</h2>
    ${monthBars(months)}
    <p class="muted">November's income is the highest of the three months, helped by ${money(640)} of freelance work on the 20th.</p>
  </section>

  <div class="grid-2">
    <section class="card">
      <h2>Where November's money went</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>Category</th><th class="amount">Spent</th><th class="amount">Share</th><th class="amount">Budget</th><th>Status</th></tr></thead>
        <tbody>${catRows}</tbody>
      </table></div>
    </section>

    <section class="card">
      <h2>Top payees in ${monthLabel(ctx.month)}</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>#</th><th>Payee</th><th class="amount">Total</th></tr></thead>
        <tbody>${payeeRows}</tbody>
      </table></div>
      <h2 style="margin-top:20px">What the numbers say</h2>
      <ul class="insight-list">
        <li><b>${escapeHtml(resolveCategory(state, topCat[0]).label)}</b> is the biggest spending category in ${monthLabel(ctx.month)} at <b class="num">${money(topCat[1])}</b>.</li>
        <li>The household spends about <b class="num">${money(dailyAvg)}</b> a day; kept up, November ends near <b class="num">${money(projected)}</b> of spending.</li>
        <li>The savings rate is <b>${rate}%</b> of income — above the 10% the family aims for.</li>
        <li><b>${bestMonth.label}</b> was the lightest month, at <b class="num">${money(bestMonth.spending)}</b> of spending.</li>
      </ul>
    </section>
  </div>`;
}
