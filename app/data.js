// HearthLedger data: the Alvarez household's demo books, plus the tiny store
// that keeps them on the visitor's own device (localStorage, no network).
// Every figure below is invented demo data for one fictional household.

export const HOUSEHOLD = {
  name: 'The Alvarez household',
  members: [
    { name: 'Maya Alvarez', role: 'Parent · salary' },
    { name: 'Daniel Alvarez', role: 'Parent · salary' },
    { name: 'Sofia Alvarez', role: 'Age 11 · school' },
    { name: 'Leo Alvarez', role: 'Age 8 · school' },
  ],
  currency: 'USD',
  months: ['2026-09', '2026-10', '2026-11'],
  currentMonth: '2026-11',
};

// Category, display label, chart colour. "income" and "saving" are kinds, not spending.
export const CATEGORIES = [
  { id: 'housing', label: 'Housing', color: '#5b7a99' },
  { id: 'groceries', label: 'Groceries', color: '#5da24a' },
  { id: 'dining', label: 'Dining out', color: '#d99327' },
  { id: 'transport', label: 'Transport', color: '#3e7ca6' },
  { id: 'utilities', label: 'Utilities', color: '#7a5fb0' },
  { id: 'entertainment', label: 'Entertainment', color: '#c65b7c' },
  { id: 'health', label: 'Health', color: '#2e8b7a' },
  { id: 'kids', label: 'Kids & school', color: '#b89b1d' },
  { id: 'shopping', label: 'Shopping', color: '#8a5fbf' },
  { id: 'subscriptions', label: 'Subscriptions', color: '#6b7f5e' },
  { id: 'pets', label: 'Pets', color: '#b0713a' },
  { id: 'gifts', label: 'Gifts & giving', color: '#b3402e' },
  { id: 'income', label: 'Income', color: '#2f6b4f' },
  { id: 'saving', label: 'To savings', color: '#33617e' },
];

export const categoryById = (id) => CATEGORIES.find((c) => c.id === id) || { id, label: id, color: '#8a978f' };

// Monthly budget per spending category, in dollars.
export const DEFAULT_BUDGETS = {
  housing: 1850, groceries: 720, dining: 260, transport: 310, utilities: 340,
  entertainment: 150, health: 200, kids: 380, shopping: 220, subscriptions: 96,
  pets: 90, gifts: 120,
};

// Savings goals: what is being saved for, the target, and what is already set aside.
export const DEFAULT_GOALS = [
  { id: 'g1', name: 'Emergency fund', target: 12000, saved: 8450, note: 'Six months of essentials, for peace of mind.' },
  { id: 'g2', name: 'Family vacation', target: 3200, saved: 1975, note: 'A week at the coast next summer.' },
  { id: 'g3', name: 'New family car', target: 9500, saved: 2300, note: 'Replace the 2014 hatchback before it gives up.' },
  { id: 'g4', name: 'Home refresh', target: 1500, saved: 640, note: 'Paint, a rug, and a bookshelf for the living room.' },
];

// Regular bills. `day` is the day of the month it falls due; `paid` is tracked
// per month inside the store, so a bill shows as paid once its month is covered.
export const BILLS = [
  { id: 'b1', name: 'Rent — Maple Street apartment', amount: 1850, day: 1 },
  { id: 'b2', name: 'Electric — City Power', amount: 132, day: 18 },
  { id: 'b3', name: 'Internet — NorthLink fibre', amount: 79, day: 12 },
  { id: 'b4', name: 'Water — City Water', amount: 64, day: 21 },
  { id: 'b5', name: 'Phones — two lines', amount: 112, day: 9 },
  { id: 'b6', name: 'Home insurance', amount: 96, day: 27 },
];

// Rows are [date, payee, category, amount, kind]: kind is "in" (money in),
// "out" (money out) or "save" (moved to a savings goal, not spending).
const RAW_TRANSACTIONS = [
  // ---- September 2026 ----
  ['2026-09-01', 'Maple Street rent', 'housing', 1850, 'out'],
  ['2026-09-01', 'Maya — salary', 'income', 5200, 'in'],
  ['2026-09-03', 'GreenMart weekly shop', 'groceries', 164.20, 'out'],
  ['2026-09-05', 'City Power — electric', 'utilities', 118.40, 'out'],
  ['2026-09-06', 'Corner Bakery lunch', 'dining', 34.50, 'out'],
  ['2026-09-08', 'Shell — petrol', 'transport', 52.10, 'out'],
  ['2026-09-10', 'GreenMart weekly shop', 'groceries', 141.75, 'out'],
  ['2026-09-12', 'NorthLink internet', 'utilities', 79, 'out'],
  ['2026-09-14', 'Cinema — family night', 'entertainment', 46, 'out'],
  ['2026-09-15', 'Daniel — salary', 'income', 4150, 'in'],
  ['2026-09-16', 'Pharmacy — flu jabs', 'health', 58, 'out'],
  ['2026-09-17', 'GreenMart weekly shop', 'groceries', 178.90, 'out'],
  ['2026-09-19', 'School lunch money — Sofia', 'kids', 60, 'out'],
  ['2026-09-21', 'Trattoria Roma dinner', 'dining', 72.40, 'out'],
  ['2026-09-23', 'Metro cards top-up', 'transport', 60, 'out'],
  ['2026-09-24', 'GreenMart weekly shop', 'groceries', 152.30, 'out'],
  ['2026-09-25', 'Dance class — Sofia', 'kids', 140, 'out'],
  ['2026-09-26', 'Bookshop — Leo birthday books', 'shopping', 42.80, 'out'],
  ['2026-09-28', 'To emergency fund', 'saving', 500, 'save'],
  // ---- October 2026 ----
  ['2026-10-01', 'Maple Street rent', 'housing', 1850, 'out'],
  ['2026-10-01', 'Maya — salary', 'income', 5200, 'in'],
  ['2026-10-02', 'GreenMart weekly shop', 'groceries', 171.45, 'out'],
  ['2026-10-04', 'Vet — Milo check-up', 'pets', 95, 'out'],
  ['2026-10-05', 'City Power — electric', 'utilities', 124.60, 'out'],
  ['2026-10-07', 'Sushi Bar lunch', 'dining', 48.90, 'out'],
  ['2026-10-09', 'GreenMart weekly shop', 'groceries', 158.20, 'out'],
  ['2026-10-11', 'Shell — petrol', 'transport', 47.80, 'out'],
  ['2026-10-12', 'NorthLink internet', 'utilities', 79, 'out'],
  ['2026-10-13', 'Gym — family membership', 'subscriptions', 42, 'out'],
  ['2026-10-15', 'Daniel — salary', 'income', 4150, 'in'],
  ['2026-10-16', 'GreenMart weekly shop', 'groceries', 183.60, 'out'],
  ['2026-10-17', 'School trip — Sofia', 'kids', 85, 'out'],
  ['2026-10-19', 'Dentist — Leo check-up', 'health', 120, 'out'],
  ['2026-10-20', 'Freelance — Maya design work', 'income', 480, 'in'],
  ['2026-10-21', 'Pizza night', 'dining', 41.20, 'out'],
  ['2026-10-23', 'GreenMart weekly shop', 'groceries', 149.90, 'out'],
  ['2026-10-24', 'Winter coats — kids', 'shopping', 132.50, 'out'],
  ['2026-10-26', 'Pet food — Milo', 'pets', 48.40, 'out'],
  ['2026-10-28', 'To family vacation fund', 'saving', 300, 'save'],
  ['2026-10-30', 'GreenMart weekly shop', 'groceries', 166.30, 'out'],
  // ---- November 2026 (the current month) ----
  ['2026-11-01', 'Maple Street rent', 'housing', 1850, 'out'],
  ['2026-11-01', 'Maya — salary', 'income', 5200, 'in'],
  ['2026-11-02', 'GreenMart weekly shop', 'groceries', 174.85, 'out'],
  ['2026-11-03', 'City Power — electric', 'utilities', 131.90, 'out'],
  ['2026-11-04', 'Shell — petrol', 'transport', 44.60, 'out'],
  ['2026-11-05', 'Pharmacy — vitamins', 'health', 46.20, 'out'],
  ['2026-11-06', 'Corner Bakery lunch', 'dining', 28.75, 'out'],
  ['2026-11-07', 'GreenMart weekly shop', 'groceries', 162.40, 'out'],
  ['2026-11-09', 'Phones — two lines', 'utilities', 112, 'out'],
  ['2026-11-10', 'Dance class — Sofia', 'kids', 140, 'out'],
  ['2026-11-11', 'Board game night — new game', 'entertainment', 34.99, 'out'],
  ['2026-11-12', 'NorthLink internet', 'utilities', 79, 'out'],
  ['2026-11-13', 'GreenMart weekly shop', 'groceries', 188.15, 'out'],
  ['2026-11-14', 'Metro cards top-up', 'transport', 60, 'out'],
  ['2026-11-15', 'Daniel — salary', 'income', 4150, 'in'],
  ['2026-11-16', 'School lunch money — Sofia & Leo', 'kids', 60, 'out'],
  ['2026-11-17', 'Trattoria Roma dinner', 'dining', 68.30, 'out'],
  ['2026-11-18', 'Cinema — family night', 'entertainment', 38, 'out'],
  ['2026-11-19', 'GreenMart weekly shop', 'groceries', 157.60, 'out'],
  ['2026-11-20', 'Freelance — Maya design work', 'income', 640, 'in'],
  ['2026-11-20', 'To emergency fund', 'saving', 400, 'save'],
  ['2026-11-21', 'Pet food — Milo', 'pets', 48.40, 'out'],
  ['2026-11-22', 'Winter boots — Leo', 'shopping', 86.90, 'out'],
  ['2026-11-23', 'Shell — petrol', 'transport', 39.40, 'out'],
  ['2026-11-24', 'GreenMart weekly shop', 'groceries', 169.75, 'out'],
  ['2026-11-25', 'Gift — Grandma birthday', 'gifts', 60, 'out'],
  ['2026-11-26', 'Refund — returned headphones', 'income', 38, 'in'],
];

export function seedState() {
  const transactions = RAW_TRANSACTIONS.map(([date, payee, category, amount, kind], i) => ({
    id: `t${i + 1}`, date, payee, category, amount, kind,
  }));
  return {
    version: 2,
    transactions,
    budgets: { ...DEFAULT_BUDGETS },
    goals: DEFAULT_GOALS.map((g) => ({ ...g })),
    nextId: transactions.length + 1,
  };
}

// ---- the store: load, save, reset, and small helpers the views use ----

const STORAGE_KEY = 'hearthledger-v2';

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.transactions) || !parsed.budgets) return seedState();
    return parsed;
  } catch {
    return seedState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or a full store: the page still works for this visit.
  }
}

export function resetState() {
  const fresh = seedState();
  saveState(fresh);
  return fresh;
}

export const monthOf = (date) => date.slice(0, 7);

export const monthLabel = (month) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export function monthTotals(state, month) {
  let income = 0;
  let spending = 0;
  let saving = 0;
  for (const t of state.transactions) {
    if (monthOf(t.date) !== month) continue;
    if (t.kind === 'in') income += t.amount;
    else if (t.kind === 'out') spending += t.amount;
    else if (t.kind === 'save') saving += t.amount;
  }
  const round = (n) => Math.round(n * 100) / 100;
  return { income: round(income), spending: round(spending), saving: round(saving) };
}

export function spendingByCategory(state, month) {
  const totals = {};
  for (const t of state.transactions) {
    if (t.kind !== 'out' || monthOf(t.date) !== month) continue;
    totals[t.category] = Math.round(((totals[t.category] || 0) + t.amount) * 100) / 100;
  }
  return totals;
}

export const money = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const moneyShort = (n) => '$' + Math.round(Number(n)).toLocaleString('en-US');

export const prettyDate = (date) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
