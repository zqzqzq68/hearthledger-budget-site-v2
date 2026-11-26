# HearthLedger — Household Budget Site

[![make.fun · best-household-budget-site-20261126-1457](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/zqzqzq68/hearthledger-budget-site/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/zqzqzq68/hearthledger-budget-site/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)

HearthLedger is a household budget site for the whole family. It runs entirely
from static files in a browser — desktop or phone — with no network requests,
no accounts, and no data leaving the device. Entry for the
[make.fun bounty “Make the best household budget site”](https://make.fun/bounty/best-household-budget-site-20261126-1457)
($50, 10 places).

## What it does

The demo books belong to a fictional four-person household, the Alvarez family,
for September–November 2026, and every figure on screen is a real figure from
those books:

- **Dashboard** — money in, money out, what is left to spend, and the savings
  rate for the month; a donut of spending by category; the budgets closest to
  their limit; this month's bills with paid / due-soon status; recent activity.
- **Transactions** — every transaction for the month, searchable and filterable
  by category and type. Add, edit, and delete transactions; the totals, the
  dashboard, and the reports all follow.
- **Budgets** — a monthly limit per category with a progress bar, a remaining
  amount, and over-budget warnings. Change any limit in place, or add a new
  category with its own budget.
- **Goals** — savings goals (emergency fund, vacation, new car, home refresh)
  with progress and a one-click way to move money into a goal.
- **Reports** — income vs spending for three months, spending by category with
  its share of the month and its budget status, top payees, and plain-language
  insights (daily average, projected month-end, savings rate, lightest month).

Everything is stored in the browser's localStorage, so edits survive a reload
and nothing is ever uploaded. “Reset demo data” restores the original books,
and “Download transactions (CSV)” exports them.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Node.js 22.18 or later. No build step, no dependencies, no network.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored make.fun library
(`vendor/makefun-frontend.ts`, copied from the kit unchanged).

## Layout

```text
app/
  index.html   page shell and navigation
  style.css    the whole look, responsive down to a phone
  data.js      demo household, budgets, goals, bills, and the localStorage store
  charts.js    dependency-free SVG donut and bar charts
  views.js     one render function per page
  main.js      hash router, state, and every control
main.ts        hand-in program (Node 22, standard library only)
serve.ts       tiny local static server
screenshots/  renders of the site running (see shots.json)
vendor/
  makefun-frontend.ts   make.fun dossier library, from the kit, unchanged
```

## License

MIT — see [LICENSE](LICENSE).
