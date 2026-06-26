"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  PieChart,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Target,
  Wallet,
  ExternalLink,
  BookOpen,
  Lightbulb,
  Shield,
  Calculator,
  Info,
  CheckCircle2,
  XCircle,
  Settings2,
} from "lucide-react"
import { type Grant, type TaxAssumptions, calculateGrant, formatCurrency } from "@/lib/calculations"
import { cn } from "@/lib/utils"

interface PortfolioInsightsProps {
  grants: Grant[]
  taxAssumptions: TaxAssumptions
  liquidityTarget?: number
  concentrationThreshold?: number
  netWorth?: number
  onLiquidityTargetChange?: (value: number) => void
  onConcentrationThresholdChange?: (value: number) => void
}

// Educational content for each insight tile
const insightContent = {
  concentration: {
    title: "Concentration Risk",
    icon: PieChart,
    definition: "Concentration risk refers to the potential for significant financial loss when a large portion of your wealth is tied to a single asset, particularly your employer's stock.",
    taxReference: "While not a tax code issue directly, concentration relates to SEC guidelines on insider trading (Rule 10b5-1) and diversification principles endorsed by FINRA.",
    whyItMatters: [
      "Employer stock is doubly correlated - your job security and wealth are tied to the same company",
      "Single-stock volatility is typically 2-3x higher than a diversified portfolio",
      "Company-specific events (earnings misses, lawsuits, leadership changes) can cause rapid declines",
      "Research shows employees often hold 5-10x more company stock than advisable"
    ],
    thresholds: [
      { level: "Conservative", percent: "< 10%", risk: "Low", description: "Well-diversified, minimal company-specific risk" },
      { level: "Moderate", percent: "10-25%", risk: "Medium", description: "Reasonable exposure, monitor for changes" },
      { level: "Aggressive", percent: "25-40%", risk: "High", description: "Significant exposure, consider reduction strategies" },
      { level: "Critical", percent: "> 40%", risk: "Very High", description: "Urgent need for diversification planning" }
    ],
    strategies: [
      "Implement a systematic selling plan (Rule 10b5-1) to reduce exposure over time",
      "Consider exchange funds to diversify without immediate tax consequences",
      "Use charitable giving strategies (donor-advised funds, charitable remainder trusts)",
      "Evaluate hedging strategies (collars, protective puts) for downside protection",
      "Coordinate sales with other income events to optimize tax brackets"
    ],
    warnings: [
      "Insider trading rules may restrict when you can sell",
      "Blackout periods around earnings limit trading windows",
      "Emotional attachment to company stock often leads to poor decisions",
      "Don't let tax tail wag the investment dog - taxes shouldn't prevent diversification"
    ],
    resources: [
      { label: "SEC Rule 10b5-1", description: "Trading plan guidelines for insiders", url: "https://www.sec.gov/rules/final/2022/33-11138.pdf" },
      { label: "FINRA Concentration", description: "Concentration risk guidance", url: "https://www.finra.org/investors/insights/concentrated-stock-positions" },
      { label: "Schwab: Overconcentration", description: "Managing equity compensation risk", url: "https://www.schwab.com/learn/story/overconcentration-equity-compensation" }
    ]
  },
  liquidity: {
    title: "Liquidity Needs",
    icon: Wallet,
    definition: "Liquidity needs represent the cash required to exercise stock options and pay associated taxes. Proper liquidity planning ensures you can capture equity value without financial strain.",
    taxReference: "IRS requires payment of estimated taxes (Form 1040-ES) when tax liability exceeds $1,000. Underpayment can result in penalties under IRC Section 6654.",
    whyItMatters: [
      "Stock option exercises require upfront cash for strike price and taxes",
      "RSU vesting triggers immediate tax liability on the full fair market value",
      "ISO exercises may create AMT liability requiring cash reserves",
      "Insufficient liquidity may force suboptimal exercise timing or cashless exercises"
    ],
    calculations: [
      { item: "Strike Price Cost", formula: "Shares × Strike Price", description: "Cash needed to purchase shares" },
      { item: "Withholding Taxes", formula: "Spread × Tax Rate", description: "Federal, state, FICA on ordinary income" },
      { item: "AMT Exposure (ISO)", formula: "ISO Spread × 28%", description: "Alternative minimum tax on ISO bargain element" },
      { item: "Total Liquidity", formula: "Sum of all above", description: "Total cash needed at exercise/vest" }
    ],
    strategies: [
      "Build dedicated cash reserves in advance of vesting/exercise events",
      "Consider sell-to-cover for RSUs to automatically fund tax withholding",
      "Evaluate cashless exercise for NSOs when cash is limited",
      "Spread ISO exercises across multiple years to manage AMT exposure",
      "Use margin loans cautiously as bridge financing (understand risks)"
    ],
    warnings: [
      "Cashless exercises result in immediate ordinary income tax on full spread",
      "Margin loans can force liquidation if stock price drops",
      "Underpayment of estimated taxes incurs IRS penalties",
      "Don't assume you can sell immediately - blackout periods may prevent sales"
    ],
    resources: [
      { label: "Form 1040-ES", description: "Estimated tax payment requirements", url: "https://www.irs.gov/forms-pubs/about-form-1040-es" },
      { label: "Cashless Exercise", description: "How same-day sales work", url: "https://www.investopedia.com/terms/c/cashlessexercise.asp" },
      { label: "Fidelity: Liquidity", description: "Planning for stock option exercises", url: "https://www.fidelity.com/viewpoints/personal-finance/stock-options-managing-risks" }
    ]
  },
  grantMix: {
    title: "Grant Mix Analysis",
    icon: Target,
    definition: "Your grant mix shows the composition of equity compensation types in your portfolio. Each type (RSU, ISO, NSO, ESPP) has distinct tax treatment and planning implications.",
    taxReference: "Different equity types are governed by various IRC sections: RSUs (Section 83), ISOs (Section 421-424), NSOs (Section 83), and ESPPs (Section 423).",
    typeComparison: [
      { type: "RSU", taxAtVest: "Ordinary income", taxAtSale: "Capital gains on appreciation", amtRisk: "None", holding: "Not required for favorable treatment" },
      { type: "ISO", taxAtVest: "None (but AMT adjustment)", taxAtSale: "LTCG if qualified", amtRisk: "High", holding: "2 years from grant, 1 year from exercise" },
      { type: "NSO", taxAtVest: "Ordinary income on spread", taxAtSale: "Capital gains on appreciation", amtRisk: "None", holding: "1 year for LTCG on post-exercise gains" },
      { type: "ESPP", taxAtVest: "Depends on disposition", taxAtSale: "Favorable if qualified", amtRisk: "None", holding: "2 years from offering, 1 year from purchase" }
    ],
    strategies: [
      "Prioritize ISO exercises when AMT exposure is manageable for best tax treatment",
      "Use NSO exercises to generate ordinary income in lower-income years",
      "Maximize ESPP participation for guaranteed discount (often 15%)",
      "Consider RSU diversification immediately at vest to reduce concentration",
      "Coordinate across grant types to optimize annual tax brackets"
    ],
    warnings: [
      "Mixing grant types in a single year can complicate tax planning",
      "ISO disqualifying dispositions convert favorable treatment to ordinary income",
      "ESPP shares sold before holding period lose favorable treatment",
      "Track cost basis carefully - different types have different basis rules"
    ],
    resources: [
      { label: "IRC Section 83", description: "Property transferred for services", url: "https://www.law.cornell.edu/uscode/text/26/83" },
      { label: "IRC Section 421-424", description: "Incentive stock option rules", url: "https://www.law.cornell.edu/uscode/text/26/422" },
      { label: "IRS ESPP Guide", description: "Employee stock purchase plans", url: "https://www.irs.gov/publications/p525#en_US_2023_publink1000229176" }
    ]
  },
  upcomingVests: {
    title: "Vesting Calendar",
    icon: Calendar,
    definition: "Your vesting calendar shows when equity grants will vest and become taxable events. Strategic planning around vesting dates is crucial for tax optimization and liquidity management.",
    taxReference: "Vesting triggers recognition under IRC Section 83(a). The fair market value on vesting date becomes ordinary income (RSU/NSO) or creates AMT preference items (ISO).",
    planningConsiderations: [
      "Multiple vests in a single year may push you into higher tax brackets",
      "Year-end vests provide less time to manage tax consequences",
      "Q4 vests may benefit from year-end tax-loss harvesting opportunities",
      "Consider other income events (bonuses, capital gains) when planning around vests"
    ],
    strategies: [
      "Review vesting schedule at start of each year to estimate tax impact",
      "Coordinate 401(k) contributions and deductions around major vest events",
      "Consider accelerating or deferring other income relative to vest timing",
      "Set aside cash reserves before large vesting events",
      "Document cost basis on vest date for accurate gain/loss calculations"
    ],
    actionItems: [
      { timing: "60+ days before", action: "Review tax situation and estimate total liability" },
      { timing: "30 days before", action: "Ensure cash reserves are adequate for taxes" },
      { timing: "Vest date", action: "Document FMV and shares received" },
      { timing: "After vest", action: "Decide hold vs. sell strategy, execute if selling" },
      { timing: "Year-end", action: "Review total equity income, adjust estimated taxes" }
    ],
    warnings: [
      "Vesting date FMV determines tax liability regardless of future price changes",
      "Company withholding (often 22%) may be insufficient for higher earners",
      "State taxes vary significantly - California taxes equity as ordinary income",
      "Don't forget FICA taxes (Social Security/Medicare) on RSU and NSO vests"
    ],
    resources: [
      { label: "IRS Topic 427", description: "Stock options tax treatment", url: "https://www.irs.gov/taxtopics/tc427" },
      { label: "Form W-2 Box 14", description: "Equity compensation reporting", url: "https://www.irs.gov/pub/irs-pdf/fw2.pdf" },
      { label: "State Tax Guide", description: "State-by-state equity taxation", url: "https://www.irs.gov/businesses/small-businesses-self-employed/state-government-websites" }
    ]
  }
}

export function PortfolioInsights({
  grants,
  taxAssumptions,
  liquidityTarget = 100000,
  concentrationThreshold = 0.25,
  netWorth = 500000,
  onLiquidityTargetChange,
  onConcentrationThresholdChange,
}: PortfolioInsightsProps) {
  const [selectedInsight, setSelectedInsight] = useState<keyof typeof insightContent | null>(null)

  // Calculate portfolio metrics
  const totals = grants.reduce(
    (acc, grant) => {
      const calc = calculateGrant(grant, taxAssumptions)
      return {
        shares: acc.shares + grant.shares,
        value: acc.value + calc.afterTax,
        cash: acc.cash + calc.cash,
        tax: acc.tax + calc.tax,
      }
    },
    { shares: 0, value: 0, cash: 0, tax: 0 }
  )

  // Type distribution
  const typeDistribution = grants.reduce(
    (acc, grant) => {
      const calc = calculateGrant(grant, taxAssumptions)
      acc[grant.type] = (acc[grant.type] || 0) + calc.afterTax
      return acc
    },
    {} as Record<string, number>
  )

  const typeColors: Record<string, string> = {
    RSU: "bg-emerald-500",
    NSO: "bg-blue-500",
    ISO: "bg-purple-500",
    ESPP: "bg-amber-500",
  }

  // Concentration risk
  const concentrationPercent = netWorth > 0 ? totals.value / netWorth : 0
  const isOverConcentrated = concentrationPercent > concentrationThreshold

  // Liquidity analysis
  const liquidityNeeded = totals.cash + totals.tax
  const liquidityShortfall = Math.max(0, liquidityNeeded - liquidityTarget)
  const liquidityCoverage = liquidityTarget > 0 ? Math.min(1, liquidityTarget / liquidityNeeded) : 1

  // Upcoming vest dates
  const upcomingVests = grants
    .filter((g) => g.vestDate && new Date(g.vestDate) > new Date())
    .sort((a, b) => new Date(a.vestDate).getTime() - new Date(b.vestDate).getTime())
    .slice(0, 3)

  const selectedContent = selectedInsight ? insightContent[selectedInsight] : null

  return (
    <>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {/* Concentration Risk */}
        <Card 
          className={cn(
            "min-h-[200px] bg-gradient-to-br from-slate-50 to-slate-100/50 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]",
            isOverConcentrated && "border-amber-300 from-amber-50 to-amber-100/50"
          )}
          onClick={() => setSelectedInsight("concentration")}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base font-medium">Concentration</CardTitle>
              <Info className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
            </div>
            {isOverConcentrated && (
              <Badge variant="outline" className="mt-2 w-fit border-amber-300 bg-amber-100 text-amber-700">
                <AlertTriangle className="mr-1 h-3 w-3" />
                High Risk
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {grants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <p className="text-sm font-medium text-muted-foreground">No Data Available</p>
                <p className="text-xs text-muted-foreground mt-1">Add grants to view concentration risk.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="font-serif text-3xl font-bold">
                    {(concentrationPercent * 100).toFixed(1)}%
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    of net worth in company stock
                  </p>
                </div>
                <Progress
                  value={Math.min(concentrationPercent * 100, 100)}
                  className={cn("h-2.5", isOverConcentrated && "[&>div]:bg-amber-500")}
                />
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Settings2 className="h-3 w-3" />
                      Risk Threshold
                    </Label>
                    <span className="text-xs font-medium">{(concentrationThreshold * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[concentrationThreshold * 100]}
                    onValueChange={(vals) => onConcentrationThresholdChange?.(vals[0] / 100)}
                    min={10}
                    max={50}
                    step={5}
                    className="cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Liquidity Needs */}
        <Card 
          className={cn(
            "min-h-[200px] bg-gradient-to-br from-blue-50 to-blue-100/50 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]",
            liquidityShortfall > 0 && "border-red-300 from-red-50 to-red-100/50"
          )}
          onClick={() => setSelectedInsight("liquidity")}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base font-medium">Liquidity Needs</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {liquidityShortfall > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    Shortfall
                  </Badge>
                )}
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {grants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <p className="text-sm font-medium text-muted-foreground">No Data Available</p>
                <p className="text-xs text-muted-foreground mt-1">Add grants to view liquidity needs.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="font-serif text-3xl font-bold">
                    {formatCurrency(liquidityNeeded)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    cash + tax to exercise all grants
                  </p>
                </div>
                <Progress
                  value={liquidityCoverage * 100}
                  className={cn("h-3", liquidityShortfall > 0 && "[&>div]:bg-red-500")}
                />
                {liquidityShortfall > 0 ? (
                  <p className="text-sm font-medium text-red-600">
                    {formatCurrency(liquidityShortfall)} shortfall
                  </p>
                ) : (
                  <p className="text-sm text-emerald-600">
                    Target covered
                  </p>
                )}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Settings2 className="h-3 w-3" />
                      Cash Reserve Target
                    </Label>
                    <span className="text-xs font-medium">{formatCurrency(liquidityTarget)}</span>
                  </div>
                  <Slider
                    value={[liquidityTarget / 1000]}
                    onValueChange={(vals) => onLiquidityTargetChange?.(vals[0] * 1000)}
                    min={25}
                    max={500}
                    step={25}
                    className="cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$25K</span>
                    <span>$500K</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Type Allocation */}
        <Card 
          className="min-h-[200px] bg-gradient-to-br from-emerald-50 to-emerald-100/50 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
          onClick={() => setSelectedInsight("grantMix")}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base font-medium">Grant Mix</CardTitle>
              <Info className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
            </div>
          </CardHeader>
          <CardContent>
            {grants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="rounded-full bg-muted p-3 mb-3">
                  <PieChart className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No Grant Data Available</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add grants in the Grant Planner tab to view allocation breakdown.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex h-4 overflow-hidden rounded-full">
                  {Object.entries(typeDistribution).map(([type, value]) => (
                    <div
                      key={type}
                      className={cn(typeColors[type])}
                      style={{ width: `${(value / totals.value) * 100}%` }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(typeDistribution).map(([type, value]) => (
                    <div key={type} className="flex items-center gap-2 text-sm">
                      <div className={cn("h-3 w-3 rounded-full", typeColors[type])} />
                      <span className="font-medium">{type}</span>
                      <span className="text-muted-foreground">
                        {((value / totals.value) * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Vests */}
        <Card 
          className="min-h-[200px] bg-gradient-to-br from-purple-50 to-purple-100/50 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
          onClick={() => setSelectedInsight("upcomingVests")}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base font-medium">Upcoming Vests</CardTitle>
              <Info className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
            </div>
          </CardHeader>
          <CardContent>
            {upcomingVests.length > 0 ? (
              <div className="space-y-2.5">
                {upcomingVests.map((grant) => {
                  const calc = calculateGrant(grant, taxAssumptions)
                  const vestDate = new Date(grant.vestDate)
                  const daysUntil = Math.ceil(
                    (vestDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  )
                  const formattedDate = vestDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                  return (
                    <div
                      key={grant.id}
                      className="flex flex-col gap-1.5 rounded-lg border border-white/60 bg-white/70 px-3 py-2.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-semibold",
                            grant.type === "RSU" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                            grant.type === "NSO" && "border-blue-200 bg-blue-50 text-blue-700",
                            grant.type === "ISO" && "border-purple-200 bg-purple-50 text-purple-700",
                            grant.type === "ESPP" && "border-amber-200 bg-amber-50 text-amber-700"
                          )}
                        >
                          {grant.type}
                        </Badge>
                        <span className="text-sm font-semibold text-foreground">
                          {formatCurrency(calc.afterTax)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formattedDate}</span>
                        <span className="font-medium text-purple-600">{daysUntil} days</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <p className="text-sm font-medium text-muted-foreground">No Upcoming Vests</p>
                <p className="text-xs text-muted-foreground mt-1">Add grants with future vest dates.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Sheet */}
      <Sheet open={selectedInsight !== null} onOpenChange={() => setSelectedInsight(null)}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col overflow-y-auto overflow-x-hidden">
          {selectedContent && (
            <>
              <SheetHeader className="pb-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <selectedContent.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <SheetTitle className="font-serif text-xl">{selectedContent.title}</SheetTitle>
                    <SheetDescription className="text-xs mt-1">
                      Click on resources to learn more
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              
              <ScrollArea className="flex-1 -mx-6 px-6 overflow-x-auto">
                <div className="space-y-6 py-6 min-w-0">
                  {/* Definition */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold">Definition</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedContent.definition}
                    </p>
                  </div>

                  {/* Tax Reference */}
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold text-sm">Regulatory Reference</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedContent.taxReference}
                    </p>
                  </div>

                  {/* Concentration-specific: Thresholds */}
                  {selectedInsight === "concentration" && "thresholds" in selectedContent && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">Risk Thresholds</h4>
                      </div>
                      <div className="space-y-2">
                        {(selectedContent as typeof insightContent.concentration).thresholds.map((threshold, i) => (
                          <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                            <div className={cn(
                              "w-2 h-full min-h-[40px] rounded-full",
                              threshold.risk === "Low" && "bg-emerald-500",
                              threshold.risk === "Medium" && "bg-amber-500",
                              threshold.risk === "High" && "bg-orange-500",
                              threshold.risk === "Very High" && "bg-red-500"
                            )} />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{threshold.level}</span>
                                <Badge variant="outline" className="text-xs">{threshold.percent}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{threshold.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Liquidity-specific: Calculations */}
                  {selectedInsight === "liquidity" && "calculations" in selectedContent && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Calculator className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">How It&apos;s Calculated</h4>
                      </div>
                      <div className="space-y-2">
                        {(selectedContent as typeof insightContent.liquidity).calculations.map((calc, i) => (
                          <div key={i} className="rounded-lg border p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{calc.item}</span>
                              <code className="text-xs bg-muted px-2 py-1 rounded">{calc.formula}</code>
                            </div>
                            <p className="text-xs text-muted-foreground">{calc.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grant Mix-specific: Type Comparison */}
                  {selectedInsight === "grantMix" && "typeComparison" in selectedContent && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">Grant Type Comparison</h4>
                      </div>
                      <div className="space-y-3">
                        {(selectedContent as typeof insightContent.grantMix).typeComparison.map((type, i) => (
                          <div key={i} className="rounded-lg border p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={cn(
                                "h-3 w-3 rounded-full",
                                type.type === "RSU" && "bg-emerald-500",
                                type.type === "ISO" && "bg-purple-500",
                                type.type === "NSO" && "bg-blue-500",
                                type.type === "ESPP" && "bg-amber-500"
                              )} />
                              <span className="font-semibold text-sm">{type.type}</span>
                              {type.amtRisk === "High" && (
                                <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">AMT Risk</Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">At Vest/Exercise:</span>
                                <p className="font-medium">{type.taxAtVest}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">At Sale:</span>
                                <p className="font-medium">{type.taxAtSale}</p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              <span className="font-medium">Holding:</span> {type.holding}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upcoming Vests-specific: Action Items */}
                  {selectedInsight === "upcomingVests" && "actionItems" in selectedContent && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">Vesting Timeline Checklist</h4>
                      </div>
                      <div className="space-y-2">
                        {(selectedContent as typeof insightContent.upcomingVests).actionItems.map((item, i) => (
                          <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                            <div className="shrink-0 mt-0.5">
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <span className="font-medium text-sm">{item.timing}</span>
                              <p className="text-xs text-muted-foreground mt-0.5">{item.action}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Why It Matters (for concentration and liquidity) */}
                  {"whyItMatters" in selectedContent && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">Why It Matters</h4>
                      </div>
                      <ul className="space-y-2">
                        {(selectedContent.whyItMatters as string[]).map((point, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-primary mt-1.5">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Planning Considerations (for upcomingVests) */}
                  {"planningConsiderations" in selectedContent && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">Planning Considerations</h4>
                      </div>
                      <ul className="space-y-2">
                        {(selectedContent as typeof insightContent.upcomingVests).planningConsiderations.map((point, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-primary mt-1.5">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Strategies */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      <h4 className="font-semibold">Strategies</h4>
                    </div>
                    <ul className="space-y-2">
                      {selectedContent.strategies.map((strategy, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{strategy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Warnings */}
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <h4 className="font-semibold text-amber-800">Important Warnings</h4>
                    </div>
                    <ul className="space-y-2">
                      {selectedContent.warnings.map((warning, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                          <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Resources */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <ExternalLink className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold">Related Resources</h4>
                    </div>
                    <div className="space-y-2">
                      {selectedContent.resources.map((resource, i) => (
                        <a
                          key={i}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50 hover:border-primary/30 cursor-pointer group relative z-10"
                        >
                          <div className="pointer-events-none">
                            <p className="font-medium text-sm group-hover:text-primary transition-colors">{resource.label}</p>
                            <p className="text-xs text-muted-foreground">{resource.description}</p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-2 pointer-events-none" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

// Export function for report generation
export function getPortfolioInsightsSummaries(
  concentrationPercent: number,
  liquidityNeeded: number,
  liquidityShortfall: number,
  typeDistribution: Record<string, number>,
  upcomingVestsCount: number
) {
  return {
    concentration: {
      value: concentrationPercent,
      summary: concentrationPercent > 0.25 
        ? "Portfolio shows elevated concentration risk. Consider diversification strategies to reduce single-stock exposure."
        : "Concentration levels are within acceptable thresholds for a balanced portfolio approach.",
      keyPoints: [
        "Single-stock positions carry company-specific risk beyond market risk",
        "Recommended threshold is typically 10-25% of net worth",
        "Tax-efficient diversification strategies can help manage exposure"
      ]
    },
    liquidity: {
      value: liquidityNeeded,
      shortfall: liquidityShortfall,
      summary: liquidityShortfall > 0
        ? `Current liquidity reserves show a ${formatCurrency(liquidityShortfall)} shortfall for exercise costs and tax obligations.`
        : "Liquidity position is adequate to cover anticipated exercise costs and tax obligations.",
      keyPoints: [
        "Exercise costs include strike price plus applicable taxes",
        "RSU vesting triggers immediate tax liability on full FMV",
        "ISO exercises may create AMT exposure requiring additional reserves"
      ]
    },
    grantMix: {
      distribution: typeDistribution,
      summary: "Grant mix diversification helps optimize tax treatment across different equity compensation types.",
      keyPoints: [
        "ISOs offer potential LTCG treatment with qualifying dispositions",
        "RSUs provide certainty but full ordinary income taxation",
        "Strategic exercise timing can optimize overall tax efficiency"
      ]
    },
    upcomingVests: {
      count: upcomingVestsCount,
      summary: upcomingVestsCount > 0
        ? `${upcomingVestsCount} vesting events scheduled. Review each for tax planning and liquidity preparation.`
        : "No upcoming vesting events currently scheduled.",
      keyPoints: [
        "Vesting date FMV determines tax liability regardless of future price",
        "Company withholding may be insufficient for higher earners",
        "Coordinate vest timing with other income for bracket optimization"
      ]
    }
  }
}
