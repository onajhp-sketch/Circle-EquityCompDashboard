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
import { ElectionTracker } from "@/components/dashboard/election-tracker"
import { MultiYearProjections } from "@/components/dashboard/multi-year-projections"
import { StockTicker } from "@/components/dashboard/stock-ticker"
import { WelcomeScreen } from "@/components/dashboard/welcome-screen"
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
import { buildEquitySummaryReport, buildVestingCalendarReport, buildBlackoutReport } from "@/lib/report-generator"
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

  // ── Data version guard ──────────────────────────────────────
  // If localStorage was written by an older version of the app
  // (e.g. one that seeded sample data by default), clear it so
  // the welcome screen shows correctly for returning users.
  const APP_VERSION = "2.0"
  if (typeof window !== "undefined") {
    const storedVersion = localStorage.getItem("circle_app_version")
    if (storedVersion !== APP_VERSION) {
      // Clear all circle_ keys from old version
      Object.keys(localStorage)
        .filter((k) => k.startsWith("circle_") && k !== "circle_session")
        .forEach((k) => localStorage.removeItem(k))
      localStorage.setItem("circle_app_version", APP_VERSION)
    }
  }

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
    return [] // No sample data — wait for user to load a client
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
    return null // No default profile — advisor must load or create a client
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
    const today = new Date()
    const formattedDate = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    const logoUrl = window.location.origin + "/images/circle-logo-horizontal.png"

    const reportTitles: Record<string, string> = {
      "equity-summary":       "Equity Compensation Summary",
      "tax-projection":       "Tax Projection Report",
      "vesting-calendar":     "Vesting Calendar",
      "concentration-analysis": "Concentration Analysis",
      "exercise-strategy":    "Exercise Strategy Report",
      "blackout-schedule":    "Blackout Window Schedule",
    }

    const reportTitle = reportTitles[reportType] || "Equity Report"
    const baseParams = {
      reportTitle,
      clientName:  clientProfile?.name || "Client",
      company:     clientProfile?.company || "",
      preparedBy:  preparedBy || "Circle Financial Planning",
      preparedFor: preparedFor || clientProfile?.name || "Client",
      date:        formattedDate,
      logoUrl,
      grants,
      taxAssumptions,
      totals,
      preferredStrategy,
      scenarioInputs,
      concentrationThreshold,
      liquidityTarget,
      suggestedActions,
    }

    let html = ""
    if (reportType === "vesting-calendar") {
      html = buildVestingCalendarReport(baseParams)
    } else if (reportType === "blackout-schedule") {
      html = buildBlackoutReport({ ...baseParams, blackouts })
    } else {
      // equity-summary, tax-projection, exercise-strategy, concentration-analysis
      html = buildEquitySummaryReport(baseParams)
    }

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.onload = () => { printWindow.print() }
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
      value: "tax83b",
      label: "83(b) Elections",
      icon: FileSpreadsheet,
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

  // Show welcome screen when no client is loaded and no grants exist
  const hasData = grants.length > 0 || clientProfile !== null

  if (!hasData) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
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
        <WelcomeScreen
          onOpenClients={() => setClientsOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <ClientsDialog
          open={clientsOpen}
          onOpenChange={setClientsOpen}
          selectedClientId={clientProfile?.id}
          onSelectClient={handleSelectClient}
        />
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    )
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
        <div className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
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
            <TabsContent value="planner" className="mt-0 space-y-6 w-full">
              <div className="planner-grid grid gap-6 lg:grid-cols-[280px_1fr]">
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

            {/* 83(b) Elections Tab */}
            <TabsContent value="tax83b" className="mt-0">
              <ElectionTracker hasGrants={grants.length > 0} />
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
