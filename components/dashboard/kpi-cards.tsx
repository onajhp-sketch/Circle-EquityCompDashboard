"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatCurrency } from "@/lib/calculations"
import { cn } from "@/lib/utils"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Wallet, 
  PiggyBank,
  Info,
  BookOpen,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
} from "lucide-react"

interface KpiCardsProps {
  income: number
  tax: number
  cash: number
  afterTax: number
  hasGrants?: boolean
}

interface MetricDetail {
  id: string
  label: string
  value: number
  icon: typeof DollarSign
  trend: { value: number; direction: "up" | "down" }
  description: string
  highlight: boolean
  bgColor: string
  detailContent: {
    title: string
    subtitle: string
    definition: string
    taxCodeReference: string
    calculation: string[]
    planningTips: string[]
    warnings: string[]
    resources: { label: string; description: string; url: string }[]
  }
}

export function KpiCards({ income, tax, cash, afterTax, hasGrants = true }: KpiCardsProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricDetail | null>(null)

  const metrics: MetricDetail[] = [
    {
      id: "income",
      label: "Ordinary / AMT Income",
      value: income,
      icon: DollarSign,
      trend: { value: 12.5, direction: "up" as const },
      description: "Total taxable compensation",
      highlight: false,
      bgColor: "bg-gradient-to-br from-sky-50 to-sky-100/50",
      detailContent: {
        title: "Ordinary & AMT Income",
        subtitle: "Understanding Your Taxable Compensation",
        definition: "Ordinary income from equity compensation represents the taxable amount recognized when RSUs vest or when NSOs are exercised. For ISOs, the spread at exercise may trigger Alternative Minimum Tax (AMT) even though no regular income tax is due at that time.",
        taxCodeReference: "IRC Section 83 governs the taxation of property transferred in connection with services. ISO taxation is covered under IRC Sections 421-424. AMT is calculated under IRC Sections 55-59.",
        calculation: [
          "RSUs: Fair Market Value at vesting = Ordinary Income",
          "NSOs: (FMV at exercise - Strike Price) x Shares = Ordinary Income",
          "ISOs: (FMV at exercise - Strike Price) x Shares = AMT Preference Item",
          "ESPP: Discount portion may be ordinary income depending on holding period"
        ],
        planningTips: [
          "Consider exercising ISOs in years with lower regular income to minimize AMT impact",
          "Spread NSO exercises across multiple tax years to avoid bracket creep",
          "RSU vesting is automatic - plan withholding elections in advance",
          "Track AMT credits generated from ISO exercises for future recovery"
        ],
        warnings: [
          "ISO disqualifying dispositions convert capital gains to ordinary income",
          "NSO income is subject to payroll taxes (Social Security & Medicare)",
          "AMT can create cash flow issues if stock cannot be sold immediately"
        ],
        resources: [
          { label: "IRS Topic 427", description: "Stock Options guidance from the IRS", url: "https://www.irs.gov/taxtopics/tc427" },
          { label: "IRS Publication 525", description: "Taxable and Nontaxable Income", url: "https://www.irs.gov/publications/p525" },
          { label: "Form 6251", description: "Alternative Minimum Tax calculation", url: "https://www.irs.gov/forms-pubs/about-form-6251" }
        ]
      }
    },
    {
      id: "tax",
      label: "Estimated Tax",
      value: tax,
      icon: Percent,
      trend: { value: 8.2, direction: "up" as const },
      description: "Federal + state liability",
      highlight: false,
      bgColor: "bg-gradient-to-br from-rose-50 to-rose-100/50",
      detailContent: {
        title: "Estimated Tax Liability",
        subtitle: "Combined Federal & State Tax Projection",
        definition: "This represents the total estimated tax liability on your equity compensation, including federal income tax, state income tax, and applicable payroll taxes. For ISOs, this may include AMT liability.",
        taxCodeReference: "Federal rates are set by IRC Section 1. State rates vary by jurisdiction. Payroll taxes are governed by FICA (Social Security & Medicare) under IRC Sections 3101-3128.",
        calculation: [
          "Federal Tax: Income x Marginal Tax Rate (10% - 37%)",
          "State Tax: Income x State Rate (0% - 13.3% depending on state)",
          "FICA (NSOs): Income x 7.65% (up to Social Security wage base)",
          "Medicare Surtax: Additional 0.9% on income over $200K/$250K"
        ],
        planningTips: [
          "Estimate quarterly tax payments to avoid underpayment penalties",
          "Consider state residency implications for high-tax vs low-tax states",
          "Maximize deductions in high-income years (charitable giving, etc.)",
          "Evaluate Roth conversions in lower-income years to optimize lifetime taxes"
        ],
        warnings: [
          "Underpayment penalties apply if you owe more than $1,000 at filing",
          "State tax rules vary - some states have no income tax, others exceed 10%",
          "Net Investment Income Tax (3.8%) may apply to capital gains"
        ],
        resources: [
          { label: "IRS Tax Brackets", description: "Current year federal tax rates", url: "https://www.irs.gov/filing/federal-income-tax-rates-and-brackets" },
          { label: "Form 1040-ES", description: "Estimated tax payment vouchers", url: "https://www.irs.gov/forms-pubs/about-form-1040-es" },
          { label: "State Tax Agencies", description: "Individual state tax information", url: "https://www.irs.gov/businesses/small-businesses-self-employed/state-government-websites" }
        ]
      }
    },
    {
      id: "cash",
      label: "Cash to Exercise",
      value: cash,
      icon: Wallet,
      trend: { value: 3.1, direction: "down" as const },
      description: "Required liquidity",
      highlight: false,
      bgColor: "bg-gradient-to-br from-violet-50 to-violet-100/50",
      detailContent: {
        title: "Cash Required to Exercise",
        subtitle: "Liquidity Planning for Stock Options",
        definition: "The total out-of-pocket cash needed to exercise your stock options. This includes the strike price multiplied by the number of shares, plus any immediate tax withholding requirements for NSOs.",
        taxCodeReference: "Exercise costs are determined by the option agreement terms. Tax withholding requirements for NSOs are governed by IRC Section 3402 and Treasury Regulations.",
        calculation: [
          "Option Exercise Cost: Strike Price x Number of Shares",
          "NSO Tax Withholding: Spread x Withholding Rate (often 22% federal + state)",
          "Total Cash Needed: Exercise Cost + Tax Withholding",
          "Net Share Exercise: Use some shares to cover costs (if permitted)"
        ],
        planningTips: [
          "Build an exercise fund in advance of anticipated option exercises",
          "Consider cashless exercise (same-day sale) if liquidity is limited",
          "Net share exercise reduces shares received but eliminates cash outlay",
          "Exercise options with lowest strike prices first for capital efficiency"
        ],
        warnings: [
          "ISOs require cash payment - no automatic withholding means you must plan for taxes",
          "Cashless exercise triggers immediate taxation on the full spread",
          "Options expiring soon may force exercise decisions with limited planning time"
        ],
        resources: [
          { label: "Cashless Exercise", description: "Same-day sale strategies", url: "https://www.investopedia.com/terms/c/cashlessexercise.asp" },
          { label: "Net Share Settlement", description: "Using shares to cover costs", url: "https://www.investopedia.com/terms/n/netexercise.asp" },
          { label: "83(b) Elections", description: "Early exercise tax strategies", url: "https://www.irs.gov/irb/2012-28_IRB#NOT-2012-40" }
        ]
      }
    },
    {
      id: "afterTax",
      label: "After-Tax Value",
      value: afterTax,
      icon: PiggyBank,
      trend: { value: 15.8, direction: "up" as const },
      description: "Net proceeds estimate",
      highlight: true,
      bgColor: "bg-gradient-to-br from-amber-50 to-amber-100/50",
      detailContent: {
        title: "After-Tax Value",
        subtitle: "Your Net Equity Compensation Value",
        definition: "The estimated value of your equity compensation after all taxes have been paid. This represents what you would actually receive if you exercised all options and sold all shares at the current price.",
        taxCodeReference: "Net value calculation incorporates IRC Section 83 ordinary income treatment, capital gains rates under IRC Section 1(h), and applicable state tax laws.",
        calculation: [
          "Gross Value: Current Stock Price x Total Shares",
          "Less: Exercise Costs (Strike Price x Shares for options)",
          "Less: Ordinary Income Tax on spread/vest value",
          "Less: Capital Gains Tax (if applicable on appreciation after vest/exercise)",
          "Equals: After-Tax Net Proceeds"
        ],
        planningTips: [
          "Holding shares for >1 year after exercise converts gains to long-term capital gains",
          "For ISOs, holding 2 years from grant + 1 year from exercise = qualifying disposition",
          "Consider diversification to reduce concentration risk in company stock",
          "Factor in opportunity cost of holding concentrated stock positions"
        ],
        warnings: [
          "Stock price volatility means actual value may differ significantly",
          "Holding for tax benefits increases market risk exposure",
          "Company-specific risks (performance, industry trends) affect value"
        ],
        resources: [
          { label: "Capital Gains Rates", description: "Short-term vs long-term rates", url: "https://www.irs.gov/taxtopics/tc409" },
          { label: "ISO Holding Periods", description: "Qualifying disposition requirements", url: "https://www.irs.gov/publications/p525#en_US_2023_publink1000229246" },
          { label: "Diversification", description: "Managing concentration risk", url: "https://www.sec.gov/investor/pubs/assetallocation.htm" }
        ]
      }
    },
  ]

  return (
    <>
      <div className="grid grid-cols-1 gap-5 pt-6 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          const TrendIcon = metric.trend.direction === "up" ? TrendingUp : TrendingDown
          const showTrend = hasGrants && metric.value > 0
          
          return (
            <Card
              key={metric.label}
              className={cn(
                "relative cursor-pointer overflow-hidden border p-4 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] sm:p-5 lg:p-6",
                metric.bgColor,
                metric.highlight && "border-accent/40 ring-1 ring-accent/20"
              )}
              onClick={() => setSelectedMetric(metric)}
            >
              {/* Subtle gradient overlay for highlighted card */}
              {metric.highlight && (
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
              )}

              <div className="relative flex h-full flex-col">
                {/* Header with icon */}
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 text-xs font-bold uppercase leading-tight tracking-wider text-muted-foreground sm:text-sm">
                    {metric.label}
                  </p>
                  <div
                    className={cn(
                      "shrink-0 rounded-lg p-2",
                      metric.highlight
                        ? "bg-accent/10 text-accent"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>

                {/* Value */}
                <p
                  className={cn(
                    "mt-3 font-serif text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl",
                    metric.highlight ? "text-[#9A6A10]" : "text-foreground"
                  )}
                >
                  {hasGrants ? formatCurrency(metric.value) : "$0"}
                </p>

                {/* Trend & Description */}
                <div className="mt-auto flex flex-col gap-1.5 pt-3 sm:flex-row sm:items-center sm:gap-2">
                  {showTrend ? (
                    <div
                      className={cn(
                        "inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        metric.trend.direction === "up"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      )}
                    >
                      <TrendIcon className="h-3 w-3" />
                      {metric.trend.value}%
                    </div>
                  ) : (
                    <div className="inline-flex w-fit shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      <Info className="h-3 w-3" />
                      No data
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {metric.description}
                  </span>
                </div>
                
                {/* Click hint */}
                <div className="absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <Info className="h-4 w-4 text-muted-foreground/50" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Detail Sheet/Drawer */}
      <Sheet open={!!selectedMetric} onOpenChange={(open) => !open && setSelectedMetric(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selectedMetric && (
            <>
              <SheetHeader className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "rounded-lg p-2.5",
                    selectedMetric.highlight ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                  )}>
                    <selectedMetric.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <SheetTitle className="font-serif text-xl">{selectedMetric.detailContent.title}</SheetTitle>
                    <SheetDescription>{selectedMetric.detailContent.subtitle}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Current Value */}
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm font-medium text-muted-foreground">Current Value</p>
                  <p className={cn(
                    "mt-1 font-serif text-3xl font-bold",
                    selectedMetric.highlight ? "text-[#9A6A10]" : "text-foreground"
                  )}>
                    {hasGrants ? formatCurrency(selectedMetric.value) : "$0"}
                  </p>
                  {hasGrants && selectedMetric.value > 0 && (
                    <div className={cn(
                      "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      selectedMetric.trend.direction === "up"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    )}>
                      {selectedMetric.trend.direction === "up" ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {selectedMetric.trend.value}% vs. prior period
                    </div>
                  )}
                </div>

                {/* Definition */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold">Definition</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedMetric.detailContent.definition}
                  </p>
                </div>

                {/* Tax Code Reference */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="border-blue-300 bg-blue-100 text-blue-700">
                      Tax Code Reference
                    </Badge>
                  </div>
                  <p className="text-sm text-blue-800">
                    {selectedMetric.detailContent.taxCodeReference}
                  </p>
                </div>

                {/* Calculation */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold">How It's Calculated</h4>
                  </div>
                  <div className="space-y-2">
                    {selectedMetric.detailContent.calculation.map((step, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {i + 1}
                        </span>
                        <span className="text-muted-foreground">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Planning Tips */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    <h4 className="font-semibold">Planning Tips</h4>
                  </div>
                  <div className="space-y-2">
                    {selectedMetric.detailContent.planningTips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                        <span className="text-muted-foreground">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warnings */}
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <h4 className="font-semibold text-amber-800">Important Considerations</h4>
                  </div>
                  <div className="space-y-2">
                    {selectedMetric.detailContent.warnings.map((warning, i) => (
                      <p key={i} className="text-sm text-amber-800">
                        • {warning}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Resources */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ExternalLink className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold">Related Resources</h4>
                  </div>
                  <div className="space-y-2">
                    {selectedMetric.detailContent.resources.map((resource, i) => (
                      <a 
                        key={i} 
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50 hover:border-primary/30 cursor-pointer group"
                      >
                        <div>
                          <p className="font-medium text-sm group-hover:text-primary transition-colors">{resource.label}</p>
                          <p className="text-xs text-muted-foreground">{resource.description}</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-2" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

// Export metric summaries for use in reports
export function getKpiSummariesForReport(income: number, tax: number, cash: number, afterTax: number) {
  return {
    ordinaryIncome: {
      value: income,
      summary: "Ordinary income represents the taxable compensation recognized when RSUs vest or when NSOs are exercised. For ISOs, the spread at exercise may trigger Alternative Minimum Tax (AMT).",
      keyPoints: [
        "RSUs: Taxed as ordinary income at vesting based on fair market value",
        "NSOs: Spread at exercise is ordinary income subject to payroll taxes",
        "ISOs: No regular tax at exercise, but may trigger AMT liability"
      ]
    },
    estimatedTax: {
      value: tax,
      summary: "Combined federal and state tax liability on equity compensation, including applicable payroll taxes and potential AMT for ISOs.",
      keyPoints: [
        "Federal rates range from 10% to 37% based on total income",
        "State rates vary by jurisdiction (0% to 13.3%)",
        "NSO exercises incur FICA taxes (Social Security & Medicare)"
      ]
    },
    cashToExercise: {
      value: cash,
      summary: "Total cash required to exercise stock options, including strike price and immediate tax withholding for NSOs.",
      keyPoints: [
        "Options require payment of strike price x shares",
        "NSOs may require withholding at time of exercise",
        "Consider cashless or net share exercise alternatives if liquidity is limited"
      ]
    },
    afterTaxValue: {
      value: afterTax,
      summary: "Net value of equity compensation after all taxes, representing actual proceeds if all positions were liquidated at current prices.",
      keyPoints: [
        "Holding shares >1 year may qualify for long-term capital gains rates",
        "ISOs require 2-year grant hold + 1-year exercise hold for favorable treatment",
        "Diversification should be considered to manage concentration risk"
      ]
    }
  }
}
