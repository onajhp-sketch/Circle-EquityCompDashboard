/**
 * Circle Financial Planning — Branded PDF Report Generator
 *
 * Brand spec (derived from CPR document):
 *   Navy:   #1e3a5f   (headings, header bar, table headers)
 *   Gold:   #c9a227   (accent rules, badges, highlights)
 *   White:  #ffffff   (page background, card backgrounds)
 *   Text:   #1a1a2e   (body copy)
 *   Light:  #f4f6f9   (alternating table rows, card fills)
 *   Serif:  "Libre Baskerville", Georgia, serif  (headings)
 *   Sans:   "Inter", system-ui, sans-serif       (body)
 */

import { formatCurrency, type Grant, type TaxAssumptions, calculateGrant, calculateScenarios, type ScenarioInputs } from "./calculations"

// ─── Brand tokens ────────────────────────────────────────────
const B = {
  navy:       "#1e3a5f",
  navyDark:   "#152c4a",
  navyLight:  "#2d4a6f",
  gold:       "#c9a227",
  goldLight:  "#e8d48a",
  white:      "#ffffff",
  offWhite:   "#f8f9fb",
  light:      "#f0f3f7",
  text:       "#1a1a2e",
  textMuted:  "#5a6478",
  border:     "#dce3ed",
  green:      "#1b7a4e",
  greenLight: "#eaf5ef",
  red:        "#b91c1c",
  redLight:   "#fef2f2",
  serif:      `'Libre Baskerville', Georgia, 'Times New Roman', serif`,
  sans:       `'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif`,
  mono:       `'Geist Mono', 'Courier New', monospace`,
}

// ─── Shared CSS ──────────────────────────────────────────────
const BASE_CSS = `
  @page {
    size: letter;
    margin: 0;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    font-family: ${B.sans};
    font-size: 13px;
    line-height: 1.6;
    color: ${B.text};
    background: ${B.white};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── Page wrapper ── */
  .page {
    width: 8.5in;
    min-height: 11in;
    padding: 0;
    position: relative;
    page-break-after: always;
  }
  .page:last-child { page-break-after: auto; }

  /* ── Cover page ── */
  .cover {
    display: flex;
    flex-direction: column;
    min-height: 11in;
    background: ${B.white};
  }
  .cover-header {
    background: ${B.navy};
    padding: 40px 64px 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .cover-logo {
    height: 60px;
    width: auto;
    filter: brightness(0) invert(1);
  }
  .cover-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px;
    gap: 0;
  }
  .cover-gold-rule {
    width: 80px;
    height: 3px;
    background: ${B.gold};
    border-radius: 2px;
    margin-bottom: 32px;
  }
  .cover-eyebrow {
    font-family: ${B.sans};
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: ${B.gold};
    margin-bottom: 16px;
  }
  .cover-title {
    font-family: ${B.serif};
    font-size: 38px;
    font-weight: 700;
    color: ${B.navy};
    text-align: center;
    line-height: 1.2;
    margin-bottom: 12px;
    letter-spacing: -0.5px;
  }
  .cover-subtitle {
    font-family: ${B.sans};
    font-size: 14px;
    color: ${B.textMuted};
    text-align: center;
    margin-bottom: 48px;
  }
  .cover-card {
    background: ${B.light};
    border: 1px solid ${B.border};
    border-top: 3px solid ${B.gold};
    border-radius: 12px;
    padding: 28px 40px;
    text-align: center;
    min-width: 380px;
    max-width: 480px;
  }
  .cover-card-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: ${B.gold};
    margin-bottom: 10px;
  }
  .cover-client-name {
    font-family: ${B.serif};
    font-size: 24px;
    font-weight: 700;
    color: ${B.navy};
    margin-bottom: 8px;
  }
  .cover-meta {
    font-size: 12px;
    color: ${B.textMuted};
    line-height: 1.7;
  }
  .cover-meta strong { color: ${B.navy}; font-weight: 600; }
  .cover-footer {
    background: ${B.navy};
    padding: 20px 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .cover-footer-left {
    font-family: ${B.serif};
    font-size: 13px;
    font-style: italic;
    color: ${B.gold};
  }
  .cover-footer-right {
    font-size: 10px;
    color: rgba(255,255,255,0.55);
    text-align: right;
    line-height: 1.6;
  }

  /* ── Content page shell ── */
  .content-page {
    min-height: 11in;
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  .page-header {
    background: ${B.navy};
    padding: 18px 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .page-header-logo {
    height: 36px;
    width: auto;
    filter: brightness(0) invert(1);
  }
  .page-header-meta {
    text-align: right;
    font-size: 11px;
    color: rgba(255,255,255,0.7);
    line-height: 1.6;
  }
  .page-header-meta strong { color: ${B.gold}; font-weight: 600; }
  .page-content {
    flex: 1;
    padding: 40px 48px;
  }
  .page-footer {
    border-top: 1px solid ${B.border};
    padding: 12px 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 10px;
    color: ${B.textMuted};
  }
  .page-footer-brand { color: ${B.navy}; font-weight: 600; font-size: 10px; }

  /* ── Section ── */
  .section { margin-bottom: 36px; }
  .section-title {
    font-family: ${B.serif};
    font-size: 17px;
    font-weight: 700;
    color: ${B.navy};
    padding-bottom: 10px;
    border-bottom: 2px solid ${B.gold};
    margin-bottom: 18px;
    letter-spacing: -0.2px;
  }
  .gold-rule {
    height: 2px;
    background: linear-gradient(90deg, ${B.gold}, ${B.goldLight}, transparent);
    border: none;
    margin: 24px 0;
  }

  /* ── Metric cards ── */
  .metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 24px; }
  .metric-card {
    border: 1px solid ${B.border};
    border-radius: 10px;
    padding: 18px 20px;
    background: ${B.offWhite};
  }
  .metric-card.highlight { border-top: 3px solid ${B.gold}; }
  .metric-card.positive  { border-top: 3px solid ${B.green}; background: ${B.greenLight}; }
  .metric-card.negative  { border-top: 3px solid ${B.red};   background: ${B.redLight}; }
  .metric-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: ${B.textMuted};
    margin-bottom: 6px;
  }
  .metric-value {
    font-family: ${B.serif};
    font-size: 26px;
    font-weight: 700;
    color: ${B.navy};
    line-height: 1;
    margin-bottom: 4px;
  }
  .metric-value.green { color: ${B.green}; }
  .metric-value.red   { color: ${B.red}; }
  .metric-desc { font-size: 11px; color: ${B.textMuted}; line-height: 1.5; }

  /* ── Tables ── */
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; border-radius: 8px; overflow: hidden; }
  thead tr { background: ${B.navy}; color: ${B.white}; }
  th { padding: 11px 14px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
  th:last-child, td:last-child { text-align: right; }
  td { padding: 11px 14px; border-bottom: 1px solid ${B.border}; }
  tbody tr:nth-child(even) { background: ${B.light}; }
  tfoot td { background: ${B.light}; border-top: 2px solid ${B.navy}; font-weight: 700; color: ${B.navy}; }

  /* ── Grant type badges ── */
  .badge {
    display: inline-block;
    padding: 2px 9px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .badge-rsu  { background: #dcfce7; color: #15803d; }
  .badge-iso  { background: #f3e8ff; color: #7e22ce; }
  .badge-nso  { background: #dbeafe; color: #1d4ed8; }
  .badge-espp { background: #fef9c3; color: #a16207; }

  /* ── Strategy cards ── */
  .strategy-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px; }
  .strategy-card { border: 1px solid ${B.border}; border-radius: 10px; padding: 18px; }
  .strategy-card.selected { border: 2px solid ${B.gold}; background: #fffbeb; }
  .strategy-title { font-family: ${B.serif}; font-size: 14px; font-weight: 700; color: ${B.navy}; margin-bottom: 4px; }
  .strategy-sub { font-size: 10px; color: ${B.textMuted}; margin-bottom: 12px; }
  .strategy-selected-badge {
    display: inline-block; padding: 2px 8px; background: ${B.gold}; color: ${B.white};
    font-size: 9px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
    border-radius: 3px; margin-bottom: 10px;
  }
  .strategy-row { display: flex; justify-content: space-between; font-size: 11px; padding: 4px 0; border-bottom: 1px solid ${B.border}; }
  .strategy-row:last-child { border-bottom: none; }
  .strategy-row-label { color: ${B.textMuted}; }
  .strategy-row-value { font-weight: 600; color: ${B.navy}; font-family: ${B.mono}; font-size: 11px; }
  .strategy-row-value.green { color: ${B.green}; }
  .strategy-row-value.red   { color: ${B.red}; }

  /* ── Disclosure box ── */
  .disclosure {
    background: ${B.light};
    border: 1px solid ${B.border};
    border-left: 3px solid ${B.gold};
    border-radius: 8px;
    padding: 16px 18px;
    margin-top: 32px;
  }
  .disclosure-title {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: ${B.navy};
    margin-bottom: 6px;
  }
  .disclosure p { font-size: 10px; color: ${B.textMuted}; line-height: 1.7; }

  /* ── Risk badges ── */
  .risk-badge {
    display: inline-block; padding: 3px 10px; border-radius: 4px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
  }
  .risk-high   { background: #fef2f2; color: ${B.red}; border: 1px solid #fecaca; }
  .risk-ok     { background: ${B.greenLight}; color: ${B.green}; border: 1px solid #bbf7d0; }
  .risk-warn   { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }

  /* ── Vest calendar ── */
  .vest-row {
    display: flex; align-items: center; gap: 16px;
    background: ${B.white}; border: 1px solid ${B.border};
    border-radius: 8px; padding: 12px 16px; margin-bottom: 8px;
  }
  .vest-date-box { text-align: center; min-width: 52px; }
  .vest-date-month { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: ${B.textMuted}; }
  .vest-date-day   { font-family: ${B.serif}; font-size: 26px; font-weight: 700; color: ${B.navy}; line-height: 1; }
  .vest-date-year  { font-size: 10px; color: ${B.textMuted}; }
  .vest-divider    { width: 1px; height: 40px; background: ${B.border}; }
  .vest-info       { flex: 1; }
  .vest-amount     { text-align: right; }
  .vest-amount-label  { font-size: 10px; color: ${B.textMuted}; margin-bottom: 3px; }
  .vest-amount-value  { font-family: ${B.serif}; font-size: 16px; font-weight: 700; color: ${B.green}; }
  .vest-days          { font-size: 10px; color: ${B.textMuted}; }
`

// ─── Helper builders ─────────────────────────────────────────

function pageHeader(logoUrl: string, clientName: string, company: string, date: string) {
  return `
    <div class="page-header">
      <img src="${logoUrl}" alt="Circle Financial Planning" class="page-header-logo" />
      <div class="page-header-meta">
        <strong>${clientName}</strong><br/>
        ${company}<br/>${date}
      </div>
    </div>`
}

function pageFooter(date: string) {
  return `
    <div class="page-footer">
      <span class="page-footer-brand">Circle Financial Planning, Inc.</span>
      <span>Confidential — For Client Use Only</span>
      <span>${date}</span>
    </div>`
}

function badgeHtml(type: string) {
  const cls = type === "RSU" ? "badge-rsu" : type === "ISO" ? "badge-iso" : type === "NSO" ? "badge-nso" : "badge-espp"
  return `<span class="badge ${cls}">${type}</span>`
}

function coverPage(
  logoUrl: string,
  reportTitle: string,
  clientName: string,
  preparedBy: string,
  date: string,
  company: string,
) {
  return `
    <div class="page cover">
      <div class="cover-header">
        <img src="${logoUrl}" alt="Circle Financial Planning" class="cover-logo" />
      </div>
      <div class="cover-body">
        <div class="cover-gold-rule"></div>
        <p class="cover-eyebrow">Circle Financial Planning</p>
        <h1 class="cover-title">${reportTitle}</h1>
        <p class="cover-subtitle">Equity Compensation Analysis &amp; Planning</p>
        <div class="cover-card">
          <p class="cover-card-label">Prepared For</p>
          <p class="cover-client-name">${clientName}</p>
          <p class="cover-meta">
            ${company ? `<strong>${company}</strong><br/>` : ""}
            ${date}<br/>
            Prepared by: <strong>${preparedBy}</strong>
          </p>
        </div>
      </div>
      <div class="cover-footer">
        <span class="cover-footer-left">Boutique Care. Institutional Insight.</span>
        <span class="cover-footer-right">
          317-841-0370 &nbsp;·&nbsp; circle@moneyconcepts.com &nbsp;·&nbsp; circleplanner.com<br/>
          Confidential — For Client Use Only
        </span>
      </div>
    </div>`
}

function disclosure() {
  return `
    <div class="disclosure">
      <p class="disclosure-title">Important Disclosure</p>
      <p>This report is for informational purposes only and does not constitute tax, legal, or investment advice.
      Projections and calculations are based on assumptions that may not reflect actual market conditions or individual
      circumstances. Past performance is not indicative of future results. Please consult with qualified tax, legal,
      and financial professionals before making any decisions regarding your equity compensation.
      Circle Financial Planning, Inc. is a registered investment adviser. Registration does not imply a certain level
      of skill or training. All securities offered through Money Concepts Capital Corp., Member FINRA/SIPC.</p>
    </div>`
}

// ─── Section builders ────────────────────────────────────────

export function buildEquitySummaryReport(params: {
  reportTitle: string
  clientName: string
  company: string
  preparedBy: string
  preparedFor: string
  date: string
  logoUrl: string
  grants: Grant[]
  taxAssumptions: TaxAssumptions
  totals: { income: number; tax: number; cash: number; afterTax: number }
  preferredStrategy?: string | null
  scenarioInputs: ScenarioInputs
  concentrationThreshold: number
  liquidityTarget: number
  suggestedActions?: Array<{ title: string; priority: string; status: string; description: string; impact?: string }>
}): string {
  const {
    reportTitle, clientName, company, preparedBy, preparedFor,
    date, logoUrl, grants, taxAssumptions, totals,
    preferredStrategy, scenarioInputs, concentrationThreshold, liquidityTarget,
    suggestedActions = [],
  } = params

  const displayName = preparedFor || clientName
  const displayCompany = company || ""

  const scenarios = calculateScenarios(scenarioInputs)
  const strategyNames: Record<string, string> = {
    sellNow: "Sell Now — Liquidity First",
    hold:    "Hold 12+ Months — Tax Optimization",
    staged:  "Staged Sale — Balanced Approach",
  }

  // ── KPI section ──
  const kpiSection = `
    <div class="section">
      <p class="section-title">Key Financial Metrics</p>
      <div class="metric-grid">
        <div class="metric-card">
          <p class="metric-label">Ordinary / AMT Income</p>
          <p class="metric-value">${formatCurrency(totals.income)}</p>
          <p class="metric-desc">Total taxable compensation across all grants</p>
        </div>
        <div class="metric-card negative">
          <p class="metric-label">Estimated Tax Liability</p>
          <p class="metric-value red">${formatCurrency(totals.tax)}</p>
          <p class="metric-desc">Federal, state, FICA, Medicare &amp; surtax</p>
        </div>
        <div class="metric-card">
          <p class="metric-label">Cash to Exercise</p>
          <p class="metric-value">${formatCurrency(totals.cash)}</p>
          <p class="metric-desc">Strike price outlay required to exercise options</p>
        </div>
        <div class="metric-card positive highlight">
          <p class="metric-label">Net After-Tax Value</p>
          <p class="metric-value green">${formatCurrency(totals.afterTax)}</p>
          <p class="metric-desc">Estimated take-home after all taxes and exercise costs</p>
        </div>
      </div>
    </div>`

  // ── Grant inventory ──
  const grantRows = grants.map((g) => {
    const calc = calculateGrant(g, taxAssumptions)
    return `<tr>
      <td>${badgeHtml(g.type)}</td>
      <td style="font-family:${B.mono}">${g.symbol || "N/A"}</td>
      <td style="text-align:right;font-family:${B.mono}">${g.shares.toLocaleString()}</td>
      <td style="text-align:right;font-family:${B.mono}">$${(g.strike || 0).toLocaleString()}</td>
      <td style="text-align:right;font-family:${B.mono}">$${(g.fmvAtVest || taxAssumptions.currentPrice).toLocaleString()}</td>
      <td style="text-align:right;font-family:${B.mono};color:${B.green};font-weight:600">${formatCurrency(calc.afterTax)}</td>
    </tr>`
  }).join("")

  const grantSection = `
    <div class="section">
      <p class="section-title">Grant Inventory</p>
      <table>
        <thead><tr>
          <th>Type</th><th>Symbol</th>
          <th style="text-align:right">Shares</th>
          <th style="text-align:right">Strike</th>
          <th style="text-align:right">FMV</th>
          <th style="text-align:right">After-Tax Value</th>
        </tr></thead>
        <tbody>${grantRows}</tbody>
        <tfoot><tr>
          <td colspan="2">Total</td>
          <td style="text-align:right;font-family:${B.mono}">${grants.reduce((s, g) => s + g.shares, 0).toLocaleString()}</td>
          <td colspan="2"></td>
          <td style="text-align:right;font-family:${B.mono};color:${B.green}">${formatCurrency(totals.afterTax)}</td>
        </tr></tfoot>
      </table>
    </div>`

  // ── Preferred strategy ──
  const strategySection = preferredStrategy && scenarios[preferredStrategy as keyof typeof scenarios] ? (() => {
    const s = scenarios[preferredStrategy as keyof typeof scenarios]
    return `
      <div class="section">
        <p class="section-title">Recommended Exercise Strategy</p>
        <div class="strategy-grid">
          ${["sellNow", "hold", "staged"].map((id) => {
            const sd = scenarios[id as keyof typeof scenarios]
            const isSelected = id === preferredStrategy
            return `
              <div class="strategy-card ${isSelected ? "selected" : ""}">
                <p class="strategy-title">${id === "sellNow" ? "Sell Now" : id === "hold" ? "Hold 12+" : "Staged"}</p>
                <p class="strategy-sub">${id === "sellNow" ? "Liquidity First" : id === "hold" ? "Tax Optimization" : "Balanced Approach"}</p>
                ${isSelected ? `<span class="strategy-selected-badge">Selected</span>` : ""}
                <div class="strategy-row"><span class="strategy-row-label">Estimated Tax</span><span class="strategy-row-value red">${formatCurrency(sd.tax)}</span></div>
                <div class="strategy-row"><span class="strategy-row-label">Cash Required</span><span class="strategy-row-value">${formatCurrency(sd.cash)}</span></div>
                <div class="strategy-row"><span class="strategy-row-label">After-Tax Value</span><span class="strategy-row-value green">${formatCurrency(sd.afterTax)}</span></div>
              </div>`
          }).join("")}
        </div>
      </div>`
  })() : ""

  // ── Action items ──
  const activeActions = suggestedActions.filter((a) => a.status !== "dismissed").slice(0, 8)
  const actionsSection = activeActions.length > 0 ? `
    <div class="section">
      <p class="section-title">Action Items</p>
      <table>
        <thead><tr><th>Priority</th><th>Action</th><th>Status</th><th style="text-align:right">Impact</th></tr></thead>
        <tbody>
          ${activeActions.map((a) => `<tr>
            <td><span class="risk-badge ${a.priority === "high" ? "risk-high" : a.priority === "medium" ? "risk-warn" : "risk-ok"}">${a.priority.toUpperCase()}</span></td>
            <td>
              <div style="font-weight:600;font-size:12px">${a.title}</div>
              <div style="font-size:10px;color:${B.textMuted};margin-top:2px">${a.description.slice(0, 90)}${a.description.length > 90 ? "…" : ""}</div>
            </td>
            <td style="font-size:11px;color:${B.textMuted}">${a.status === "in-progress" ? "In Progress" : a.status.charAt(0).toUpperCase() + a.status.slice(1)}</td>
            <td style="text-align:right;font-family:${B.mono};color:${B.green};font-size:11px">${a.impact || "—"}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>` : ""

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${reportTitle} — Circle Financial Planning</title>
  <style>${BASE_CSS}</style>
</head>
<body>
  ${coverPage(logoUrl, reportTitle, displayName, preparedBy || "Circle Financial Planning", date, displayCompany)}

  <div class="page content-page">
    ${pageHeader(logoUrl, displayName, displayCompany, date)}
    <div class="page-content">
      ${kpiSection}
      <hr class="gold-rule"/>
      ${grantSection}
      ${strategySection}
      ${actionsSection}
      ${disclosure()}
    </div>
    ${pageFooter(date)}
  </div>
</body>
</html>`

  return html
}

export function buildVestingCalendarReport(params: {
  reportTitle: string; clientName: string; company: string
  preparedBy: string; preparedFor: string; date: string; logoUrl: string
  grants: Grant[]; taxAssumptions: TaxAssumptions
}): string {
  const { reportTitle, clientName, company, preparedBy, preparedFor, date, logoUrl, grants, taxAssumptions } = params
  const displayName = preparedFor || clientName
  const now = new Date()
  const sorted = [...grants].sort((a, b) => new Date(a.vestDate).getTime() - new Date(b.vestDate).getTime())
  const upcoming = sorted.filter((g) => new Date(g.vestDate) >= now)
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

  const vestRows = upcoming.slice(0, 10).map((g) => {
    const calc = calculateGrant(g, taxAssumptions)
    const vd = new Date(g.vestDate)
    const daysUntil = Math.ceil((vd.getTime() - now.getTime()) / 86400000)
    return `
      <div class="vest-row" style="border-left:3px solid ${g.type==="RSU"?"#16a34a":g.type==="ISO"?"#7e22ce":g.type==="NSO"?"#1d4ed8":"#a16207"}">
        <div class="vest-date-box">
          <div class="vest-date-month">${months[vd.getMonth()]}</div>
          <div class="vest-date-day">${vd.getDate()}</div>
          <div class="vest-date-year">${vd.getFullYear()}</div>
        </div>
        <div class="vest-divider"></div>
        <div class="vest-info">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
            ${badgeHtml(g.type)}
            <span style="font-family:${B.mono};font-size:11px;color:${B.textMuted}">${g.symbol || ""}</span>
          </div>
          <div style="font-size:13px"><strong>${g.shares.toLocaleString()}</strong> shares vest</div>
        </div>
        <div class="vest-amount">
          <div class="vest-amount-label">Est. After-Tax</div>
          <div class="vest-amount-value">${formatCurrency(calc.afterTax)}</div>
          <div class="vest-days" style="color:${daysUntil<=30?"#c2410c":B.textMuted}">${daysUntil} days</div>
        </div>
      </div>`
  }).join("")

  const tableRows = sorted.map((g) => {
    const calc = calculateGrant(g, taxAssumptions)
    const vd = new Date(g.vestDate)
    const isPast = vd < now
    const daysUntil = Math.ceil((vd.getTime() - now.getTime()) / 86400000)
    return `<tr style="opacity:${isPast?0.55:1}">
      <td>${vd.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</td>
      <td>${badgeHtml(g.type)}</td>
      <td style="font-family:${B.mono}">${g.symbol||"N/A"}</td>
      <td style="text-align:right;font-family:${B.mono}">${g.shares.toLocaleString()}</td>
      <td style="text-align:right;font-family:${B.mono};color:${B.green};font-weight:600">${formatCurrency(calc.afterTax)}</td>
      <td style="text-align:right;font-size:11px;color:${isPast?B.textMuted:daysUntil<=30?"#c2410c":B.navy}">${isPast?"Vested":`${daysUntil}d`}</td>
    </tr>`
  }).join("")

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>${reportTitle} — Circle Financial Planning</title><style>${BASE_CSS}</style></head>
<body>
  ${coverPage(logoUrl, reportTitle, displayName, preparedBy || "Circle Financial Planning", date, company)}
  <div class="page content-page">
    ${pageHeader(logoUrl, displayName, company, date)}
    <div class="page-content">
      <div class="section">
        <p class="section-title">Upcoming Vest Events</p>
        ${vestRows || `<p style="color:${B.textMuted};font-style:italic">No upcoming vest events.</p>`}
      </div>
      <hr class="gold-rule"/>
      <div class="section">
        <p class="section-title">Complete Vesting Schedule</p>
        <table>
          <thead><tr><th>Vest Date</th><th>Type</th><th>Symbol</th><th style="text-align:right">Shares</th><th style="text-align:right">After-Tax</th><th style="text-align:right">Status</th></tr></thead>
          <tbody>${tableRows}</tbody>
          <tfoot><tr>
            <td colspan="3">Upcoming Total</td>
            <td style="text-align:right;font-family:${B.mono}">${upcoming.reduce((s,g)=>s+g.shares,0).toLocaleString()}</td>
            <td style="text-align:right;font-family:${B.mono};color:${B.green}">${formatCurrency(upcoming.reduce((s,g)=>s+calculateGrant(g,taxAssumptions).afterTax,0))}</td>
            <td></td>
          </tr></tfoot>
        </table>
      </div>
      ${disclosure()}
    </div>
    ${pageFooter(date)}
  </div>
</body>
</html>`
  return html
}

export function buildBlackoutReport(params: {
  reportTitle: string; clientName: string; company: string
  preparedBy: string; preparedFor: string; date: string; logoUrl: string
  blackouts: Array<{ id: string; startDate: string; endDate: string; reason: string }>
}): string {
  const { reportTitle, clientName, company, preparedBy, preparedFor, date, logoUrl, blackouts } = params
  const displayName = preparedFor || clientName

  const rows = blackouts.length > 0
    ? blackouts.map((b) => `<tr>
        <td>${new Date(b.startDate).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</td>
        <td>${new Date(b.endDate).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</td>
        <td>${b.reason || "—"}</td>
      </tr>`).join("")
    : `<tr><td colspan="3" style="text-align:center;color:${B.textMuted};font-style:italic;padding:24px">No blackout windows currently scheduled.</td></tr>`

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>${reportTitle} — Circle Financial Planning</title><style>${BASE_CSS}</style></head>
<body>
  ${coverPage(logoUrl, reportTitle, displayName, preparedBy || "Circle Financial Planning", date, company)}
  <div class="page content-page">
    ${pageHeader(logoUrl, displayName, company, date)}
    <div class="page-content">
      <div class="section">
        <p class="section-title">Trading Blackout Schedule</p>
        <table>
          <thead><tr><th>Start Date</th><th>End Date</th><th>Reason / Event</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${disclosure()}
    </div>
    ${pageFooter(date)}
  </div>
</body>
</html>`
  return html
}
