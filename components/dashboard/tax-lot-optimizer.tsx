"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/calculations"
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  Info,
  Calendar,
  Layers,
} from "lucide-react"

interface TaxLot {
  id: string
  grantType: "RSU" | "NSO" | "ISO" | "ESPP"
  symbol: string
  shares: number
  acquisitionDate: string
  costBasis: number
  currentPrice: number
  holdingPeriodDays: number
  isLongTerm: boolean
  unrealizedGain: number
  unrealizedGainPercent: number
  estimatedTaxIfSoldNow: number
  estimatedTaxIfHeld: number
  taxSavingsIfHeld: number
  qualifiesForLTCG: boolean
  daysUntilLTCG: number
  recommendation: "sell-now" | "hold" | "hold-for-ltcg" | "harvest-loss"
  priority: number
}

interface Grant {
  id: string
  type: "RSU" | "NSO" | "ISO" | "ESPP"
  symbol?: string
  shares: number
  strike: number | null
  vestDate: string
  fmvAtVest?: number | null
  costBasisPerShare?: number
}

interface TaxLotOptimizerProps {
  currentPrice?: number
  ordinaryRate?: number
  ltcgRate?: number
  stateRate?: number
  grants?: Grant[]
}

// Generate tax lots from actual grant data
function generateLotsFromGrants(
  grants: Grant[],
  currentPrice: number,
  ordinaryRate: number,
  ltcgRate: number,
  stateRate: number
): TaxLot[] {
  const today = new Date()
  const combinedOrdinary = ordinaryRate + stateRate
  const combinedLTCG = ltcgRate + stateRate

  return grants.map((grant) => {
    const acqDate = new Date(grant.vestDate)
    const holdingPeriodDays = Math.floor((today.getTime() - acqDate.getTime()) / (1000 * 60 * 60 * 24))
    const isLongTerm = holdingPeriodDays >= 365
    const daysUntilLTCG = isLongTerm ? 0 : Math.max(0, 365 - holdingPeriodDays)

    // Cost basis: use costBasisPerShare if available, otherwise fmvAtVest, otherwise strike for options
    const costBasis = grant.costBasisPerShare ?? grant.fmvAtVest ?? grant.strike ?? currentPrice
    const totalCost = grant.shares * costBasis
    const currentValue = grant.shares * currentPrice
    const unrealizedGain = currentValue - totalCost
    const unrealizedGainPercent = totalCost > 0 ? (unrealizedGain / totalCost) * 100 : 0

    // Calculate taxes
    let estimatedTaxIfSoldNow: number
    let estimatedTaxIfHeld: number

    if (grant.type === "ISO") {
      // ISOs: No regular tax on exercise, but AMT adjustment; LTCG if qualified
      estimatedTaxIfSoldNow = isLongTerm 
        ? Math.max(0, unrealizedGain) * combinedLTCG 
        : Math.max(0, unrealizedGain) * combinedOrdinary
      estimatedTaxIfHeld = Math.max(0, unrealizedGain) * combinedLTCG
    } else {
      // RSU/NSO/ESPP: Ordinary on vest/exercise, LTCG on subsequent appreciation
      estimatedTaxIfSoldNow = isLongTerm 
        ? Math.max(0, unrealizedGain) * combinedLTCG 
        : Math.max(0, unrealizedGain) * combinedOrdinary
      estimatedTaxIfHeld = Math.max(0, unrealizedGain) * combinedLTCG
    }

    const taxSavingsIfHeld = estimatedTaxIfSoldNow - estimatedTaxIfHeld

    // Determine recommendation
    let recommendation: TaxLot["recommendation"]
    let priority: number

    if (unrealizedGain < 0) {
      recommendation = "harvest-loss"
      priority = 1 // Highest priority - capture loss
    } else if (isLongTerm) {
      if (unrealizedGainPercent > 50) {
        recommendation = "sell-now" // Take profits on big winners
        priority = 2
      } else {
        recommendation = "hold" // Already LTCG, keep holding
        priority = 4
      }
    } else if (daysUntilLTCG <= 90) {
      recommendation = "hold-for-ltcg"
      priority = 2 // Close to LTCG, worth waiting
    } else if (taxSavingsIfHeld > 5000) {
      recommendation = "hold-for-ltcg"
      priority = 3
    } else {
      recommendation = "sell-now"
      priority = 3
    }

    return {
      id: grant.id,
      grantType: grant.type,
      symbol: grant.symbol || "TECH",
      shares: grant.shares,
      acquisitionDate: grant.vestDate,
      costBasis,
      currentPrice,
      holdingPeriodDays,
      isLongTerm,
      unrealizedGain,
      unrealizedGainPercent,
      estimatedTaxIfSoldNow,
      estimatedTaxIfHeld,
      taxSavingsIfHeld,
      qualifiesForLTCG: isLongTerm,
      daysUntilLTCG,
      recommendation,
      priority,
    }
  }).sort((a, b) => a.priority - b.priority)
}

export function TaxLotOptimizer({
  currentPrice = 55,
  ordinaryRate = 0.32,
  ltcgRate = 0.15,
  stateRate = 0.05,
  grants = [],
}: TaxLotOptimizerProps) {
  const [timeHorizon, setTimeHorizon] = useState<"current" | "1year" | "3year" | "5year">("current")
  const [sortBy, setSortBy] = useState<"priority" | "gain" | "tax-savings">("priority")

  // Generate lots from actual grant data
  const lots = useMemo(() => {
    if (grants.length === 0) {
      return []
    }
    return generateLotsFromGrants(grants, currentPrice, ordinaryRate, ltcgRate, stateRate)
  }, [grants, currentPrice, ordinaryRate, ltcgRate, stateRate])

  // Filter and analyze lots based on time horizon
  const analysis = useMemo(() => {
    const sortedLots = [...lots].sort((a, b) => {
      if (sortBy === "priority") return a.priority - b.priority
      if (sortBy === "gain") return b.unrealizedGain - a.unrealizedGain
      if (sortBy === "tax-savings") return b.taxSavingsIfHeld - a.taxSavingsIfHeld
      return 0
    })

    // Recommendations based on time horizon
    const horizonDays = {
      current: 0,
      "1year": 365,
      "3year": 365 * 3,
      "5year": 365 * 5,
    }[timeHorizon]

    const lotsWithHorizon = sortedLots.map((lot) => {
      const willBeLongTerm = lot.holdingPeriodDays + horizonDays >= 365
      const effectiveTaxRate = willBeLongTerm ? ltcgRate + stateRate : ordinaryRate + stateRate
      const futureGain = lot.unrealizedGain * (1 + 0.08 * (horizonDays / 365)) // Assume 8% annual growth
      const futureTax = Math.max(0, futureGain) * effectiveTaxRate

      return {
        ...lot,
        futureGain,
        futureTax,
        willBeLongTerm,
        horizonRecommendation: !lot.isLongTerm && willBeLongTerm 
          ? "wait-for-ltcg" 
          : lot.unrealizedGain < 0 
            ? "harvest-now" 
            : lot.isLongTerm && lot.unrealizedGainPercent > 100 
              ? "consider-taking-profits"
              : "hold",
      }
    })

    // Summary stats
    const totalGain = lots.reduce((sum, l) => sum + l.unrealizedGain, 0)
    const totalTaxIfSoldNow = lots.reduce((sum, l) => sum + l.estimatedTaxIfSoldNow, 0)
    const totalTaxIfHeld = lots.reduce((sum, l) => sum + l.estimatedTaxIfHeld, 0)
    const potentialSavings = totalTaxIfSoldNow - totalTaxIfHeld
    const lotsQualifyingLTCG = lots.filter((l) => l.isLongTerm).length
    const lotsNearLTCG = lots.filter((l) => !l.isLongTerm && l.daysUntilLTCG <= 90).length
    const lossLots = lots.filter((l) => l.unrealizedGain < 0)
    const harvestablelosses = lossLots.reduce((sum, l) => sum + Math.abs(l.unrealizedGain), 0)

    return {
      lots: lotsWithHorizon,
      totalGain,
      totalTaxIfSoldNow,
      totalTaxIfHeld,
      potentialSavings,
      lotsQualifyingLTCG,
      lotsNearLTCG,
      lossLots: lossLots.length,
      harvestableLosses: harvestablelosses,
    }
  }, [lots, timeHorizon, sortBy, ltcgRate, ordinaryRate, stateRate])

  const recommendationLabels: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
    "sell-now": { label: "Sell Now", color: "bg-orange-100 text-orange-700 border-orange-200", icon: ArrowUpRight },
    "hold": { label: "Hold", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock },
    "hold-for-ltcg": { label: "Hold for LTCG", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: Target },
    "harvest-loss": { label: "Harvest Loss", color: "bg-purple-100 text-purple-700 border-purple-200", icon: TrendingDown },
  }

  const horizonLabels = {
    current: "Current Year",
    "1year": "1-Year Horizon",
    "3year": "3-Year Horizon",
    "5year": "5-Year Horizon",
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tax-Efficient Lot Selection
              </p>
              <CardTitle className="font-serif text-xl">
                Lot-by-Lot Analysis
              </CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Time Horizon</Label>
              <Select value={timeHorizon} onValueChange={(v) => setTimeHorizon(v as typeof timeHorizon)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Year</SelectItem>
                  <SelectItem value="1year">1-Year</SelectItem>
                  <SelectItem value="3year">3-Year</SelectItem>
                  <SelectItem value="5year">5-Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Sort By</Label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="gain">Gain Amount</SelectItem>
                  <SelectItem value="tax-savings">Tax Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {lots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Layers className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No Tax Lots Available</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Add grants in the Grant Planner tab to view lot-by-lot tax analysis and optimization recommendations.
            </p>
          </div>
        ) : (
        <>
        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Total Unrealized</span>
            </div>
            <p className={cn(
              "mt-2 font-mono text-2xl font-bold",
              analysis.totalGain >= 0 ? "text-emerald-700" : "text-red-600"
            )}>
              {formatCurrency(analysis.totalGain)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Across {lots.length} tax lots
            </p>
          </div>

          <div className="rounded-lg border bg-gradient-to-br from-orange-50 to-orange-100/50 p-4">
            <div className="flex items-center gap-2 text-orange-600">
              <Calculator className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Tax if Sold Now</span>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-orange-700">
              {formatCurrency(analysis.totalTaxIfSoldNow)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              At current rates
            </p>
          </div>

          <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100/50 p-4">
            <div className="flex items-center gap-2 text-blue-600">
              <Target className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Potential Savings</span>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-blue-700">
              {formatCurrency(analysis.potentialSavings)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              If held to LTCG
            </p>
          </div>

          <div className="rounded-lg border bg-gradient-to-br from-purple-50 to-purple-100/50 p-4">
            <div className="flex items-center gap-2 text-purple-600">
              <TrendingDown className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Loss Harvesting</span>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-purple-700">
              {formatCurrency(analysis.harvestableLosses)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {analysis.lossLots} lot{analysis.lossLots !== 1 ? "s" : ""} with losses
            </p>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            {analysis.lotsQualifyingLTCG} lots qualify for LTCG
          </Badge>
          {analysis.lotsNearLTCG > 0 && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <Clock className="mr-1 h-3 w-3" />
              {analysis.lotsNearLTCG} lot{analysis.lotsNearLTCG !== 1 ? "s" : ""} within 90 days of LTCG
            </Badge>
          )}
          {analysis.lossLots > 0 && (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              <AlertCircle className="mr-1 h-3 w-3" />
              {analysis.lossLots} lot{analysis.lossLots !== 1 ? "s" : ""} available for loss harvesting
            </Badge>
          )}
        </div>

        {/* Lot Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Lot Details</TableHead>
                <TableHead className="font-semibold">Symbol</TableHead>
                <TableHead className="text-right font-semibold">Shares</TableHead>
                <TableHead className="text-right font-semibold">Cost Basis</TableHead>
                <TableHead className="text-right font-semibold">Unrealized Gain</TableHead>
                <TableHead className="text-center font-semibold">Holding Period</TableHead>
                <TableHead className="text-right font-semibold">Tax if Sold</TableHead>
                <TableHead className="text-right font-semibold">Tax Savings</TableHead>
                <TableHead className="text-center font-semibold">Recommendation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysis.lots.map((lot, index) => {
                const rec = recommendationLabels[lot.recommendation]
                const RecIcon = rec.icon

                return (
                  <TableRow 
                    key={lot.id} 
                    className={cn(
                      index % 2 === 0 ? "bg-background" : "bg-muted/10",
                      lot.recommendation === "harvest-loss" && "bg-purple-50/50",
                      lot.recommendation === "hold-for-ltcg" && lot.daysUntilLTCG <= 90 && "bg-amber-50/50"
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {lot.grantType}
                        </Badge>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            Acquired {new Date(lot.acquisitionDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            @ ${lot.costBasis.toFixed(2)}/share
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-medium text-muted-foreground">
                      {lot.symbol}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {lot.shares.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(lot.shares * lot.costBasis)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={cn(
                        "flex items-center justify-end gap-1 font-mono font-semibold",
                        lot.unrealizedGain >= 0 ? "text-emerald-600" : "text-red-600"
                      )}>
                        {lot.unrealizedGain >= 0 ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {formatCurrency(Math.abs(lot.unrealizedGain))}
                      </div>
                      <span className={cn(
                        "text-xs",
                        lot.unrealizedGain >= 0 ? "text-emerald-600" : "text-red-600"
                      )}>
                        {lot.unrealizedGainPercent >= 0 ? "+" : ""}{lot.unrealizedGainPercent.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs",
                                  lot.isLongTerm 
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                )}
                              >
                                {lot.isLongTerm ? "LTCG" : "STCG"}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{lot.holdingPeriodDays} days held</p>
                              {!lot.isLongTerm && (
                                <p className="text-amber-200">{lot.daysUntilLTCG} days until LTCG</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {!lot.isLongTerm && (
                          <div className="w-16">
                            <Progress 
                              value={(lot.holdingPeriodDays / 365) * 100} 
                              className="h-1.5"
                            />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-600">
                      {formatCurrency(lot.estimatedTaxIfSoldNow)}
                    </TableCell>
                    <TableCell className="text-right">
                      {lot.taxSavingsIfHeld > 0 ? (
                        <span className="font-mono font-semibold text-emerald-600">
                          {formatCurrency(lot.taxSavingsIfHeld)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn("text-xs", rec.color)}>
                        <RecIcon className="mr-1 h-3 w-3" />
                        {rec.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Strategy Summary */}
        <div className="rounded-lg border bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Info className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground">
                {horizonLabels[timeHorizon]} Strategy Summary
              </h4>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {timeHorizon === "current" ? (
                  <>
                    For current year tax optimization, consider <strong>harvesting {analysis.lossLots} loss lot{analysis.lossLots !== 1 ? "s" : ""}</strong> to offset {formatCurrency(analysis.harvestableLosses)} in gains. 
                    {analysis.lotsNearLTCG > 0 && (
                      <> Hold {analysis.lotsNearLTCG} lot{analysis.lotsNearLTCG !== 1 ? "s" : ""} that are within 90 days of LTCG qualification.</>
                    )}
                  </>
                ) : timeHorizon === "1year" ? (
                  <>
                    Over a 1-year horizon, {lots.filter(l => !l.isLongTerm).length} lots will convert to LTCG status, 
                    potentially saving {formatCurrency(analysis.potentialSavings)} in taxes compared to selling today.
                  </>
                ) : (
                  <>
                    Over a {timeHorizon === "3year" ? "3" : "5"}-year horizon, all lots will qualify for LTCG treatment. 
                    Consider staged selling to manage concentration risk while maintaining tax efficiency.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs leading-relaxed text-muted-foreground">
          Tax lot analysis is for planning purposes only. Actual tax treatment depends on specific grant terms, 
          AMT considerations, wash sale rules, and other factors. Consult a tax professional before making decisions.
        </p>
        </>
        )}
      </CardContent>
    </Card>
  )
}
