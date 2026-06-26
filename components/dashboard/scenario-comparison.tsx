"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  type ScenarioInputs,
  calculateScenarios,
  formatCurrency,
} from "@/lib/calculations"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { TrendingUp, Clock, Scale, Zap, ArrowRight, Check, CheckCircle2, CircleDot, Calendar, DollarSign, AlertTriangle, Target } from "lucide-react"

// Custom tooltip component for the bar chart
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; fill: string }>
  label?: string
}) => {
  if (!active || !payload || payload.length === 0) return null

  const taxValue = payload.find((p) => p.name === "Tax")?.value || 0
  const afterTaxValue = payload.find((p) => p.name === "After-Tax")?.value || 0
  const total = taxValue + afterTaxValue
  const taxPercent = total > 0 ? ((taxValue / total) * 100).toFixed(1) : "0"
  
  const scenarioColors: Record<string, { bg: string; border: string; accent: string }> = {
    "Sell Now": { bg: "bg-orange-50", border: "border-orange-200", accent: "text-orange-600" },
    "Hold 12+": { bg: "bg-emerald-50", border: "border-emerald-200", accent: "text-emerald-600" },
    "Staged": { bg: "bg-blue-50", border: "border-blue-200", accent: "text-blue-600" },
  }
  
  const colors = scenarioColors[label || ""] || scenarioColors["Sell Now"]

  return (
    <div className={cn(
      "rounded-xl border-2 p-4 shadow-xl",
      colors.bg,
      colors.border
    )}>
      <div className="flex items-center gap-2 border-b border-current/10 pb-2">
        <div className={cn("text-sm font-bold", colors.accent)}>{label}</div>
      </div>
      
      <div className="mt-3 space-y-2.5">
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-muted-foreground">Estimated Tax</span>
          <span className="font-mono text-sm font-semibold text-red-600">
            {formatCurrency(taxValue)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-muted-foreground">After-Tax Value</span>
          <span className="font-mono text-sm font-semibold text-emerald-700">
            {formatCurrency(afterTaxValue)}
          </span>
        </div>
        <div className="border-t border-current/10 pt-2">
          <div className="flex items-center justify-between gap-6">
            <span className="text-xs font-medium text-muted-foreground">Effective Tax Rate</span>
            <span className={cn("font-mono text-sm font-bold", colors.accent)}>
              {taxPercent}%
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <ArrowRight className="h-3 w-3" />
        <span>See card above for full breakdown</span>
      </div>
    </div>
  )
}

interface Grant {
  id: string
  type: "RSU" | "NSO" | "ISO" | "ESPP"
  symbol?: string
  shares: number
  strike: number | null
  vestDate: string
  fmvAtVest?: number | null
}

interface ScenarioComparisonProps {
  inputs: ScenarioInputs
  onChange: (inputs: ScenarioInputs) => void
  preferredStrategy?: string | null
  onPreferredStrategyChange?: (strategyId: string | null) => void
  hasGrants?: boolean
  grants?: Grant[]
  currentPrice?: number
}

export function ScenarioComparison({ 
  inputs, 
  onChange,
  preferredStrategy,
  onPreferredStrategyChange,
  hasGrants = true,
  grants = [],
  currentPrice = 55,
}: ScenarioComparisonProps) {
  const scenarios = calculateScenarios(inputs)
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)

  // Update inputs from grants when grants change
  React.useEffect(() => {
    if (grants.length > 0) {
      // Calculate totals from grants
      const totalShares = grants.reduce((sum, g) => sum + g.shares, 0)
      const avgStrike = grants.reduce((sum, g) => sum + (g.strike || 0) * g.shares, 0) / totalShares || 0
      
      // Only update if values are different to avoid infinite loops
      if (inputs.shares !== totalShares || inputs.currentFMV !== currentPrice) {
        onChange({
          ...inputs,
          shares: totalShares,
          strike: avgStrike,
          currentFMV: currentPrice,
          projectedFMV: currentPrice * 1.15, // 15% projected growth
        })
      }
    }
  }, [grants, currentPrice]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (key: keyof ScenarioInputs, value: string) => {
    onChange({
      ...inputs,
      [key]: parseFloat(value) || 0,
    })
  }

  const scenarioCards = [
    {
      id: "sellNow",
      icon: Zap,
      label: "Liquidity First",
      title: "Sell Now",
      description:
        "Immediate liquidity, no upside/downside exposure. Best for risk-averse clients or those with near-term cash needs.",
      data: scenarios.sellNow,
      variant: "orange" as const,
      recommended: false,
      breakdown: {
        taxType: "Ordinary Income",
        holdingPeriod: "Immediate",
        riskLevel: "Low",
        liquidityTiming: "Immediate",
      },
      actionPlan: [
        { step: 1, action: "Verify grant is fully vested and exercisable", timing: "Day 1" },
        { step: 2, action: "Confirm no blackout period restrictions", timing: "Day 1" },
        { step: 3, action: "Submit exercise and same-day sale order", timing: "Day 1-2" },
        { step: 4, action: "Set aside estimated tax withholding", timing: "Day 2-3" },
        { step: 5, action: "Proceeds deposited to brokerage account", timing: "T+2" },
        { step: 6, action: "Review Form 1099-B for tax reporting", timing: "Year-end" },
      ],
      considerations: [
        "Taxed as ordinary income at your marginal rate",
        "No market risk exposure after sale",
        "Immediate diversification from company stock",
        "May trigger AMT if exercising ISOs",
      ],
    },
    {
      id: "hold",
      icon: TrendingUp,
      label: "Highest Potential",
      title: "Hold 12+ Months",
      description:
        "More upside potential with LTCG treatment. Higher concentration and market risk. Best for bullish outlook.",
      data: scenarios.hold,
      variant: "emerald" as const,
      recommended: true,
      breakdown: {
        taxType: "Long-Term Capital Gains",
        holdingPeriod: "12+ months",
        riskLevel: "Higher",
        liquidityTiming: "Deferred",
      },
      actionPlan: [
        { step: 1, action: "Exercise options (cash or cashless)", timing: "Day 1" },
        { step: 2, action: "Start 12-month LTCG holding period", timing: "Exercise date" },
        { step: 3, action: "Set calendar reminder for LTCG eligibility", timing: "Day 1" },
        { step: 4, action: "Monitor concentration and set stop-loss alerts", timing: "Ongoing" },
        { step: 5, action: "Evaluate market conditions at 12-month mark", timing: "Month 12" },
        { step: 6, action: "Sell shares at LTCG rates after holding period", timing: "Month 12+" },
      ],
      considerations: [
        "Potentially lower tax rate (15-20% LTCG vs 37% ordinary)",
        "Exposed to stock price movement during holding period",
        "Increases portfolio concentration risk",
        "ISOs: Must hold 2 years from grant + 1 year from exercise",
      ],
    },
    {
      id: "staged",
      icon: Scale,
      label: "Balanced Approach",
      title: "Staged Sale",
      description:
        "Balances liquidity, risk, and potential capital gains treatment. Systematic diversification over time.",
      data: scenarios.staged,
      variant: "blue" as const,
      recommended: false,
      breakdown: {
        taxType: "Blended (Ordinary + LTCG)",
        holdingPeriod: "Mixed",
        riskLevel: "Moderate",
        liquidityTiming: "Phased",
      },
      actionPlan: [
        { step: 1, action: "Determine optimal split ratio (e.g., 50/50)", timing: "Planning" },
        { step: 2, action: "Exercise and sell first tranche immediately", timing: "Day 1" },
        { step: 3, action: "Exercise and hold second tranche", timing: "Day 1" },
        { step: 4, action: "Set reminders for LTCG eligibility on held shares", timing: "Day 1" },
        { step: 5, action: "Review and rebalance quarterly", timing: "Ongoing" },
        { step: 6, action: "Sell remaining shares at LTCG rates", timing: "Month 12+" },
      ],
      considerations: [
        "Balances immediate liquidity with tax optimization",
        "Reduces single-point-in-time market risk",
        "Partial diversification while maintaining upside",
        "More complex to track and manage",
      ],
    },
  ]

  const openScenarioId = scenarioCards.find(s => s.id === selectedScenario)
  const openScenario = openScenarioId || null

  const chartData = [
    {
      name: "Sell Now",
      Tax: scenarios.sellNow.tax,
      "After-Tax": scenarios.sellNow.afterTax,
    },
    {
      name: "Hold 12+",
      Tax: scenarios.hold.tax,
      "After-Tax": scenarios.hold.afterTax,
    },
    {
      name: "Staged",
      Tax: scenarios.staged.tax,
      "After-Tax": scenarios.staged.afterTax,
    },
  ]

  const variantClasses = {
    orange: {
      border: "border-orange-200",
      bg: "bg-orange-50/50",
      text: "text-orange-600",
      icon: "bg-orange-100 text-orange-600",
    },
    emerald: {
      border: "border-emerald-200",
      bg: "bg-emerald-50/50",
      text: "text-emerald-600",
      icon: "bg-emerald-100 text-emerald-600",
    },
    blue: {
      border: "border-blue-200",
      bg: "bg-blue-50/50",
      text: "text-blue-600",
      icon: "bg-blue-100 text-blue-600",
},
  }

  if (!hasGrants) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Scale className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No Strategy Data Available</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Add grants in the Grant Planner tab to view exercise strategy comparisons and recommendations.
          </p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
    <CardHeader className="pb-4">
    <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Advisor Modeling
            </p>
            <CardTitle className="font-serif text-xl">
              Exercise Strategy Comparison
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Grid */}
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-2">
              <Label htmlFor="shares" className="text-sm font-medium">
                Shares
              </Label>
              <Input
                id="shares"
                type="number"
                value={inputs.shares}
                onChange={(e) => handleChange("shares", e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="strike" className="text-sm font-medium">
                Strike Price
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  id="strike"
                  type="number"
                  value={inputs.strike}
                  onChange={(e) => handleChange("strike", e.target.value)}
                  className="pl-7 font-mono"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentFMV" className="text-sm font-medium">
                Current FMV
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  id="currentFMV"
                  type="number"
                  value={inputs.currentFMV}
                  onChange={(e) => handleChange("currentFMV", e.target.value)}
                  className="pl-7 font-mono"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectedFMV" className="text-sm font-medium">
                Projected FMV (12mo)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  id="projectedFMV"
                  type="number"
                  value={inputs.projectedFMV}
                  onChange={(e) => handleChange("projectedFMV", e.target.value)}
                  className="pl-7 font-mono"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ordinaryRate" className="text-sm font-medium">
                Ordinary + State
              </Label>
              <div className="relative">
                <Input
                  id="ordinaryRate"
                  type="number"
                  step="0.01"
                  value={inputs.ordinaryRate}
                  onChange={(e) => handleChange("ordinaryRate", e.target.value)}
                  className="pr-8 font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ltcgRate" className="text-sm font-medium">
                LTCG + State
              </Label>
              <div className="relative">
                <Input
                  id="ltcgRate"
                  type="number"
                  step="0.01"
                  value={inputs.ltcgRate}
                  onChange={(e) => handleChange("ltcgRate", e.target.value)}
                  className="pr-8 font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scenario Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {scenarioCards.map((scenario) => {
            const Icon = scenario.icon
            const classes = variantClasses[scenario.variant]

            const isPreferred = preferredStrategy === scenario.id

              return (
              <div
                key={scenario.id}
                onClick={() => setSelectedScenario(scenario.id)}
                className={cn(
                  "relative cursor-pointer rounded-xl border-2 p-5 transition-all hover:shadow-lg",
                  classes.border,
                  classes.bg,
                  scenario.recommended && "ring-2 ring-emerald-300 ring-offset-2",
                  isPreferred && "ring-2 ring-primary ring-offset-2"
                )}
              >
                {isPreferred && (
                  <Badge className="absolute -top-2.5 left-4 bg-primary text-primary-foreground">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Selected Strategy
                  </Badge>
                )}
                {scenario.recommended && !isPreferred && (
                  <Badge className="absolute -top-2.5 left-4 bg-emerald-600 text-white">
                    Recommended
                  </Badge>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <p
                      className={cn(
                        "text-xs font-bold uppercase tracking-wider",
                        classes.text
                      )}
                    >
                      {scenario.label}
                    </p>
                    <h3 className="mt-1 font-serif text-lg font-semibold text-foreground">
                      {scenario.title}
                    </h3>
                  </div>
                  <div className={cn("rounded-lg p-2", classes.icon)}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {scenario.description}
                </p>

                <div className="mt-4 space-y-2 border-t pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Tax</span>
                    <span className="font-mono font-semibold text-red-600">
                      {formatCurrency(scenario.data.tax)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cash Needed</span>
                    <span className="font-mono font-semibold">
                      {formatCurrency(scenario.data.cash)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">After-Tax</span>
                    <span className="font-mono font-semibold text-emerald-700">
                      {formatCurrency(scenario.data.afterTax)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Chart */}
        <div className="rounded-lg border bg-card p-4">
          <h4 className="mb-4 text-sm font-semibold text-foreground">
            Scenario Comparison
          </h4>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={8}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                />
                <Bar dataKey="Tax" radius={[4, 4, 0, 0]} name="Tax">
                  {chartData.map((_, index) => (
                    <Cell
                      key={`tax-${index}`}
                      fill={
                        index === 0
                          ? "#f97316"
                          : index === 1
                          ? "#10b981"
                          : "#3b82f6"
                      }
                      opacity={0.3}
                    />
                  ))}
                </Bar>
                <Bar dataKey="After-Tax" radius={[4, 4, 0, 0]} name="After-Tax">
                  {chartData.map((_, index) => (
                    <Cell
                      key={`after-${index}`}
                      fill={
                        index === 0
                          ? "#f97316"
                          : index === 1
                          ? "#10b981"
                          : "#3b82f6"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs leading-relaxed text-muted-foreground">
          This simplified model is intended for planning conversations, not final
          tax advice. Actual results vary by grant type, AMT, company plan rules,
          concentration risk, and timing.
        </p>

        {/* Scenario Detail Dialog */}
        <Dialog open={!!selectedScenario} onOpenChange={(open) => !open && setSelectedScenario(null)}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            {openScenario && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "rounded-lg p-2.5",
                      variantClasses[openScenario.variant].icon
                    )}>
                      <openScenario.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="font-serif text-xl">{openScenario.title}</DialogTitle>
                      <DialogDescription className="text-sm">
                        {openScenario.label} Strategy
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="mt-4 space-y-6">
                  {/* Quick Summary */}
                  <div className={cn(
                    "rounded-xl border-2 p-4",
                    variantClasses[openScenario.variant].border,
                    variantClasses[openScenario.variant].bg
                  )}>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Tax Type</p>
                        <p className="mt-1 text-sm font-semibold">{openScenario.breakdown.taxType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Holding Period</p>
                        <p className="mt-1 text-sm font-semibold">{openScenario.breakdown.holdingPeriod}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Risk Level</p>
                        <p className="mt-1 text-sm font-semibold">{openScenario.breakdown.riskLevel}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Liquidity</p>
                        <p className="mt-1 text-sm font-semibold">{openScenario.breakdown.liquidityTiming}</p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Financial Summary
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg bg-white p-3 shadow-sm">
                        <p className="text-xs text-muted-foreground">Estimated Tax</p>
                        <p className="mt-1 font-mono text-lg font-bold text-red-600">
                          {formatCurrency(openScenario.data.tax)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white p-3 shadow-sm">
                        <p className="text-xs text-muted-foreground">Cash Required</p>
                        <p className="mt-1 font-mono text-lg font-bold">
                          {formatCurrency(openScenario.data.cash)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white p-3 shadow-sm">
                        <p className="text-xs text-muted-foreground">After-Tax Value</p>
                        <p className="mt-1 font-mono text-lg font-bold text-emerald-700">
                          {formatCurrency(openScenario.data.afterTax)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Plan */}
                  <div>
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <Target className="h-4 w-4 text-primary" />
                      Action Plan
                    </h4>
                    <div className="space-y-2">
                      {openScenario.actionPlan.map((item) => (
                        <div
                          key={item.step}
                          className="flex items-start gap-3 rounded-lg border bg-white p-3 shadow-sm"
                        >
                          <div className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                            variantClasses[openScenario.variant].icon.replace("bg-", "bg-").replace("-100", "-500")
                          )}>
                            {item.step}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{item.action}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              <Calendar className="mr-1 inline h-3 w-3" />
                              {item.timing}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Considerations */}
                  <div>
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Key Considerations
                    </h4>
                    <ul className="space-y-2">
                      {openScenario.considerations.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Select as Preferred Strategy */}
                  <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">Select as Preferred Strategy</p>
                      <p className="text-xs text-muted-foreground">
                        This will be highlighted in reports and exports
                      </p>
                    </div>
                    {preferredStrategy === openScenario.id ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          onPreferredStrategyChange?.(null)
                          setSelectedScenario(null)
                        }}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Selected - Click to Remove
                      </Button>
                    ) : (
                      <Button
                        className={cn(
                          openScenario.variant === "orange" && "bg-orange-600 hover:bg-orange-700",
                          openScenario.variant === "emerald" && "bg-emerald-600 hover:bg-emerald-700",
                          openScenario.variant === "blue" && "bg-blue-600 hover:bg-blue-700"
                        )}
                        onClick={() => {
                          onPreferredStrategyChange?.(openScenario.id)
                          setSelectedScenario(null)
                        }}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Select This Strategy
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
