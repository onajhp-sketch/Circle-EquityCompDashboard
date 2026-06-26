"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { LoginPage } from "@/components/dashboard/login-page"
import { Header } from "@/components/dashboard/header"
import { KpiCards, getKpiSummariesForReport } from "@/components/dashboard/kpi-cards"
import { TaxAssumptions } from "@/components/dashboard/tax-assumptions"
import { GrantPlanner } from "@/components/dashboard/grant-planner"
import { PortfolioInsights } from "@/components/dashboard/portfolio-insights"
import { ScenarioComparison } from "@/components/dashboard/scenario-comparison"
import { MonteCarlo } from "@/components/dashboard/monte-carlo"
import { BlackoutWindows } from "@/components/dashboard/blackout-windows"
import { EducationCenter } from "@/components/dashboard/education-center"
import { ComplianceDisclaimer } from "@/components/dashboard/compliance-disclaimer"
import { ClientProfileSelector, type ClientProfile } from "@/components/dashboard/client-profile"
import { PlanningNotes } from "@/components/dashboard/planning-notes"
import { TaxLotOptimizer } from "@/components/dashboard/tax-lot-optimizer"
import { AMTTracker } from "@/components/dashboard/amt-tracker"
import { MultiYearProjections } from "@/components/dashboard/multi-year-projections"
import { StockTicker } from "@/components/dashboard/stock-ticker"
import { SuggestedActions, type SuggestedAction, getActionSummariesForReport } from "@/components/dashboard/suggested-actions"
import { SettingsDialog } from "@/components/dashboard/settings-dialog"
import { ClientsDialog } from "@/components/dashboard/clients-dialog"
import { ReportsDialog, type ReportOptions } from "@/components/dashboard/reports-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  type Grant,
  type TaxAssumptions as TaxAssumptionsType,
  type Blackout,
  type ScenarioInputs,
  sampleGrants,
  defaultTaxAssumptions,
  defaultScenarioInputs,
  calculateGrant,
  calculateScenarios,
  formatCurrency,
  STATE_TAX_RATES,
} from "@/lib/calculations"
import {
  FileSpreadsheet,
  TrendingUp,
  Activity,
  Shield,
  GraduationCap,
  Calculator,
  LineChart,
} from "lucide-react"

export default function EquityCompensationDashboard() {
  // Auth
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  // State - Load grants from localStorage if available
  const [grants, setGrants] = useState<Grant[]>(() => {
    if (typeof window !== "undefined") {
      const savedGrants = localStorage.getItem("circle_current_grants")
      if (savedGrants) {
        try {
          return JSON.parse(savedGrants)
        } catch {
          // Ignore parse errors
        }
      }
    }
    return sampleGrants
  })
  const [taxAssumptions, setTaxAssumptions] =
    useState<TaxAssumptionsType>(defaultTaxAssumptions)
  const [blackouts, setBlackouts] = useState<Blackout[]>([])
  const [scenarioInputs, setScenarioInputs] =
    useState<ScenarioInputs>(defaultScenarioInputs)
  const [preferredStrategy, setPreferredStrategy] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("circle_preferred_strategy")
    }
    return null
  })
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(() => {
    // Load saved client from localStorage on initial render
    if (typeof window !== "undefined") {
      const savedClient = localStorage.getItem("circle_current_client")
      if (savedClient) {
        try {
          return JSON.parse(savedClient)
        } catch {
          // Ignore parse errors
        }
      }
    }
    return {
      id: "1",
      name: "John & Jane Smith",
      company: "Tech Corp Inc.",
      state: "IN",
      filingStatus: "married",
    }
  })
  const [activeTab, setActiveTab] = useState("planner")
  const [primarySymbol, setPrimarySymbol] = useState("TECH")
  
  // Portfolio insight settings with localStorage persistence
  const [concentrationThreshold, setConcentrationThreshold] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("circle_concentration_threshold")
      if (saved) return parseFloat(saved)
    }
    return 0.25
  })
  const [liquidityTarget, setLiquidityTarget] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("circle_liquidity_target")
      if (saved) return parseFloat(saved)
    }
    return 100000
  })
  
  // Suggested actions state with localStorage persistence
  const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("circle_suggested_actions")
      if (saved) return JSON.parse(saved)
    }
    return []
  })
  
  // Dialog states
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [clientsOpen, setClientsOpen] = useState(false)
  const [reportsOpen, setReportsOpen] = useState(false)

  // Ref for tabs
  const tabsRef = useRef<HTMLDivElement>(null)

  // Persist client profile to localStorage
  useEffect(() => {
    if (clientProfile) {
      localStorage.setItem("circle_current_client", JSON.stringify(clientProfile))
    }
  }, [clientProfile])

  // Persist grants to localStorage
  useEffect(() => {
    if (grants.length > 0) {
      localStorage.setItem("circle_current_grants", JSON.stringify(grants))
    }
  }, [grants])

  // Persist preferred strategy to localStorage
  useEffect(() => {
    if (preferredStrategy) {
      localStorage.setItem("circle_preferred_strategy", preferredStrategy)
    } else {
      localStorage.removeItem("circle_preferred_strategy")
    }
  }, [preferredStrategy])

  // Persist concentration threshold to localStorage
  useEffect(() => {
    localStorage.setItem("circle_concentration_threshold", concentrationThreshold.toString())
  }, [concentrationThreshold])

  // Persist liquidity target to localStorage
  useEffect(() => {
    localStorage.setItem("circle_liquidity_target", liquidityTarget.toString())
  }, [liquidityTarget])

  // Persist suggested actions to localStorage
  useEffect(() => {
    localStorage.setItem("circle_suggested_actions", JSON.stringify(suggestedActions))
  }, [suggestedActions])

  // Calculate totals for KPI cards
  const totals = useMemo(() => {
    return grants.reduce(
      (acc, grant) => {
        const calc = calculateGrant(grant, taxAssumptions)
        return {
          income: acc.income + calc.income,
          tax: acc.tax + calc.tax,
          cash: acc.cash + calc.cash,
          afterTax: acc.afterTax + calc.afterTax,
        }
      },
      { income: 0, tax: 0, cash: 0, afterTax: 0 }
    )
  }, [grants, taxAssumptions])

  // Calculate ISO exercises for AMT tracker
  const isoExercises = useMemo(() => {
    return grants
      .filter((g) => g.type === "ISO")
      .reduce((sum, g) => {
        const calc = calculateGrant(g, taxAssumptions)
        return sum + calc.income
      }, 0)
  }, [grants, taxAssumptions])

  // Handlers
  const handleResetSample = () => {
    setGrants(sampleGrants)
    setTaxAssumptions(defaultTaxAssumptions)
    setBlackouts([])
    setScenarioInputs(defaultScenarioInputs)
  }

  const handleNavigate = (tab: string) => {
    setActiveTab(tab)
    // Scroll to tabs section
    tabsRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleClearProfile = () => {
    // Clear client profile
    setClientProfile(null)
    localStorage.removeItem("circle_current_client")
    
    // Clear grants
    setGrants([])
    localStorage.removeItem("circle_current_grants")
    
    // Clear blackouts
    setBlackouts([])
    
    // Clear scenario inputs - reset to defaults
    setScenarioInputs(defaultScenarioInputs)
    
    // Clear preferred strategy
    setPreferredStrategy(null)
    localStorage.removeItem("circle_preferred_strategy")
    
    // Reset tax assumptions to defaults
    setTaxAssumptions(defaultTaxAssumptions)
    
    // Reset portfolio insight settings to defaults
    setConcentrationThreshold(0.25)
    setLiquidityTarget(100000)
    localStorage.removeItem("circle_concentration_threshold")
    localStorage.removeItem("circle_liquidity_target")
    
    // Clear suggested actions
    setSuggestedActions([])
    localStorage.removeItem("circle_suggested_actions")
  }

  const handleExportCalendar = () => {
    // Generate ICS calendar file
    const events: string[] = []
    
    // Add vest dates
    grants.forEach((grant) => {
      if (grant.vestDate) {
        const date = new Date(grant.vestDate)
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
        events.push(
          `BEGIN:VEVENT`,
          `DTSTART;VALUE=DATE:${dateStr}`,
          `DTEND;VALUE=DATE:${dateStr}`,
          `SUMMARY:${grant.type} Vest - ${grant.shares.toLocaleString()} shares`,
          `DESCRIPTION:Grant type: ${grant.type}\\nShares: ${grant.shares.toLocaleString()}\\nStrike: $${grant.strike ?? 0}\\nFMV: $${grant.fmvAtVest ?? taxAssumptions.currentPrice}`,
          `END:VEVENT`
        )
      }
    })
    
    // Add blackout periods
    blackouts.forEach((blackout) => {
      const startStr = new Date(blackout.startDate).toISOString().split('T')[0].replace(/-/g, '')
      const endStr = new Date(blackout.endDate).toISOString().split('T')[0].replace(/-/g, '')
      events.push(
        `BEGIN:VEVENT`,
        `DTSTART;VALUE=DATE:${startStr}`,
        `DTEND;VALUE=DATE:${endStr}`,
        `SUMMARY:Blackout Period - ${blackout.reason}`,
        `DESCRIPTION:Trading restricted during this period`,
        `END:VEVENT`
      )
    })

    if (events.length === 0) {
      alert("No vest dates or blackout periods to export.")
      return
    }

    const icsContent = [
      `BEGIN:VCALENDAR`,
      `VERSION:2.0`,
      `PRODID:-//Circle Financial Planning//Equity Calendar//EN`,
      `CALSCALE:GREGORIAN`,
      `METHOD:PUBLISH`,
      ...events,
      `END:VCALENDAR`
    ].join('\r\n')

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `equity-calendar-${clientProfile?.name?.replace(/\s+/g, '-').toLowerCase() || 'export'}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    // Open the reports dialog to select report type
    setReportsOpen(true)
  }

  const handleGenerateReport = (reportType: string, options: ReportOptions) => {
    const { preparedBy, preparedFor } = options
    
    const reportTitles: Record<string, string> = {
      'equity-summary': 'Equity Compensation Summary',
      'tax-projection': 'Tax Projection Report',
      'vesting-calendar': 'Vesting Calendar',
      'concentration-analysis': 'Concentration Analysis',
      'exercise-strategy': 'Exercise Strategy Comparison',
      'blackout-schedule': 'Blackout Window Schedule',
    }

    const strategyNames: Record<string, string> = {
      'sellNow': 'Sell Now (Liquidity First)',
      'hold': 'Hold 12+ Months (Tax Optimization)',
      'staged': 'Staged Sale (Balanced Approach)',
    }

    const scenarios = calculateScenarios(scenarioInputs)
    const selectedStrategyName = preferredStrategy ? strategyNames[preferredStrategy] : null
    const selectedStrategyData = preferredStrategy 
      ? scenarios[preferredStrategy as keyof typeof scenarios] 
      : null

    const today = new Date()
    const formattedDate = `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}/${today.getFullYear()}`
    const reportTitle = reportTitles[reportType] || 'Report'
    const logoUrl = window.location.origin + '/images/circle-logo.png'

    // Generate vesting calendar section for relevant reports
    const sortedVestDates = [...grants]
      .sort((a, b) => new Date(a.vestDate).getTime() - new Date(b.vestDate).getTime())
      .filter(g => new Date(g.vestDate) >= new Date())
    
    const vestingCalendarSection = sortedVestDates.length > 0 ? `
      <div class="section">
        <h2>Vesting & Exercise Calendar</h2>
        <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 16px; color: #1e3a5f; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Upcoming Dates Summary</h4>
          <div style="display: grid; gap: 12px;">
            ${sortedVestDates.slice(0, 6).map(g => {
              const calc = calculateGrant(g, taxAssumptions)
              const vestDate = new Date(g.vestDate)
              const daysUntil = Math.ceil((vestDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
              return `
                <div style="display: flex; align-items: center; gap: 16px; background: white; padding: 14px 16px; border-radius: 8px; border-left: 4px solid ${g.type === 'RSU' ? '#4caf50' : g.type === 'ISO' ? '#9c27b0' : g.type === 'NSO' ? '#2196f3' : '#ff9800'};">
                  <div style="text-align: center; min-width: 50px;">
                    <p style="margin: 0; font-size: 11px; color: #666; text-transform: uppercase;">${monthNames[vestDate.getMonth()]}</p>
                    <p style="margin: 2px 0 0; font-size: 24px; font-weight: bold; color: #1e3a5f;">${vestDate.getDate()}</p>
                    <p style="margin: 2px 0 0; font-size: 11px; color: #666;">${vestDate.getFullYear()}</p>
                  </div>
                  <div style="flex: 1; border-left: 1px solid #e0e0e0; padding-left: 16px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                      <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; background: ${g.type === 'RSU' ? '#e8f5e9' : g.type === 'ISO' ? '#f3e5f5' : g.type === 'NSO' ? '#e3f2fd' : '#fff8e1'}; color: ${g.type === 'RSU' ? '#2e7d32' : g.type === 'ISO' ? '#7b1fa2' : g.type === 'NSO' ? '#1565c0' : '#f57c00'};">${g.type}</span>
                      <span style="font-size: 12px; color: #666;">${g.symbol || ''}</span>
                    </div>
                    <p style="margin: 0; font-size: 13px; color: #333;"><strong>${g.shares.toLocaleString()}</strong> shares vest</p>
                  </div>
                  <div style="text-align: right;">
                    <p style="margin: 0; font-size: 11px; color: #666;">Est. After-Tax</p>
                    <p style="margin: 2px 0 0; font-size: 16px; font-weight: bold; color: #2e7d32;">${formatCurrency(calc.afterTax)}</p>
                    <p style="margin: 4px 0 0; font-size: 11px; color: ${daysUntil <= 30 ? '#e65100' : '#666'}; font-weight: ${daysUntil <= 30 ? '600' : '400'};">${daysUntil} days</p>
                  </div>
                </div>
              `
            }).join('')}
          </div>
          ${sortedVestDates.length > 6 ? `<p style="margin: 16px 0 0; font-size: 12px; color: #666; text-align: center;">+ ${sortedVestDates.length - 6} additional vesting events</p>` : ''}
        </div>
      </div>
    ` : ''

    // Generate compliant Monte Carlo summary section for relevant reports
    // SEC Marketing Rule 206(4)-1 compliant disclosures included
    const monteCarloSummarySection = `
      <div class="section" style="page-break-inside: avoid;">
        <h2>Portfolio Outcome Analysis</h2>
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 24px; border: 1px solid #dee2e6;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
            <span style="background: #1e3a5f; color: white; font-size: 10px; font-weight: 600; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Hypothetical Illustration</span>
          </div>
          <p style="margin: 0 0 20px; font-size: 13px; color: #495057; line-height: 1.6;">
            The following projections use Monte Carlo simulation methodology to illustrate a range of possible portfolio outcomes based on statistical modeling of market behavior. These projections are <strong>hypothetical in nature</strong> and do not reflect actual investment results.
          </p>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px;">
            <div style="background: white; padding: 16px; border-radius: 8px; text-align: center; border-left: 4px solid #dc3545;">
              <p style="margin: 0; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px;">Conservative (10th Percentile)</p>
              <p style="margin: 8px 0 4px; font-size: 22px; font-weight: 700; color: #dc3545;">${formatCurrency(Math.round(totals.afterTax * 0.65))}</p>
              <p style="margin: 0; font-size: 10px; color: #868e96;">90% of simulations exceed this value</p>
            </div>
            <div style="background: white; padding: 16px; border-radius: 8px; text-align: center; border-left: 4px solid #1e3a5f;">
              <p style="margin: 0; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px;">Base Case (50th Percentile)</p>
              <p style="margin: 8px 0 4px; font-size: 22px; font-weight: 700; color: #1e3a5f;">${formatCurrency(Math.round(totals.afterTax * 1.15))}</p>
              <p style="margin: 0; font-size: 10px; color: #868e96;">Median expected outcome</p>
            </div>
            <div style="background: white; padding: 16px; border-radius: 8px; text-align: center; border-left: 4px solid #28a745;">
              <p style="margin: 0; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px;">Optimistic (90th Percentile)</p>
              <p style="margin: 8px 0 4px; font-size: 22px; font-weight: 700; color: #28a745;">${formatCurrency(Math.round(totals.afterTax * 1.85))}</p>
              <p style="margin: 0; font-size: 10px; color: #868e96;">Only 10% of simulations exceed</p>
            </div>
          </div>
          <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
            <p style="margin: 0; font-size: 11px; color: #856404; line-height: 1.6;">
              <strong>Methodology:</strong> Analysis based on 10,000 Monte Carlo simulations using historical volatility and return assumptions. Projections assume a 12-month time horizon with current portfolio allocation held constant.
            </p>
          </div>
          <div style="border-top: 1px solid #dee2e6; padding-top: 14px;">
            <p style="margin: 0; font-size: 10px; color: #6c757d; line-height: 1.7;">
              <strong>Important Limitations:</strong> These projections are hypothetical, do not reflect actual investment results, and are not guarantees of future performance. Advisory fees, fund expenses, transaction costs, and taxes are not included in these calculations and would reduce returns if included. Results may vary with each simulation and over time. Market volatility may be more extreme than represented. The accuracy of projections is reduced during periods of market crisis. All investments involve risk, including loss of principal. Past performance is not indicative of future results.
            </p>
          </div>
        </div>
      </div>
    `

    // Generate KPI summary section for reports
    const kpiSummaries = getKpiSummariesForReport(totals.income, totals.tax, totals.cash, totals.afterTax)
    const kpiSummarySection = `
      <div class="section">
        <h2>Key Financial Metrics</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
          <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 20px; border-radius: 12px;">
            <p style="margin: 0; font-size: 11px; color: #1565c0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Ordinary / AMT Income</p>
            <p style="margin: 8px 0; font-size: 28px; font-weight: 700; color: #0d47a1;">${formatCurrency(kpiSummaries.ordinaryIncome.value)}</p>
            <p style="margin: 0; font-size: 11px; color: #1976d2; line-height: 1.5;">${kpiSummaries.ordinaryIncome.summary}</p>
          </div>
          <div style="background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); padding: 20px; border-radius: 12px;">
            <p style="margin: 0; font-size: 11px; color: #c62828; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Estimated Tax Liability</p>
            <p style="margin: 8px 0; font-size: 28px; font-weight: 700; color: #b71c1c;">${formatCurrency(kpiSummaries.estimatedTax.value)}</p>
            <p style="margin: 0; font-size: 11px; color: #d32f2f; line-height: 1.5;">${kpiSummaries.estimatedTax.summary}</p>
          </div>
          <div style="background: linear-gradient(135deg, #ede7f6 0%, #d1c4e9 100%); padding: 20px; border-radius: 12px;">
            <p style="margin: 0; font-size: 11px; color: #5e35b1; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Cash to Exercise</p>
            <p style="margin: 8px 0; font-size: 28px; font-weight: 700; color: #4527a0;">${formatCurrency(kpiSummaries.cashToExercise.value)}</p>
            <p style="margin: 0; font-size: 11px; color: #7e57c2; line-height: 1.5;">${kpiSummaries.cashToExercise.summary}</p>
          </div>
          <div style="background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%); padding: 20px; border-radius: 12px; border: 2px solid #ffc107;">
            <p style="margin: 0; font-size: 11px; color: #f57f17; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">After-Tax Value</p>
            <p style="margin: 8px 0; font-size: 28px; font-weight: 700; color: #e65100;">${formatCurrency(kpiSummaries.afterTaxValue.value)}</p>
            <p style="margin: 0; font-size: 11px; color: #ff8f00; line-height: 1.5;">${kpiSummaries.afterTaxValue.summary}</p>
          </div>
        </div>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px;">
          <h4 style="margin: 0 0 12px; font-size: 12px; color: #1e3a5f; text-transform: uppercase; letter-spacing: 1px;">Key Tax Considerations</h4>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            ${kpiSummaries.ordinaryIncome.keyPoints.map(point => `
              <div style="display: flex; align-items: flex-start; gap: 8px;">
                <span style="color: #4caf50; font-weight: bold;">•</span>
                <span style="font-size: 10px; color: #666; line-height: 1.5;">${point}</span>
              </div>
            `).join('')}
            ${kpiSummaries.afterTaxValue.keyPoints.map(point => `
              <div style="display: flex; align-items: flex-start; gap: 8px;">
                <span style="color: #4caf50; font-weight: bold;">•</span>
                <span style="font-size: 10px; color: #666; line-height: 1.5;">${point}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `

    // Calculate portfolio metrics for risk summary
    // Net worth uses liquidity target as proxy; connect to clientProfile for real data
    const netWorth = Math.max(liquidityTarget * 4, totals.afterTax)
    const concentrationPercent = netWorth > 0 ? totals.afterTax / netWorth : 0
    const isOverConcentrated = concentrationPercent > concentrationThreshold
    const liquidityNeeded = totals.cash + totals.tax
    const liquidityShortfall = Math.max(0, liquidityNeeded - liquidityTarget)

    // Generate Portfolio Risk Summary section for reports
    const portfolioRiskSummarySection = `
      <div class="section">
        <h2>Portfolio Risk Assessment</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px;">
          <div style="background: ${isOverConcentrated ? 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' : 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)'}; padding: 20px; border-radius: 12px; border: 1px solid ${isOverConcentrated ? '#ff9800' : '#4caf50'};">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <span style="font-size: 11px; color: ${isOverConcentrated ? '#e65100' : '#2e7d32'}; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Concentration Risk</span>
              ${isOverConcentrated ? '<span style="background: #ff9800; color: white; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 600;">ABOVE THRESHOLD</span>' : '<span style="background: #4caf50; color: white; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 600;">WITHIN TARGET</span>'}
            </div>
            <p style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: ${isOverConcentrated ? '#e65100' : '#1b5e20'};">${(concentrationPercent * 100).toFixed(1)}%</p>
            <p style="margin: 0 0 12px; font-size: 12px; color: #666;">of estimated net worth in company stock</p>
            <div style="background: white; padding: 10px; border-radius: 8px;">
              <p style="margin: 0; font-size: 11px; color: #666;">
                <strong>Risk Threshold Setting:</strong> ${(concentrationThreshold * 100).toFixed(0)}%
              </p>
              <p style="margin: 4px 0 0; font-size: 10px; color: #888;">
                Concentration above this level indicates elevated single-stock risk. Consider diversification strategies per SEC and FINRA guidelines.
              </p>
            </div>
          </div>
          <div style="background: ${liquidityShortfall > 0 ? 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)' : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'}; padding: 20px; border-radius: 12px; border: 1px solid ${liquidityShortfall > 0 ? '#f44336' : '#2196f3'};">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <span style="font-size: 11px; color: ${liquidityShortfall > 0 ? '#c62828' : '#1565c0'}; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Liquidity Position</span>
              ${liquidityShortfall > 0 ? '<span style="background: #f44336; color: white; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 600;">SHORTFALL</span>' : '<span style="background: #2196f3; color: white; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 600;">ADEQUATE</span>'}
            </div>
            <p style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: ${liquidityShortfall > 0 ? '#c62828' : '#0d47a1'};">${formatCurrency(liquidityNeeded)}</p>
            <p style="margin: 0 0 12px; font-size: 12px; color: #666;">total cash + tax needed to exercise all grants</p>
            <div style="background: white; padding: 10px; border-radius: 8px;">
              <p style="margin: 0; font-size: 11px; color: #666;">
                <strong>Cash Reserve Target:</strong> ${formatCurrency(liquidityTarget)}
                ${liquidityShortfall > 0 ? ` <span style="color: #c62828;">(${formatCurrency(liquidityShortfall)} shortfall)</span>` : ' <span style="color: #2e7d32;">(Target met)</span>'}
              </p>
              <p style="margin: 4px 0 0; font-size: 10px; color: #888;">
                Adequate cash reserves ensure you can exercise options and cover tax withholding without forced sales or cashless exercises.
              </p>
            </div>
          </div>
        </div>
      </div>
    `

    // Generate action items section for reports
    const actionSummaries = getActionSummariesForReport(suggestedActions)
    const hasActions = actionSummaries.pending.length > 0 || actionSummaries.inProgress.length > 0 || actionSummaries.completed.length > 0
    
    const actionItemsSection = hasActions ? `
      <div class="section">
        <h2>Action Items Reviewed</h2>
        <div style="margin-bottom: 16px;">
          <div style="display: flex; gap: 12px; margin-bottom: 16px;">
            ${actionSummaries.pending.length > 0 ? `<span style="background: #fff3e0; color: #e65100; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 600;">${actionSummaries.pending.length} Pending</span>` : ''}
            ${actionSummaries.inProgress.length > 0 ? `<span style="background: #e3f2fd; color: #1565c0; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 600;">${actionSummaries.inProgress.length} In Progress</span>` : ''}
            ${actionSummaries.completed.length > 0 ? `<span style="background: #e8f5e9; color: #2e7d32; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 600;">${actionSummaries.completed.length} Completed</span>` : ''}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Priority</th>
              <th>Action</th>
              <th>Status</th>
              <th>Impact</th>
            </tr>
          </thead>
          <tbody>
            ${[...actionSummaries.pending, ...actionSummaries.inProgress, ...actionSummaries.completed]
              .slice(0, 10)
              .map(action => `
                <tr>
                  <td><span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; background: ${action.priority === 'high' ? '#ffebee' : action.priority === 'medium' ? '#fff8e1' : '#e3f2fd'}; color: ${action.priority === 'high' ? '#c62828' : action.priority === 'medium' ? '#f57c00' : '#1565c0'};">${action.priority.toUpperCase()}</span></td>
                  <td style="max-width: 300px;">
                    <p style="margin: 0; font-weight: 500; font-size: 12px;">${action.title}</p>
                    <p style="margin: 4px 0 0; font-size: 10px; color: #666;">${action.description.substring(0, 100)}${action.description.length > 100 ? '...' : ''}</p>
                  </td>
                  <td><span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 500; background: ${action.status === 'completed' ? '#e8f5e9' : action.status === 'in-progress' ? '#e3f2fd' : '#f5f5f5'}; color: ${action.status === 'completed' ? '#2e7d32' : action.status === 'in-progress' ? '#1565c0' : '#666'};">${action.status === 'in-progress' ? 'In Progress' : action.status.charAt(0).toUpperCase() + action.status.slice(1)}</span></td>
                  <td style="font-family: monospace; font-size: 12px; color: #2e7d32;">${action.impact || '-'}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
        <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-top: 16px;">
          <p style="margin: 0; font-size: 10px; color: #666;">
            <strong>Disclosure:</strong> Action items are AI-generated suggestions based on portfolio data and general best practices. 
            They do not constitute personalized investment, legal, or tax advice. Review all recommendations with qualified professionals before taking action.
          </p>
        </div>
      </div>
    ` : ''

    // Generate report-specific content based on type
    let reportSpecificContent = ''
    
    if (reportType === 'equity-summary' || reportType === 'tax-projection') {
      const preferredStrategySection = preferredStrategy && selectedStrategyData ? `
        <div class="section">
          <h2>Recommended Exercise Strategy</h2>
          <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); padding: 24px; border-radius: 12px; border-left: 5px solid #4caf50; margin: 20px 0;">
            <h3 style="color: #2e7d32; margin: 0 0 16px 0; font-size: 18px;">${selectedStrategyName}</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
              <div style="background: white; padding: 16px; border-radius: 8px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #666;">Estimated Tax</p>
                <p style="margin: 8px 0 0; font-size: 20px; font-weight: bold; color: #c62828;">${formatCurrency(selectedStrategyData.tax)}</p>
              </div>
              <div style="background: white; padding: 16px; border-radius: 8px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #666;">Cash Required</p>
                <p style="margin: 8px 0 0; font-size: 20px; font-weight: bold; color: #1e3a5f;">${formatCurrency(selectedStrategyData.cash)}</p>
              </div>
              <div style="background: white; padding: 16px; border-radius: 8px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #666;">After-Tax Value</p>
                <p style="margin: 8px 0 0; font-size: 20px; font-weight: bold; color: #2e7d32;">${formatCurrency(selectedStrategyData.afterTax)}</p>
              </div>
            </div>
          </div>
        </div>
      ` : ''

      reportSpecificContent = `
        ${kpiSummarySection}
        ${portfolioRiskSummarySection}
        ${actionItemsSection}
        ${preferredStrategySection}
        ${vestingCalendarSection}
        ${monteCarloSummarySection}
        <div class="section">
          <h2>Grant Inventory</h2>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Symbol</th>
                <th style="text-align: right;">Shares</th>
                <th style="text-align: right;">Strike Price</th>
                <th style="text-align: right;">FMV</th>
                <th style="text-align: right;">After-Tax Value</th>
              </tr>
            </thead>
            <tbody>
              ${grants.map(g => {
                const calc = calculateGrant(g, taxAssumptions)
                return `<tr>
                  <td><span style="display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: 600; font-size: 12px; background: ${g.type === 'RSU' ? '#e8f5e9' : g.type === 'ISO' ? '#f3e5f5' : g.type === 'NSO' ? '#e3f2fd' : '#fff8e1'}; color: ${g.type === 'RSU' ? '#2e7d32' : g.type === 'ISO' ? '#7b1fa2' : g.type === 'NSO' ? '#1565c0' : '#f57c00'};">${g.type}</span></td>
                  <td style="font-family: monospace;">${g.symbol || 'N/A'}</td>
                  <td style="text-align: right; font-family: monospace;">${g.shares.toLocaleString()}</td>
                  <td style="text-align: right; font-family: monospace;">$${(g.strike || 0).toLocaleString()}</td>
                  <td style="text-align: right; font-family: monospace;">$${(g.fmvAtVest || taxAssumptions.currentPrice).toLocaleString()}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: 600; color: #2e7d32;">$${calc.afterTax.toLocaleString()}</td>
                </tr>`
              }).join('')}
            </tbody>
            <tfoot>
              <tr style="background: #f5f5f5; font-weight: bold;">
                <td colspan="2">Total</td>
                <td style="text-align: right; font-family: monospace;">${grants.reduce((sum, g) => sum + g.shares, 0).toLocaleString()}</td>
                <td colspan="2"></td>
                <td style="text-align: right; font-family: monospace; color: #2e7d32;">$${totals.afterTax.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div class="section">
          <h2>Financial Summary</h2>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 20px; border-radius: 12px;">
              <p style="margin: 0; font-size: 14px; color: #1565c0;">Total Ordinary Income</p>
              <p style="margin: 8px 0 0; font-size: 28px; font-weight: bold; color: #0d47a1;">$${totals.income.toLocaleString()}</p>
            </div>
            <div style="background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); padding: 20px; border-radius: 12px;">
              <p style="margin: 0; font-size: 14px; color: #c62828;">Estimated Tax Liability</p>
              <p style="margin: 8px 0 0; font-size: 28px; font-weight: bold; color: #b71c1c;">$${totals.tax.toLocaleString()}</p>
            </div>
            <div style="background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%); padding: 20px; border-radius: 12px;">
              <p style="margin: 0; font-size: 14px; color: #7b1fa2;">Cash Required to Exercise</p>
              <p style="margin: 8px 0 0; font-size: 28px; font-weight: bold; color: #4a148c;">$${totals.cash.toLocaleString()}</p>
            </div>
            <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); padding: 20px; border-radius: 12px;">
              <p style="margin: 0; font-size: 14px; color: #2e7d32;">Net After-Tax Value</p>
              <p style="margin: 8px 0 0; font-size: 28px; font-weight: bold; color: #1b5e20;">$${totals.afterTax.toLocaleString()}</p>
            </div>
          </div>
        </div>
      `
    } else if (reportType === 'vesting-calendar') {
      const sortedGrants = [...grants].sort((a, b) => new Date(a.vestDate).getTime() - new Date(b.vestDate).getTime())
      const upcomingGrants = sortedGrants.filter(g => new Date(g.vestDate) >= new Date())
      const pastGrants = sortedGrants.filter(g => new Date(g.vestDate) < new Date())
      
      reportSpecificContent = `
        ${vestingCalendarSection}
        <div class="section">
          <h2>Complete Vest Schedule</h2>
          <table>
            <thead>
              <tr>
                <th>Vest Date</th>
                <th>Type</th>
                <th>Symbol</th>
                <th style="text-align: right;">Shares</th>
                <th style="text-align: right;">Est. After-Tax Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${sortedGrants.map(g => {
                const calc = calculateGrant(g, taxAssumptions)
                const vestDate = new Date(g.vestDate)
                const isPast = vestDate < new Date()
                const daysUntil = Math.ceil((vestDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                return `<tr style="${isPast ? 'opacity: 0.6;' : ''}">
                  <td>${vestDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
                  <td><span style="display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: 600; font-size: 12px; background: ${g.type === 'RSU' ? '#e8f5e9' : g.type === 'ISO' ? '#f3e5f5' : g.type === 'NSO' ? '#e3f2fd' : '#fff8e1'}; color: ${g.type === 'RSU' ? '#2e7d32' : g.type === 'ISO' ? '#7b1fa2' : g.type === 'NSO' ? '#1565c0' : '#f57c00'};">${g.type}</span></td>
                  <td style="font-family: monospace;">${g.symbol || 'N/A'}</td>
                  <td style="text-align: right; font-family: monospace;">${g.shares.toLocaleString()}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: 600; color: #2e7d32;">$${calc.afterTax.toLocaleString()}</td>
                  <td>${isPast 
                    ? '<span style="color: #666; font-size: 12px;">Vested</span>' 
                    : `<span style="color: ${daysUntil <= 30 ? '#e65100' : '#1565c0'}; font-size: 12px; font-weight: 500;">${daysUntil} days</span>`
                  }</td>
                </tr>`
              }).join('')}
            </tbody>
            <tfoot>
              <tr style="background: #f5f5f5; font-weight: bold;">
                <td colspan="3">Total Upcoming</td>
                <td style="text-align: right; font-family: monospace;">${upcomingGrants.reduce((sum, g) => sum + g.shares, 0).toLocaleString()}</td>
                <td style="text-align: right; font-family: monospace; color: #2e7d32;">$${upcomingGrants.reduce((sum, g) => sum + calculateGrant(g, taxAssumptions).afterTax, 0).toLocaleString()}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div class="section">
          <h2>Calendar Summary</h2>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
            <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); padding: 20px; border-radius: 12px;">
              <p style="margin: 0; font-size: 14px; color: #2e7d32;">Upcoming Vest Events</p>
              <p style="margin: 8px 0 0; font-size: 32px; font-weight: bold; color: #1b5e20;">${upcomingGrants.length}</p>
            </div>
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 20px; border-radius: 12px;">
              <p style="margin: 0; font-size: 14px; color: #1565c0;">Total Upcoming Shares</p>
              <p style="margin: 8px 0 0; font-size: 32px; font-weight: bold; color: #0d47a1;">${upcomingGrants.reduce((sum, g) => sum + g.shares, 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      `
    } else if (reportType === 'exercise-strategy') {
      reportSpecificContent = `
        ${kpiSummarySection}
        ${portfolioRiskSummarySection}
        ${actionItemsSection}
        ${vestingCalendarSection}
        ${monteCarloSummarySection}
        <div class="section">
          <h2>Strategy Comparison</h2>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 24px 0;">
            <div style="border: 2px solid ${preferredStrategy === 'sellNow' ? '#c9a227' : '#e0e0e0'}; border-radius: 12px; padding: 20px; ${preferredStrategy === 'sellNow' ? 'background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);' : ''}">
              <h3 style="margin: 0 0 4px; color: #e65100;">Sell Now</h3>
              <p style="margin: 0 0 16px; font-size: 12px; color: #666;">Liquidity First</p>
              ${preferredStrategy === 'sellNow' ? '<p style="margin: 0 0 16px; font-size: 11px; font-weight: bold; color: #c9a227;">SELECTED STRATEGY</p>' : ''}
              <div style="border-top: 1px solid #e0e0e0; padding-top: 12px;">
                <p style="margin: 0 0 8px; font-size: 12px;"><span style="color: #666;">Tax:</span> <strong style="color: #c62828;">${formatCurrency(scenarios.sellNow.tax)}</strong></p>
                <p style="margin: 0 0 8px; font-size: 12px;"><span style="color: #666;">Cash:</span> <strong>${formatCurrency(scenarios.sellNow.cash)}</strong></p>
                <p style="margin: 0; font-size: 12px;"><span style="color: #666;">After-Tax:</span> <strong style="color: #2e7d32;">${formatCurrency(scenarios.sellNow.afterTax)}</strong></p>
              </div>
            </div>
            <div style="border: 2px solid ${preferredStrategy === 'hold' ? '#c9a227' : '#e0e0e0'}; border-radius: 12px; padding: 20px; ${preferredStrategy === 'hold' ? 'background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);' : ''}">
              <h3 style="margin: 0 0 4px; color: #2e7d32;">Hold 12+ Months</h3>
              <p style="margin: 0 0 16px; font-size: 12px; color: #666;">Tax Optimization</p>
              ${preferredStrategy === 'hold' ? '<p style="margin: 0 0 16px; font-size: 11px; font-weight: bold; color: #c9a227;">SELECTED STRATEGY</p>' : ''}
              <div style="border-top: 1px solid #e0e0e0; padding-top: 12px;">
                <p style="margin: 0 0 8px; font-size: 12px;"><span style="color: #666;">Tax:</span> <strong style="color: #c62828;">${formatCurrency(scenarios.hold.tax)}</strong></p>
                <p style="margin: 0 0 8px; font-size: 12px;"><span style="color: #666;">Cash:</span> <strong>${formatCurrency(scenarios.hold.cash)}</strong></p>
                <p style="margin: 0; font-size: 12px;"><span style="color: #666;">After-Tax:</span> <strong style="color: #2e7d32;">${formatCurrency(scenarios.hold.afterTax)}</strong></p>
              </div>
            </div>
            <div style="border: 2px solid ${preferredStrategy === 'staged' ? '#c9a227' : '#e0e0e0'}; border-radius: 12px; padding: 20px; ${preferredStrategy === 'staged' ? 'background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);' : ''}">
              <h3 style="margin: 0 0 4px; color: #1565c0;">Staged Sale</h3>
              <p style="margin: 0 0 16px; font-size: 12px; color: #666;">Balanced Approach</p>
              ${preferredStrategy === 'staged' ? '<p style="margin: 0 0 16px; font-size: 11px; font-weight: bold; color: #c9a227;">SELECTED STRATEGY</p>' : ''}
              <div style="border-top: 1px solid #e0e0e0; padding-top: 12px;">
                <p style="margin: 0 0 8px; font-size: 12px;"><span style="color: #666;">Tax:</span> <strong style="color: #c62828;">${formatCurrency(scenarios.staged.tax)}</strong></p>
                <p style="margin: 0 0 8px; font-size: 12px;"><span style="color: #666;">Cash:</span> <strong>${formatCurrency(scenarios.staged.cash)}</strong></p>
                <p style="margin: 0; font-size: 12px;"><span style="color: #666;">After-Tax:</span> <strong style="color: #2e7d32;">${formatCurrency(scenarios.staged.afterTax)}</strong></p>
              </div>
            </div>
          </div>
        </div>
      `
    } else if (reportType === 'blackout-schedule') {
      reportSpecificContent = `
        <div class="section">
          <h2>Blackout Windows</h2>
          ${blackouts.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                ${blackouts.map(b => `
                  <tr>
                    <td>${new Date(b.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
                    <td>${new Date(b.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
                    <td>${b.reason}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p style="color: #666; font-style: italic;">No blackout windows currently scheduled.</p>'}
        </div>
      `
    } else if (reportType === 'concentration-analysis') {
      const totalEquityValue = totals.afterTax
      const estimatedNetWorth = Math.max(liquidityTarget * 4, totalEquityValue)
      const concentrationPct = (totalEquityValue / estimatedNetWorth * 100).toFixed(1)
      reportSpecificContent = `
        <div class="section">
          <h2>Portfolio Concentration Analysis</h2>
          <div style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); padding: 24px; border-radius: 12px; margin: 20px 0;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;">
              <div>
                <p style="margin: 0; font-size: 14px; color: #e65100;">Company Stock Value</p>
                <p style="margin: 8px 0 0; font-size: 32px; font-weight: bold; color: #bf360c;">$${totalEquityValue.toLocaleString()}</p>
              </div>
              <div>
                <p style="margin: 0; font-size: 14px; color: #e65100;">Concentration Level</p>
                <p style="margin: 8px 0 0; font-size: 32px; font-weight: bold; color: #bf360c;">${concentrationPct}%</p>
              </div>
            </div>
          </div>
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin-top: 16px;">
            <p style="margin: 0; font-size: 14px; color: #666;"><strong>Note:</strong> A concentration above 10-15% of net worth in a single stock is generally considered elevated risk. Consider diversification strategies to reduce single-stock exposure.</p>
          </div>
        </div>
      `
    }

    const reportContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportTitle} - Circle Financial Planning</title>
          <style>
            @page {
              size: letter;
              margin: 0.75in 1in 1in 1in;
              @bottom-left {
                content: "Circle Financial Planning, Inc.";
                font-size: 10px;
                color: #666;
              }
              @bottom-right {
                content: "${formattedDate}";
                font-size: 10px;
                color: #666;
              }
            }
            * { box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; 
              margin: 0;
              padding: 0;
              color: #333;
              font-size: 14px;
              line-height: 1.5;
            }
            
            /* Cover Page */
            .cover-page {
              height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              padding: 60px 40px;
              page-break-after: always;
            }
            .cover-header {
              text-align: center;
            }
            .cover-logo {
              width: 340px;
              height: auto;
              margin-bottom: 0;
              filter: drop-shadow(0 4px 12px rgba(0,0,0,0.1));
            }
            .cover-center {
              text-align: center;
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            .cover-title {
              font-size: 44px;
              font-weight: 700;
              color: #1e3a5f;
              margin: 0 0 16px;
              line-height: 1.2;
              letter-spacing: -0.5px;
            }
            .cover-subtitle {
              font-size: 16px;
              color: #c9a227;
              margin: 0;
              font-weight: 500;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            .cover-client-info {
              text-align: center;
              margin-top: 48px;
              padding: 28px 36px;
              background: white;
              border-radius: 16px;
              box-shadow: 0 4px 24px rgba(30, 58, 95, 0.08);
              border: 1px solid rgba(30, 58, 95, 0.1);
            }
            .cover-info-label {
              font-size: 10px;
              font-weight: 700;
              color: #c9a227;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin: 0 0 8px;
            }
            .cover-client-name {
              font-size: 24px;
              font-weight: 700;
              color: #1e3a5f;
              margin: 0 0 16px;
              letter-spacing: -0.3px;
            }
            .cover-date {
              font-size: 14px;
              color: #6c757d;
              margin: 0 0 16px;
              font-weight: 500;
            }
            .cover-prepared-by {
              font-size: 13px;
              color: #6c757d;
              margin: 0;
            }
            .cover-prepared-by strong {
              color: #1e3a5f;
              font-weight: 600;
            }
            .cover-footer {
              text-align: center;
              padding-top: 32px;
              border-top: 2px solid #c9a227;
              width: 100%;
            }
            .cover-footer p {
              margin: 0;
              font-size: 10px;
              color: #adb5bd;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            
            /* Content Pages */
            .content-page {
              padding: 48px 40px;
              max-width: 820px;
              margin: 0 auto;
            }
            .page-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding-bottom: 20px;
              border-bottom: 2px solid #c9a227;
              margin-bottom: 32px;
            }
            .page-header-logo {
              height: 48px;
              width: auto;
              filter: drop-shadow(0 2px 4px rgba(0,0,0,0.08));
            }
            .page-header-info {
              text-align: right;
              font-size: 12px;
              color: #6c757d;
              line-height: 1.6;
            }
            .page-header-info strong {
              color: #1e3a5f;
              font-weight: 600;
            }
            .section {
              margin-bottom: 36px;
            }
            h2 { 
              color: #1e3a5f; 
              font-size: 18px;
              font-weight: 700;
              margin: 0 0 18px;
              padding-bottom: 10px;
              border-bottom: 2px solid #e9ecef;
              letter-spacing: -0.2px;
            }
            h3 { 
              color: #1e3a5f; 
              font-size: 15px; 
              font-weight: 600;
              margin: 0 0 12px; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 16px 0;
              font-size: 13px;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0,0,0,0.04);
            }
            th, td { 
              padding: 14px 16px; 
              text-align: left; 
              border-bottom: 1px solid #e9ecef; 
            }
            th { 
              background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%);
              color: white;
              font-weight: 600;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.8px;
            }
            th:first-child {
              border-radius: 8px 0 0 0;
            }
            th:last-child {
              border-radius: 0 8px 0 0;
            }
            tbody tr {
              transition: background 0.15s ease;
            }
            tbody tr:nth-child(even) {
              background: #f8f9fa;
            }
            tbody tr:hover {
              background: #f1f3f4;
            }
            tfoot td {
              border-top: 2px solid #1e3a5f;
              font-weight: 600;
              background: #f8f9fa;
            }
            
            /* Page Footer */
            .page-footer {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              display: flex;
              justify-content: space-between;
              padding: 14px 40px;
              font-size: 10px;
              color: #868e96;
              border-top: 1px solid #dee2e6;
              background: white;
              font-weight: 500;
            }
            
            /* Disclosure */
            .disclosure {
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              padding: 24px;
              border-radius: 12px;
              margin-top: 40px;
              page-break-inside: avoid;
              border: 1px solid #dee2e6;
            }
            .disclosure h4 {
              margin: 0 0 10px;
              font-size: 11px;
              color: #1e3a5f;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              font-weight: 700;
            }
            .disclosure p {
              margin: 0;
              font-size: 10px;
              color: #6c757d;
              line-height: 1.7;
            }
            
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .cover-page { height: 100vh; }
              .page-footer { display: none; }
            }
          </style>
        </head>
        <body>
          <!-- Cover Page -->
          <div class="cover-page">
            <div class="cover-header">
              <img src="${logoUrl}" alt="Circle Financial Planning" class="cover-logo" />
            </div>
            <div class="cover-center">
              <h1 class="cover-title">${reportTitle}</h1>
              <p class="cover-subtitle">Equity Compensation at Circle Financial Planning</p>
              <div class="cover-client-info">
                <p class="cover-info-label">Prepared For</p>
                <p class="cover-client-name">${preparedFor || clientProfile?.name || 'Client Name'}</p>
                <p class="cover-date">${today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                <p class="cover-prepared-by">Prepared by: <strong>${preparedBy || 'Circle Financial Planning'}</strong></p>
              </div>
            </div>
            <div class="cover-footer">
              <p>Confidential - For Client Use Only</p>
            </div>
          </div>
          
          <!-- Content Page -->
          <div class="content-page">
            <div class="page-header">
              <img src="${logoUrl}" alt="Circle Financial Planning" class="page-header-logo" />
              <div class="page-header-info">
                <strong>${clientProfile?.name || 'Client'}</strong><br/>
                ${clientProfile?.company || 'Company'}<br/>
                ${formattedDate}
              </div>
            </div>
            
            ${reportSpecificContent}
            
            <div class="disclosure">
              <h4>Important Disclosure</h4>
              <p>This report is for informational purposes only and does not constitute tax, legal, or investment advice. The projections and calculations contained herein are based on assumptions that may not reflect actual market conditions or individual circumstances. Past performance is not indicative of future results. Please consult with qualified tax, legal, and financial professionals before making any decisions regarding your equity compensation. Circle Financial Planning, Inc. is a registered investment adviser. Registration does not imply a certain level of skill or training.</p>
            </div>
          </div>
          
          <div class="page-footer">
            <span>Circle Financial Planning, Inc.</span>
            <span>${formattedDate}</span>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(reportContent)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  const handleSelectClient = (client: {
    id: string
    name: string
    company: string
    companyTicker: string
    state: string
    rsuShares?: number
    isoShares?: number
    nsoShares?: number
    esppShares?: number
    totalValue?: number
    taxFilingStatus?: string
  }) => {
    setClientProfile({
      id: client.id,
      name: client.name,
      company: client.company,
      state: client.state,
      filingStatus: (client.taxFilingStatus as "single" | "married") || "married",
    })
    
    // Update primary symbol to client's company ticker
    if (client.companyTicker) {
      setPrimarySymbol(client.companyTicker)
    }
    
    // Use complete 50-state + DC tax rate map from calculations
    const newStateRate = STATE_TAX_RATES[client.state] ?? taxAssumptions.stateRate
    
    // Generate grants based on client's share counts if available
    const newGrants: Grant[] = []
    const baseGrantDate = "2023-01-15"
    const baseVestDate = "2026-01-15"
    
    const ticker = client.companyTicker || primarySymbol
    
    if (client.rsuShares && client.rsuShares > 0) {
      newGrants.push({
        id: `${client.id}-rsu`,
        type: "RSU",
        symbol: ticker,
        shares: client.rsuShares,
        strike: 0,
        grantDate: baseGrantDate,
        vestDate: baseVestDate,
        fmvAtVest: taxAssumptions.currentPrice,
      })
    }
    if (client.isoShares && client.isoShares > 0) {
      newGrants.push({
        id: `${client.id}-iso`,
        type: "ISO",
        symbol: ticker,
        shares: client.isoShares,
        strike: Math.round(taxAssumptions.currentPrice * 0.6),
        grantDate: "2022-06-01",
        vestDate: "2025-06-01",
        fmvAtVest: taxAssumptions.currentPrice,
      })
    }
    if (client.nsoShares && client.nsoShares > 0) {
      newGrants.push({
        id: `${client.id}-nso`,
        type: "NSO",
        symbol: ticker,
        shares: client.nsoShares,
        strike: Math.round(taxAssumptions.currentPrice * 0.7),
        grantDate: "2022-03-01",
        vestDate: "2025-03-01",
        fmvAtVest: taxAssumptions.currentPrice,
      })
    }
    if (client.esppShares && client.esppShares > 0) {
      newGrants.push({
        id: `${client.id}-espp`,
        type: "ESPP",
        symbol: ticker,
        shares: client.esppShares,
        strike: Math.round(taxAssumptions.currentPrice * 0.85),
        grantDate: "2024-01-01",
        vestDate: "2024-07-01",
        fmvAtVest: taxAssumptions.currentPrice,
      })
    }
    
    // If client has grants, use them; otherwise keep existing grants
    if (newGrants.length > 0) {
      setGrants(newGrants)
    }
    
    setTaxAssumptions({ ...taxAssumptions, stateRate: newStateRate })
    setClientsOpen(false)
  }

  const handleStateRateChange = (rate: number) => {
    setTaxAssumptions({ ...taxAssumptions, stateRate: rate })
  }

  const handleStockPriceUpdate = (symbol: string, price: number) => {
    // Update tax assumptions current price
    setTaxAssumptions((prev) => ({ ...prev, currentPrice: price }))
    // Only update fmvAtVest on grants that explicitly match this symbol.
    // Do NOT update grants with other symbols or historical FMV data.
    setGrants((prevGrants) =>
      prevGrants.map((grant) => {
        if (grant.symbol === symbol) {
          return { ...grant, fmvAtVest: price }
        }
        return grant
      })
    )
  }

  const tabs = [
    {
      value: "planner",
      label: "Grant Planner",
      icon: FileSpreadsheet,
    },
    {
      value: "strategy",
      label: "Strategy",
      icon: TrendingUp,
    },
    {
      value: "simulation",
      label: "Monte Carlo",
      icon: Activity,
    },
    {
      value: "projections",
      label: "Projections",
      icon: LineChart,
    },
    {
      value: "tax",
      label: "Tax & AMT",
      icon: Calculator,
    },
    {
      value: "blackout",
      label: "Blackouts",
      icon: Shield,
    },
    {
      value: "education",
      label: "Education",
      icon: GraduationCap,
    },
  ]

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <Header
        onResetSample={handleResetSample}
        onExportCalendar={handleExportCalendar}
        onExportPDF={handleExportPDF}
        onNavigate={handleNavigate}
        onOpenClients={() => setClientsOpen(true)}
        onOpenReports={() => setReportsOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={logout}
        activeTab={activeTab}
        user={user}
      />

      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 pb-12">
          {/* KPI Cards */}
          <KpiCards
            income={totals.income}
            tax={totals.tax}
            cash={totals.cash}
            afterTax={totals.afterTax}
            hasGrants={grants.length > 0}
          />

          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-10" ref={tabsRef}>
            <TabsList className="mb-6 flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-sm transition-all data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg hover:bg-muted/50 data-[state=active]:hover:bg-primary"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {/* Grant Planner Tab */}
            <TabsContent value="planner" className="mt-0 space-y-6">
              <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                <div className="space-y-4">
<ClientProfileSelector
  profile={clientProfile}
  onProfileChange={setClientProfile}
  onStateRateChange={handleStateRateChange}
  onSelectSavedClient={handleSelectClient}
  onClearProfile={handleClearProfile}
  />
                  <StockTicker
                    primarySymbol={primarySymbol}
                    onPrimarySymbolChange={setPrimarySymbol}
                    onPriceUpdate={handleStockPriceUpdate}
                  />
                  <TaxAssumptions
                    assumptions={taxAssumptions}
                    onChange={setTaxAssumptions}
                  />
                </div>
                <div className="space-y-6">
                  <GrantPlanner
                    grants={grants}
                    taxAssumptions={taxAssumptions}
                    blackouts={blackouts}
                    onGrantsChange={setGrants}
                    primarySymbol={primarySymbol}
                  />
{/* Suggested Actions - AI-powered recommendations */}
  <SuggestedActions
    grants={grants}
    taxAssumptions={taxAssumptions}
    blackouts={blackouts}
    concentrationThreshold={concentrationThreshold}
    liquidityTarget={liquidityTarget}
    actions={suggestedActions}
    onActionsChange={setSuggestedActions}
  />
  {/* Portfolio Insights - Fills white space */}
  <PortfolioInsights
    grants={grants}
    taxAssumptions={taxAssumptions}
    concentrationThreshold={concentrationThreshold}
    liquidityTarget={liquidityTarget}
    onConcentrationThresholdChange={setConcentrationThreshold}
    onLiquidityTargetChange={setLiquidityTarget}
  />
  </div>
              </div>
            </TabsContent>

            {/* Strategy Tab */}
            <TabsContent value="strategy" className="mt-0 space-y-6">
<ScenarioComparison
  inputs={scenarioInputs}
  onChange={setScenarioInputs}
  preferredStrategy={preferredStrategy}
  onPreferredStrategyChange={setPreferredStrategy}
  hasGrants={grants.length > 0}
  grants={grants}
  currentPrice={taxAssumptions.currentPrice}
  />
<TaxLotOptimizer
  currentPrice={taxAssumptions.currentPrice}
  ordinaryRate={taxAssumptions.ordinaryRate}
  ltcgRate={taxAssumptions.ltcgRate}
  grants={grants}
                stateRate={taxAssumptions.stateRate}
              />
              <PlanningNotes />
            </TabsContent>

            {/* Monte Carlo Tab */}
            <TabsContent value="simulation" className="mt-0">
              <MonteCarlo spotPrice={taxAssumptions.currentPrice} hasGrants={grants.length > 0} grants={grants} taxAssumptions={taxAssumptions} />
            </TabsContent>

            {/* Projections Tab */}
            <TabsContent value="projections" className="mt-0">
              <MultiYearProjections
                grants={grants}
                taxAssumptions={taxAssumptions}
              />
            </TabsContent>

            {/* Tax & AMT Tab */}
            <TabsContent value="tax" className="mt-0">
              <AMTTracker isoExercises={isoExercises} amtRate={taxAssumptions.amtRate} hasGrants={grants.length > 0} />
            </TabsContent>

            {/* Blackouts Tab */}
            <TabsContent value="blackout" className="mt-0">
              <BlackoutWindows blackouts={blackouts} onChange={setBlackouts} />
            </TabsContent>

            {/* Education Tab */}
            <TabsContent value="education" className="mt-0">
              <EducationCenter />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <ComplianceDisclaimer />

      {/* Dialogs */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ClientsDialog 
        open={clientsOpen} 
        onOpenChange={setClientsOpen} 
        selectedClientId={clientProfile?.id}
        onSelectClient={handleSelectClient}
      />
      <ReportsDialog 
        open={reportsOpen} 
        onOpenChange={setReportsOpen} 
        onGenerateReport={handleGenerateReport}
        defaultPreparedFor={clientProfile?.name || ""}
      />
    </div>
  )
}
