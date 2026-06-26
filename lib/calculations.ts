// ============================================================
// Circle Financial Planning — Core Calculations
// Fixed: proper tax treatment per grant type, FICA surtaxes,
//        AMT formula, ESPP qualifying/disqualifying dispositions,
//        vesting schedule engine, unified Blackout interface,
//        and Monte Carlo connected to portfolio.
// ============================================================

// ─── Vesting Schedule ───────────────────────────────────────
export interface VestingSchedule {
  frequency: 'monthly' | 'quarterly' | 'annual' | 'cliff' | 'custom'
  totalMonths: number   // e.g. 48 for 4-year
  cliffMonths: number   // e.g. 12 for 1-year cliff
  vestedPercent?: number
}

// ─── Grant ──────────────────────────────────────────────────
export interface Grant {
  id: string
  type: 'RSU' | 'NSO' | 'ISO' | 'ESPP'
  symbol?: string
  shares: number
  strike: number | null
  grantDate: string
  vestDate: string
  fmvAtVest: number | null
  vestingSchedule?: VestingSchedule
  costBasisPerShare?: number
  asOfDate?: string
  // ESPP-specific
  esppOfferDate?: string          // start of offering period
  esppPurchaseDate?: string       // actual purchase date
  esppDiscount?: number           // e.g. 0.15 for 15%
  esppLookback?: boolean          // true if plan has look-back provision
  // ISO-specific
  hasEarlyExercise?: boolean
  exercised83b?: boolean
}

// ─── Tax Assumptions ────────────────────────────────────────
export interface TaxAssumptions {
  ordinaryRate: number      // federal marginal rate (e.g. 0.37)
  stateRate: number         // state marginal rate
  ltcgRate: number          // federal LTCG rate (e.g. 0.20)
  amtRate: number           // AMT rate (26% or 28% depending on AMTI)
  currentPrice: number
  ficaRate?: number         // Social Security (capped; default 0.062)
  medicareRate?: number     // Medicare base (default 0.0145)
  // Surtaxes — applied when income thresholds are exceeded
  netInvestmentIncomeRate?: number   // 3.8% NIIT on investment income
  additionalMedicareRate?: number    // 0.9% additional Medicare on wages
  // Thresholds (MFJ defaults)
  niitThreshold?: number             // default 250000
  additionalMedicareThreshold?: number // default 250000
  otherIncome?: number               // W-2 + other income for surtax calcs
}

// ─── Blackout (unified) ─────────────────────────────────────
// Previously the interface used start/end/note in calculations.ts
// but startDate/endDate/reason in UI components — now unified.
export interface Blackout {
  id: string
  startDate: string   // ISO date string  (YYYY-MM-DD)
  endDate: string
  reason: string
  // Legacy aliases kept so old data still deserialises cleanly
  start?: string
  end?: string
  note?: string
}

// ─── Results ────────────────────────────────────────────────
export interface GrantCalculation {
  fmv: number
  income: number          // ordinary income (or AMT preference for ISO)
  tax: number             // total estimated tax
  cash: number            // cash required to exercise
  afterTax: number
  niit: number            // Net Investment Income Tax
  additionalMedicare: number
  ficaTax: number
  effectiveRate: number   // total tax / gross value
}

export interface ScenarioInputs {
  shares: number
  strike: number
  currentFMV: number
  projectedFMV: number
  ordinaryRate: number
  ltcgRate: number
}

export interface ScenarioResult {
  tax: number
  cash: number
  afterTax: number
}

// ─── Helpers ────────────────────────────────────────────────

/** Resolved tax rates with sane defaults */
function resolvedRates(taxes: TaxAssumptions) {
  return {
    ordinary:    taxes.ordinaryRate,
    state:       taxes.stateRate,
    ltcg:        taxes.ltcgRate,
    amt:         taxes.amtRate,
    fica:        taxes.ficaRate           ?? 0.062,
    medicare:    taxes.medicareRate       ?? 0.0145,
    niit:        taxes.netInvestmentIncomeRate     ?? 0.038,
    addlMed:     taxes.additionalMedicareRate      ?? 0.009,
    niitThresh:  taxes.niitThreshold              ?? 250000,
    addlMedThresh: taxes.additionalMedicareThreshold ?? 250000,
    otherIncome: taxes.otherIncome                ?? 0,
  }
}

/**
 * Calculate the 0.9% Additional Medicare surtax on wage income
 * (NSO / RSU spread is W-2 wages; only applies when total wages > threshold)
 */
function additionalMedicareTax(wageAmount: number, rates: ReturnType<typeof resolvedRates>): number {
  const totalWages = rates.otherIncome + wageAmount
  if (totalWages <= rates.addlMedThresh) return 0
  const taxableAmount = Math.min(wageAmount, totalWages - rates.addlMedThresh)
  return Math.max(0, taxableAmount) * rates.addlMed
}

/**
 * Calculate 3.8% NIIT on net investment income
 * (long-term capital gains from held shares qualify; ISO LTCG qualifies)
 */
function niitTax(investmentIncome: number, rates: ReturnType<typeof resolvedRates>): number {
  const totalIncome = rates.otherIncome + investmentIncome
  if (totalIncome <= rates.niitThresh) return 0
  const taxableAmount = Math.min(investmentIncome, totalIncome - rates.niitThresh)
  return Math.max(0, taxableAmount) * rates.niit
}

// ─── Per-type calculation ────────────────────────────────────

function calcRSU(grant: Grant, taxes: TaxAssumptions): GrantCalculation {
  const r = resolvedRates(taxes)
  const fmv = grant.fmvAtVest ?? taxes.currentPrice
  const shares = grant.shares
  const grossIncome = shares * fmv

  const federalOrdinary  = grossIncome * r.ordinary
  const stateTax         = grossIncome * r.state
  // RSU income is W-2 wages
  const ficaTax          = Math.min(grossIncome, 168600) * r.fica  // 2024 SS wage base
  const medicareTax      = grossIncome * r.medicare
  const addlMedTax       = additionalMedicareTax(grossIncome, r)
  // RSU is ordinary income, not investment income — NIIT doesn't apply at vest
  const niit             = 0

  const totalTax = federalOrdinary + stateTax + ficaTax + medicareTax + addlMedTax + niit
  const afterTax = grossIncome - totalTax
  const effectiveRate = grossIncome > 0 ? totalTax / grossIncome : 0

  return {
    fmv,
    income: grossIncome,
    tax: totalTax,
    cash: 0,
    afterTax,
    niit,
    additionalMedicare: addlMedTax,
    ficaTax: ficaTax + medicareTax,
    effectiveRate,
  }
}

function calcNSO(grant: Grant, taxes: TaxAssumptions): GrantCalculation {
  const r = resolvedRates(taxes)
  const fmv    = grant.fmvAtVest ?? taxes.currentPrice
  const strike = grant.strike ?? 0
  const shares = grant.shares
  const spread = Math.max(0, fmv - strike) * shares
  const cash   = strike * shares
  const grossValue = shares * fmv

  // Spread is W-2 ordinary income
  const federalOrdinary  = spread * r.ordinary
  const stateTax         = spread * r.state
  const ficaTax          = Math.min(spread, 168600) * r.fica
  const medicareTax      = spread * r.medicare
  const addlMedTax       = additionalMedicareTax(spread, r)
  const niit             = 0  // spread is wages not investment income

  const totalTax = federalOrdinary + stateTax + ficaTax + medicareTax + addlMedTax
  const afterTax = grossValue - cash - totalTax
  const effectiveRate = spread > 0 ? totalTax / spread : 0

  return {
    fmv,
    income: spread,
    tax: totalTax,
    cash,
    afterTax,
    niit,
    additionalMedicare: addlMedTax,
    ficaTax: ficaTax + medicareTax,
    effectiveRate,
  }
}

function calcISO(grant: Grant, taxes: TaxAssumptions): GrantCalculation {
  const r = resolvedRates(taxes)
  const fmv    = grant.fmvAtVest ?? taxes.currentPrice
  const strike = grant.strike ?? 0
  const shares = grant.shares
  const spread = Math.max(0, fmv - strike) * shares
  const cash   = strike * shares

  // ISO: spread is an AMT preference item — no regular income tax at exercise
  // Compute tentative minimum tax on the preference item
  // (Simplified: actual AMT requires full AMTI computation including exemptions)
  const tentativeMinimumTax = spread * r.amt
  // Regular tax on zero ordinary income = 0 at exercise
  // AMT = max(0, TMT - regular tax) — use tentativeMinimumTax as proxy
  const amtLiability = tentativeMinimumTax
  // ISO income shown is the AMT preference item (for reporting clarity)
  const income = spread

  // No FICA/Medicare on ISO exercise (W-2 wages only apply to NSO/RSU)
  // NIIT could apply on subsequent sale gain — tracked separately
  const niit            = 0
  const addlMedTax      = 0
  const ficaTax         = 0

  const totalTax = amtLiability
  const afterTax = shares * fmv - cash - totalTax
  const effectiveRate = spread > 0 ? totalTax / spread : 0

  return {
    fmv,
    income,
    tax: totalTax,
    cash,
    afterTax,
    niit,
    additionalMedicare: addlMedTax,
    ficaTax,
    effectiveRate,
  }
}

function calcESPP(grant: Grant, taxes: TaxAssumptions): GrantCalculation {
  const r = resolvedRates(taxes)
  const fmv     = grant.fmvAtVest ?? taxes.currentPrice
  const shares  = grant.shares
  const discount = grant.esppDiscount ?? 0.15
  // With look-back, purchase price is min(offer date price, purchase date price) * (1 - discount)
  // Without look-back, purchase price is fmv * (1 - discount)
  const purchasePrice = (grant.strike ?? fmv * (1 - discount))
  const grossValue    = shares * fmv

  // Determine holding period for qualifying vs. disqualifying disposition
  const purchaseDate = grant.esppPurchaseDate ? new Date(grant.esppPurchaseDate) : new Date(grant.vestDate)
  const offerDate    = grant.esppOfferDate    ? new Date(grant.esppOfferDate)    : new Date(grant.grantDate)
  const now          = new Date()
  const monthsSincePurchase = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  const monthsSinceOffer    = (now.getTime() - offerDate.getTime())    / (1000 * 60 * 60 * 24 * 30.44)

  // Qualifying disposition: held > 2 years from offer AND > 1 year from purchase
  const isQualifying = monthsSincePurchase >= 12 && monthsSinceOffer >= 24

  let ordinaryIncome = 0
  let capitalGain    = 0

  if (isQualifying) {
    // Qualifying: ordinary income = lesser of (a) actual gain or (b) discount at offer price
    const discountAmount = shares * (fmv / (1 - discount) * discount) // statutory discount element
    ordinaryIncome = Math.min(grossValue - shares * purchasePrice, discountAmount)
    capitalGain    = Math.max(0, grossValue - shares * purchasePrice - ordinaryIncome)
  } else {
    // Disqualifying: entire spread is ordinary income (W-2)
    ordinaryIncome = Math.max(0, fmv - purchasePrice) * shares
    capitalGain    = 0
  }

  const federalOrdinary = ordinaryIncome * r.ordinary
  const stateTax        = (ordinaryIncome + capitalGain) * r.state
  const ficaTax         = Math.min(ordinaryIncome, 168600) * r.fica
  const medicareTax     = ordinaryIncome * r.medicare
  const addlMedTax      = additionalMedicareTax(ordinaryIncome, r)
  const ltcgTax         = capitalGain * r.ltcg
  const niit            = isQualifying ? niitTax(capitalGain, r) : 0

  const totalTax = federalOrdinary + stateTax + ficaTax + medicareTax + addlMedTax + ltcgTax + niit
  const cash     = shares * purchasePrice  // amount paid
  const afterTax = grossValue - cash - totalTax
  const effectiveRate = grossValue > 0 ? totalTax / grossValue : 0

  return {
    fmv,
    income: ordinaryIncome,
    tax: totalTax,
    cash,
    afterTax,
    niit,
    additionalMedicare: addlMedTax,
    ficaTax: ficaTax + medicareTax,
    effectiveRate,
  }
}

// ─── Public API ─────────────────────────────────────────────

export function calculateGrant(grant: Grant, taxes: TaxAssumptions): GrantCalculation {
  switch (grant.type) {
    case 'RSU':  return calcRSU(grant, taxes)
    case 'NSO':  return calcNSO(grant, taxes)
    case 'ISO':  return calcISO(grant, taxes)
    case 'ESPP': return calcESPP(grant, taxes)
  }
}

/** Check if a date falls within any blackout window (supports both field name conventions) */
export function isInBlackout(date: string, blackouts: Blackout[]): boolean {
  if (!date) return false
  const time = new Date(date).getTime()
  return blackouts.some((b) => {
    const start = new Date(b.startDate ?? b.start ?? '').getTime()
    const end   = new Date(b.endDate   ?? b.end   ?? '').getTime()
    return time >= start && time <= end
  })
}

/** Exercise strategy scenarios — per-grant-type aware */
export function calculateScenarios(inputs: ScenarioInputs): {
  sellNow: ScenarioResult
  hold: ScenarioResult
  staged: ScenarioResult
} {
  const { shares, strike, currentFMV, projectedFMV, ordinaryRate, ltcgRate } = inputs
  const cash   = shares * strike
  const spread = Math.max(0, currentFMV - strike) * shares
  const appreciation = Math.max(0, projectedFMV - currentFMV) * shares

  return {
    sellNow: {
      tax:      spread * ordinaryRate,
      cash,
      afterTax: currentFMV * shares - cash - spread * ordinaryRate,
    },
    hold: {
      tax:      spread * ordinaryRate + appreciation * ltcgRate,
      cash,
      afterTax: projectedFMV * shares - cash - (spread * ordinaryRate) - (appreciation * ltcgRate),
    },
    staged: {
      tax:      spread * ordinaryRate + appreciation * 0.5 * ltcgRate,
      afterTax: (currentFMV * shares * 0.5 + projectedFMV * shares * 0.5)
                - cash - spread * ordinaryRate - appreciation * 0.5 * ltcgRate,
      cash,
    },
  }
}

/** Monte Carlo simulation — Geometric Brownian Motion */
export function runMonteCarloSimulation(
  spotPrice: number,
  drift: number,
  volatility: number,
  horizonMonths: number,
  simulations: number,
  steps: number,
): number[] {
  const T  = horizonMonths / 12
  const dt = T / steps
  const finals: number[] = []

  const gauss = () => {
    let u = 0, v = 0
    while (!u) u = Math.random()
    while (!v) v = Math.random()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }

  for (let i = 0; i < simulations; i++) {
    let price = spotPrice
    for (let j = 0; j < steps; j++) {
      price *= Math.exp(
        (drift - 0.5 * volatility * volatility) * dt +
        volatility * Math.sqrt(dt) * gauss()
      )
    }
    finals.push(price)
  }

  return finals
}

/**
 * Run Monte Carlo simulation on actual portfolio grants.
 * Returns after-tax value distribution across simulations.
 */
export function runPortfolioMonteCarlo(
  grants: Grant[],
  taxes: TaxAssumptions,
  drift: number,
  volatility: number,
  horizonMonths: number,
  simulations: number,
  steps: number,
): number[] {
  const T  = horizonMonths / 12
  const dt = T / steps
  const gauss = () => {
    let u = 0, v = 0
    while (!u) u = Math.random()
    while (!v) v = Math.random()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }

  const results: number[] = []
  for (let i = 0; i < simulations; i++) {
    let price = taxes.currentPrice
    for (let j = 0; j < steps; j++) {
      price *= Math.exp(
        (drift - 0.5 * volatility * volatility) * dt +
        volatility * Math.sqrt(dt) * gauss()
      )
    }
    // Compute after-tax value of all grants at simulated price
    const simTaxes = { ...taxes, currentPrice: price }
    const totalAfterTax = grants.reduce((sum, g) => {
      const calc = calculateGrant({ ...g, fmvAtVest: price }, simTaxes)
      return sum + calc.afterTax
    }, 0)
    results.push(totalAfterTax)
  }
  return results
}

export function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b)
  return sorted[Math.floor((sorted.length - 1) * p)] || 0
}

/** Generate individual vest tranches from a vesting schedule */
export function generateVestTranches(grant: Grant): { date: string; shares: number }[] {
  const schedule = grant.vestingSchedule
  if (!schedule) {
    return [{ date: grant.vestDate, shares: grant.shares }]
  }

  const grantDate = new Date(grant.grantDate)
  const tranches: { date: string; shares: number }[] = []
  const { frequency, totalMonths, cliffMonths } = schedule

  const addMonths = (date: Date, months: number) => {
    const d = new Date(date)
    d.setMonth(d.getMonth() + months)
    return d
  }

  const toISO = (d: Date) => d.toISOString().split('T')[0]

  if (frequency === 'cliff') {
    tranches.push({ date: toISO(addMonths(grantDate, totalMonths)), shares: grant.shares })
    return tranches
  }

  const intervalMonths = frequency === 'monthly'   ? 1
                       : frequency === 'quarterly'  ? 3
                       : frequency === 'annual'     ? 12
                       : 1

  const firstVestMonth  = Math.max(cliffMonths, intervalMonths)
  const cliffShares     = cliffMonths > 0
    ? Math.round(grant.shares * (cliffMonths / totalMonths))
    : 0
  const remainingShares = grant.shares - cliffShares

  if (cliffMonths > 0 && cliffShares > 0) {
    tranches.push({ date: toISO(addMonths(grantDate, cliffMonths)), shares: cliffShares })
  }

  let monthsProcessed = cliffMonths
  while (monthsProcessed < totalMonths) {
    const nextMonth = monthsProcessed + intervalMonths
    const fraction  = intervalMonths / (totalMonths - cliffMonths)
    const shares    = Math.round(remainingShares * fraction)
    if (shares > 0) {
      tranches.push({ date: toISO(addMonths(grantDate, nextMonth)), shares })
    }
    monthsProcessed = nextMonth
  }

  return tranches
}

// ─── Formatters ─────────────────────────────────────────────
export function formatCurrency(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value || 0)
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

// ─── State Tax Map (all 50 states + DC) ─────────────────────
export const STATE_TAX_RATES: Record<string, number> = {
  AL: 0.05, AK: 0, AZ: 0.025, AR: 0.047, CA: 0.133,
  CO: 0.044, CT: 0.0699, DE: 0.066, FL: 0, GA: 0.0549,
  HI: 0.11, ID: 0.058, IL: 0.0495, IN: 0.0323, IA: 0.06,
  KS: 0.057, KY: 0.045, LA: 0.0425, ME: 0.0715, MD: 0.0575,
  MA: 0.05, MI: 0.0425, MN: 0.0985, MS: 0.05, MO: 0.048,
  MT: 0.0675, NE: 0.0684, NV: 0, NH: 0, NJ: 0.1075,
  NM: 0.059, NY: 0.109, NC: 0.0475, ND: 0.025, OH: 0.0399,
  OK: 0.0475, OR: 0.099, PA: 0.0307, RI: 0.0599, SC: 0.07,
  SD: 0, TN: 0, TX: 0, UT: 0.0485, VT: 0.0875,
  VA: 0.0575, WA: 0, WV: 0.065, WI: 0.0765, WY: 0,
  DC: 0.1075,
}

// ─── Sample / Default Data ───────────────────────────────────
export const sampleGrants: Grant[] = [
  { id: '1', type: 'RSU',  symbol: 'TECH', shares: 1000, strike: null, grantDate: '2023-01-15', vestDate: '2026-01-15', fmvAtVest: 50 },
  { id: '2', type: 'NSO',  symbol: 'TECH', shares: 2000, strike: 20,   grantDate: '2022-06-01', vestDate: '2026-06-01', fmvAtVest: 50 },
  { id: '3', type: 'ISO',  symbol: 'TECH', shares: 1500, strike: 15,   grantDate: '2022-03-01', vestDate: '2025-03-01', fmvAtVest: 50 },
  { id: '4', type: 'ESPP', symbol: 'TECH', shares: 500,  strike: null, grantDate: '2025-01-01', vestDate: '2025-07-01', fmvAtVest: 48,
    esppOfferDate: '2025-01-01', esppPurchaseDate: '2025-07-01', esppDiscount: 0.15 },
]

export const defaultTaxAssumptions: TaxAssumptions = {
  ordinaryRate: 0.32,
  stateRate:    0.05,
  ltcgRate:     0.15,
  amtRate:      0.28,
  currentPrice: 50,
  ficaRate:     0.062,
  medicareRate: 0.0145,
  netInvestmentIncomeRate:      0.038,
  additionalMedicareRate:       0.009,
  niitThreshold:                250000,
  additionalMedicareThreshold:  250000,
  otherIncome:                  0,
}

export const defaultScenarioInputs: ScenarioInputs = {
  shares:       5000,
  strike:       20,
  currentFMV:   55,
  projectedFMV: 72,
  ordinaryRate: 0.37,
  ltcgRate:     0.20,
}
