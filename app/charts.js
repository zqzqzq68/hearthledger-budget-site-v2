// HearthLedger charts: small SVG builders with no dependencies. Every chart is
// drawn from the numbers it is given, so it always matches the tables beside it.
// (SVG is built as strings, so there is no namespace constant to fetch or name.)

// Donut of spending by category. `slices` is [{ label, value, color }].
// Returns an SVG string; the centre shows the total.
export function donutChart(slices, size = 190) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="No spending yet this month">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 14}" fill="none" stroke="#e4ddcc" stroke-width="26"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="15" fill="#5a6b62">No spending</text>
    </svg>`;
  }
  const radius = size / 2 - 14;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;
  let offset = 0;
  const rings = slices.map((slice) => {
    const fraction = slice.value / total;
    const length = Math.max(fraction * circumference - 2, 0.5);
    const dash = `${length} ${circumference - length}`;
    const dashOffset = -offset * circumference;
    offset += fraction;
    return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${slice.color}" stroke-width="26"
      stroke-dasharray="${dash}" stroke-dashoffset="${dashOffset}" transform="rotate(-90 ${cx} ${cy})">
      <title>${slice.label}: $${slice.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</title>
    </circle>`;
  }).join('\n      ');
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Spending by category">
      ${rings}
      <text x="50%" y="47%" text-anchor="middle" font-size="13" fill="#5a6b62">Spent</text>
      <text x="50%" y="58%" text-anchor="middle" font-size="19" font-weight="800" fill="#22302a">$${total.toLocaleString('en-US', { maximumFractionDigits: 0 })}</text>
    </svg>`;
}

// Grouped bars: for each month, one income bar and one spending bar.
// `months` is [{ label, income, spending }]. Returns an SVG string.
export function monthBars(months, width = 640, height = 260) {
  const padLeft = 56;
  const padBottom = 30;
  const padTop = 16;
  const plotW = width - padLeft - 16;
  const plotH = height - padTop - padBottom;
  const max = Math.max(...months.flatMap((m) => [m.income, m.spending]), 1);
  const niceMax = Math.ceil(max / 2000) * 2000;
  const y = (v) => padTop + plotH - (v / niceMax) * plotH;
  const groupW = plotW / months.length;
  const barW = Math.min(34, groupW / 3.4);
  const gridLines = [0, 0.5, 1].map((f) => {
    const value = Math.round(niceMax * f);
    const yy = y(value);
    return `<line x1="${padLeft}" y1="${yy}" x2="${width - 16}" y2="${yy}" stroke="#e4ddcc" stroke-width="1"/>
      <text x="${padLeft - 8}" y="${yy + 4}" text-anchor="end" font-size="11" fill="#8a978f">${value === 0 ? '$0' : '$' + (value / 1000) + 'k'}</text>`;
  }).join('\n      ');
  const bars = months.map((m, i) => {
    const gx = padLeft + i * groupW + groupW / 2;
    const incomeH = Math.max((m.income / niceMax) * plotH, 2);
    const spendH = Math.max((m.spending / niceMax) * plotH, 2);
    return `<rect x="${(gx - barW - 4).toFixed(1)}" y="${(y(m.income)).toFixed(1)}" width="${barW}" height="${incomeH.toFixed(1)}" rx="4" fill="#2f6b4f">
        <title>${m.label} income: $${m.income.toLocaleString('en-US')}</title>
      </rect>
      <rect x="${(gx + 4).toFixed(1)}" y="${(y(m.spending)).toFixed(1)}" width="${barW}" height="${spendH.toFixed(1)}" rx="4" fill="#c98a2e">
        <title>${m.label} spending: $${m.spending.toLocaleString('en-US')}</title>
      </rect>
      <text x="${gx}" y="${height - 10}" text-anchor="middle" font-size="12" fill="#5a6b62">${m.label}</text>`;
  }).join('\n      ');
  return `<svg width="100%" viewBox="0 0 ${width} ${height}" role="img" aria-label="Income and spending by month" style="max-width:${width}px">
      ${gridLines}
      ${bars}
      <g font-size="12" fill="#5a6b62">
        <rect x="${padLeft}" y="2" width="12" height="12" rx="3" fill="#2f6b4f"/><text x="${padLeft + 18}" y="12">Income</text>
        <rect x="${padLeft + 92}" y="2" width="12" height="12" rx="3" fill="#c98a2e"/><text x="${padLeft + 110}" y="12">Spending</text>
      </g>
    </svg>`;
}

// A thin horizontal bar used for a single budget or goal row: `fraction` 0..1+,
// `tone` is "" (green), "near" (amber) or "over" (red).
export function progressBar(fraction, tone = '') {
  const pct = Math.min(Math.max(fraction * 100, 0), 100);
  return `<div class="bar ${tone}" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct.toFixed(1)}%"></span></div>`;
}
