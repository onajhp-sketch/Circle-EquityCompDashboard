"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertTriangle,
  Calendar,
  Clock,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Shield,
  Zap,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  ExternalLink,
  BookOpen,
  Info,
  Lightbulb,
  ArrowRight,
  Sparkles,
  Play,
  Pause,
} from "lucide-react"
import { type Grant, type TaxAssumptions, type Blackout, calculateGrant, formatCurrency } from "@/lib/calculations"
import { cn } from "@/lib/utils"

export type ActionStatus = "pending" | "in-progress" | "completed" | "dismissed"

export interface SuggestedAction {
  id: string
  type: "expiration" | "concentration" | "tax-optimization" | "liquidity" | "vest-reminder" | "blackout" | "diversification" | "ltcg-window"
  priority: "high" | "medium" | "low"
  title: string
  description: string
  impact?: string
  deadline?: string
  status: ActionStatus
  statusUpdatedAt?: string
  relatedGrantIds?: string[]
  educationalContent?: {
    explanation: string
    irsReference?: string
    keyPoints: string[]
    resources: { label: string; url: string }[]
  }
}

interface SuggestedActionsProps {
  grants: Grant[]
  taxAssumptions: TaxAssumptions
  blackouts: Blackout[]
  concentrationThreshold: number
  liquidityTarget: number
  actions: SuggestedAction[]
  onActionsChange: (actions: SuggestedAction[]) => void
}

const actionTypeConfig: Record<SuggestedAction["type"], { icon: typeof AlertTriangle; color: string; bgColor: string }> = {
  expiration: { icon: Clock, color: "text-red-600", bgColor: "bg-red-50" },
  concentration: { icon: TrendingDown, color: "text-amber-600", bgColor: "bg-amber-50" },
  "tax-optimization": { icon: DollarSign, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  liquidity: { icon: AlertTriangle, color: "text-orange-600", bgColor: "bg-orange-50" },
  "vest-reminder": { icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-50" },
  blackout: { icon: Shield, color: "text-purple-600", bgColor: "bg-purple-50" },
  diversification: { icon: TrendingUp, color: "text-cyan-600", bgColor: "bg-cyan-50" },
  "ltcg-window": { icon: Zap, color: "text-green-600", bgColor: "bg-green-50" },
}

const priorityConfig = {
  high: { label: "High Priority", color: "bg-red-100 text-red-700 border-red-200" },
  medium: { label: "Medium", color: "bg-amber-100 text-amber-700 border-amber-200" },
  low: { label: "Low", color: "bg-blue-100 text-blue-700 border-blue-200" },
}

const statusConfig = {
  pending: { label: "Pending Review", color: "bg-slate-100 text-slate-700", icon: Clock },
  "in-progress": { label: "In Progress", color: "bg-blue-100 text-blue-700", icon: Play },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  dismissed: { label: "Dismissed", color: "bg-slate-100 text-slate-500", icon: XCircle },
}

// Educational content for each action type
const educationalContentByType: Record<SuggestedAction["type"], SuggestedAction["educationalContent"]> = {
  expiration: {
    explanation: "Stock options have a limited lifespan. Unexercised options expire worthless after the expiration date, typically 10 years from grant for ISOs and NSOs. Planning exercise timing is critical to capturing value.",
    irsReference: "IRC Section 422(b)(3) - ISO expiration rules",
    keyPoints: [
      "ISO expiration typically 10 years from grant date",
      "Post-termination exercise window usually 90 days for ISOs",
      "NSOs may have longer post-termination periods",
      "Consider tax implications before exercising near expiration"
    ],
    resources: [
      { label: "IRS Stock Options Guide", url: "https://www.irs.gov/taxtopics/tc427" },
      { label: "SEC Employee Stock Plans", url: "https://www.sec.gov/fast-answers/answersempstockplanshtm.html" }
    ]
  },
  concentration: {
    explanation: "Holding a significant portion of your net worth in a single stock creates concentration risk. Market volatility, company-specific events, or industry downturns can significantly impact your wealth.",
    irsReference: "SEC Rule 10b5-1 - Planned trading",
    keyPoints: [
      "General guideline: limit single-stock exposure to 10-25% of portfolio",
      "Consider systematic diversification through 10b5-1 plans",
      "Tax-loss harvesting can offset gains from diversification sales",
      "Hedging strategies available for highly concentrated positions"
    ],
    resources: [
      { label: "FINRA Concentration Risk", url: "https://www.finra.org/investors/alerts/concentrated-stock-positions" },
      { label: "SEC 10b5-1 Plans", url: "https://www.sec.gov/rules/final/2022/33-11138.pdf" }
    ]
  },
  "tax-optimization": {
    explanation: "Strategic timing of equity compensation exercises can significantly reduce your tax burden. Understanding the interplay between ordinary income, AMT, and capital gains is essential for tax efficiency.",
    irsReference: "IRC Sections 421-424 (ISOs), 83 (RSUs/NSOs)",
    keyPoints: [
      "ISOs: Exercise and hold for LTCG treatment (1 year holding + 2 years from grant)",
      "NSOs: Spread taxed as ordinary income at exercise",
      "Consider bunching exercises in lower income years",
      "State tax nexus matters - some states tax equity differently"
    ],
    resources: [
      { label: "IRS Publication 525", url: "https://www.irs.gov/publications/p525" },
      { label: "Form 3921 (ISO Exercises)", url: "https://www.irs.gov/forms-pubs/about-form-3921" }
    ]
  },
  liquidity: {
    explanation: "Exercising stock options and covering associated taxes requires available cash. Without adequate liquidity, you may be forced into cashless exercises or same-day sales that limit your ability to hold for favorable tax treatment.",
    keyPoints: [
      "Calculate total cash needed: exercise cost + estimated taxes",
      "Consider building cash reserves 6-12 months before planned exercise",
      "Cashless exercise eliminates cash need but triggers immediate taxation",
      "Net share settlement uses shares to cover costs"
    ],
    resources: [
      { label: "Cashless Exercise Guide", url: "https://www.investopedia.com/terms/c/cashlessexercise.asp" },
      { label: "FINRA Margin Rules", url: "https://www.finra.org/rules-guidance/key-topics/margin-accounts" }
    ]
  },
  "vest-reminder": {
    explanation: "Vesting events trigger important decisions and potential tax consequences. RSU vesting creates immediate taxable income, while option vesting opens an exercise window that requires strategic planning.",
    irsReference: "IRC Section 83 - Property transferred for services",
    keyPoints: [
      "RSU vest = taxable event (ordinary income on FMV)",
      "Option vest = no tax event, but starts exercise window",
      "Employer typically withholds taxes on RSU vesting",
      "Review and update tax withholding elections before major vests"
    ],
    resources: [
      { label: "IRS Section 83 Guidance", url: "https://www.irs.gov/pub/irs-drop/rr-98-21.pdf" },
      { label: "W-4 Withholding Estimator", url: "https://www.irs.gov/individuals/tax-withholding-estimator" }
    ]
  },
  blackout: {
    explanation: "Trading blackout periods restrict when you can buy or sell company stock. These are typically implemented around earnings announcements and material non-public information periods to prevent insider trading violations.",
    irsReference: "SEC Rule 10b-5, Sarbanes-Oxley Section 306",
    keyPoints: [
      "Blackouts typically occur quarterly around earnings",
      "Plan exercises and sales outside blackout windows",
      "10b5-1 plans allow pre-scheduled trades during blackouts",
      "Violations can result in SEC penalties and termination"
    ],
    resources: [
      { label: "SEC Insider Trading Rules", url: "https://www.sec.gov/fast-answers/answersinsiderhtm.html" },
      { label: "Sarbanes-Oxley Section 306", url: "https://www.sec.gov/spotlight/sarbanes-oxley.htm" }
    ]
  },
  diversification: {
    explanation: "A diversified portfolio spreads risk across multiple asset classes, sectors, and geographies. For employees with significant equity compensation, creating a diversification plan is essential for long-term financial security.",
    keyPoints: [
      "Diversification reduces portfolio volatility without sacrificing expected returns",
      "Consider gradual diversification to spread tax impact",
      "Rebalance periodically as new grants vest",
      "Factor in other retirement accounts when assessing total portfolio"
    ],
    resources: [
      { label: "SEC Asset Allocation", url: "https://www.sec.gov/investor/pubs/assetallocation.htm" },
      { label: "FINRA Diversification", url: "https://www.finra.org/investors/insights/asset-allocation-diversification" }
    ]
  },
  "ltcg-window": {
    explanation: "Holding exercised ISOs for the required period (1 year from exercise AND 2 years from grant) qualifies gains for long-term capital gains treatment, which is typically taxed at lower rates than ordinary income.",
    irsReference: "IRC Section 422 - Incentive stock options",
    keyPoints: [
      "Qualifying disposition: Hold 1+ year from exercise AND 2+ years from grant",
      "Disqualifying disposition: Ordinary income treatment on spread at exercise",
      "LTCG rates: 0%, 15%, or 20% depending on income",
      "Watch for AMT preference items on ISO exercises"
    ],
    resources: [
      { label: "ISO Tax Treatment", url: "https://www.irs.gov/taxtopics/tc427" },
      { label: "Capital Gains Rates", url: "https://www.irs.gov/taxtopics/tc409" }
    ]
  },
}

function generateActions(
  grants: Grant[],
  taxAssumptions: TaxAssumptions,
  blackouts: Blackout[],
  concentrationThreshold: number,
  liquidityTarget: number,
  existingActions: SuggestedAction[]
): SuggestedAction[] {
  const actions: SuggestedAction[] = []
  const today = new Date()
  const netWorth = 500000 // Default assumption
  
  // Calculate totals
  let totalValue = 0
  let totalCash = 0
  let totalTax = 0
  
  grants.forEach(grant => {
    const calc = calculateGrant(grant, taxAssumptions)
    totalValue += calc.afterTax
    totalCash += calc.cash
    totalTax += calc.tax
  })
  
  // Check for grants expiring within 180 days (NSO/ISO only)
  grants.filter(g => g.type === "NSO" || g.type === "ISO").forEach(grant => {
    const grantDate = new Date(grant.grantDate)
    const expirationDate = new Date(grantDate.setFullYear(grantDate.getFullYear() + 10))
    const daysUntilExpiration = Math.floor((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiration > 0 && daysUntilExpiration <= 180) {
      const calc = calculateGrant(grant, taxAssumptions)
      actions.push({
        id: `exp-${grant.id}`,
        type: "expiration",
        priority: daysUntilExpiration <= 30 ? "high" : daysUntilExpiration <= 90 ? "medium" : "low",
        title: `${grant.shares.toLocaleString()} ${grant.type}s expiring in ${daysUntilExpiration} days`,
        description: `Review exercise strategy for options expiring ${expirationDate.toLocaleDateString()}. Current spread value: ${formatCurrency(calc.afterTax)}.`,
        impact: formatCurrency(calc.afterTax),
        deadline: expirationDate.toISOString().split('T')[0],
        status: "pending",
        relatedGrantIds: [grant.id],
        educationalContent: educationalContentByType.expiration,
      })
    }
  })
  
  // Check concentration risk
  const concentrationPercent = netWorth > 0 ? totalValue / netWorth : 0
  if (concentrationPercent > concentrationThreshold && grants.length > 0) {
    actions.push({
      id: `conc-threshold-${Math.round(concentrationThreshold * 100)}`,
      type: "concentration",
      priority: concentrationPercent > 0.5 ? "high" : "medium",
      title: `Portfolio concentration at ${(concentrationPercent * 100).toFixed(1)}%`,
      description: `Single-stock exposure exceeds your ${(concentrationThreshold * 100).toFixed(0)}% risk threshold. Consider diversification strategies to reduce concentration risk.`,
      impact: `${((concentrationPercent - concentrationThreshold) * 100).toFixed(1)}% above threshold`,
      status: "pending",
      educationalContent: educationalContentByType.concentration,
    })
  }
  
  // Check liquidity needs
  const liquidityNeeded = totalCash + totalTax
  const liquidityShortfall = liquidityNeeded - liquidityTarget
  if (liquidityShortfall > 0 && grants.length > 0) {
    actions.push({
      id: `liq-shortfall-${Math.round(liquidityTarget / 1000)}k`,
      type: "liquidity",
      priority: liquidityShortfall > 50000 ? "high" : "medium",
      title: `Cash reserve shortfall of ${formatCurrency(liquidityShortfall)}`,
      description: `Current liquidity target (${formatCurrency(liquidityTarget)}) is insufficient to cover exercise costs and taxes (${formatCurrency(liquidityNeeded)}). Build reserves or consider cashless exercise strategies.`,
      impact: formatCurrency(liquidityShortfall),
      status: "pending",
      educationalContent: educationalContentByType.liquidity,
    })
  }
  
  // Check upcoming vests within 60 days
  grants.forEach(grant => {
    const vestDate = new Date(grant.vestDate)
    const daysUntilVest = Math.floor((vestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilVest > 0 && daysUntilVest <= 60) {
      const calc = calculateGrant(grant, taxAssumptions)
      actions.push({
        id: `vest-${grant.id}`,
        type: "vest-reminder",
        priority: daysUntilVest <= 14 ? "high" : "medium",
        title: `${grant.shares.toLocaleString()} ${grant.type} shares vesting in ${daysUntilVest} days`,
        description: grant.type === "RSU" || grant.type === "ESPP"
          ? `Estimated taxable income at vest: ${formatCurrency(calc.income)}. Review withholding elections.`
          : `Options will become exercisable. Review exercise strategy and tax implications.`,
        impact: formatCurrency(calc.income),
        deadline: grant.vestDate,
        status: "pending",
        relatedGrantIds: [grant.id],
        educationalContent: educationalContentByType["vest-reminder"],
      })
    }
  })
  
  // Check blackout windows affecting upcoming vests
  const upcomingBlackout = blackouts.find(b => {
    const start = new Date(b.start)
    const daysUntilStart = Math.floor((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilStart > 0 && daysUntilStart <= 30
  })
  
  if (upcomingBlackout) {
    actions.push({
      id: `black-${upcomingBlackout.id}`,
      type: "blackout",
      priority: "medium",
      title: "Upcoming blackout period",
      description: `Trading window closing from ${new Date(upcomingBlackout.start).toLocaleDateString()} to ${new Date(upcomingBlackout.end).toLocaleDateString()}. Complete any planned exercises before the window closes.`,
      deadline: upcomingBlackout.start,
      status: "pending",
      educationalContent: educationalContentByType.blackout,
    })
  }
  
  // Check for LTCG qualification windows (ISOs held > 1 year from exercise)
  grants.filter(g => g.type === "ISO").forEach(grant => {
    const vestDate = new Date(grant.vestDate)
    const ltcgEligibleDate = new Date(vestDate)
    ltcgEligibleDate.setFullYear(ltcgEligibleDate.getFullYear() + 1)
    const daysUntilLTCG = Math.floor((ltcgEligibleDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilLTCG > 0 && daysUntilLTCG <= 90) {
      const calc = calculateGrant(grant, taxAssumptions)
      const taxSavings = calc.income * (taxAssumptions.ordinaryRate - taxAssumptions.ltcgRate)
      actions.push({
        id: `ltcg-${grant.id}`,
        type: "ltcg-window",
        priority: daysUntilLTCG <= 30 ? "high" : "medium",
        title: `LTCG qualification in ${daysUntilLTCG} days`,
        description: `${grant.shares.toLocaleString()} ISO shares will qualify for long-term capital gains treatment. Potential tax savings: ${formatCurrency(taxSavings)}.`,
        impact: formatCurrency(taxSavings),
        deadline: ltcgEligibleDate.toISOString().split('T')[0],
        status: "pending",
        relatedGrantIds: [grant.id],
        educationalContent: educationalContentByType["ltcg-window"],
      })
    }
  })
  
  // Diversification recommendation if high value and low diversity
  if (totalValue > 100000 && concentrationPercent > 0.2 && grants.length > 0) {
    actions.push({
      id: `div-recommendation`,
      type: "diversification",
      priority: "low",
      title: "Consider diversification strategy",
      description: `With ${formatCurrency(totalValue)} in equity compensation, developing a systematic diversification plan can reduce risk while managing tax impact.`,
      status: "pending",
      educationalContent: educationalContentByType.diversification,
    })
  }
  
  // Merge with existing actions to preserve status
  return actions.map(newAction => {
    const existing = existingActions.find(a => a.id === newAction.id)
    if (existing) {
      return { ...newAction, status: existing.status, statusUpdatedAt: existing.statusUpdatedAt }
    }
    return newAction
  })
}

export function SuggestedActions({
  grants,
  taxAssumptions,
  blackouts,
  concentrationThreshold,
  liquidityTarget,
  actions,
  onActionsChange,
}: SuggestedActionsProps) {
  const [selectedAction, setSelectedAction] = useState<SuggestedAction | null>(null)
  
  // Generate actions when inputs change - use refs to avoid dependency issues
  const actionsRef = useRef(actions)
  actionsRef.current = actions
  
  const onActionsChangeRef = useRef(onActionsChange)
  onActionsChangeRef.current = onActionsChange
  
  useEffect(() => {
    // Only regenerate if we have grants
    if (grants.length === 0) {
      if (actionsRef.current.length > 0) {
        onActionsChangeRef.current([])
      }
      return
    }
    
    const newActions = generateActions(grants, taxAssumptions, blackouts, concentrationThreshold, liquidityTarget, actionsRef.current)
    const newActionIds = new Set(newActions.map(a => a.id))
    const currentActionIds = new Set(actionsRef.current.map(a => a.id))
    
    // Check if there are new or removed actions (compare by ID only)
    const hasNewActions = newActions.some(a => !currentActionIds.has(a.id))
    const hasRemovedActions = actionsRef.current.some(a => !newActionIds.has(a.id))
    
    if (hasNewActions || hasRemovedActions) {
      onActionsChangeRef.current(newActions)
    }
  }, [grants, taxAssumptions, blackouts, concentrationThreshold, liquidityTarget])
  
  const updateActionStatus = (actionId: string, status: ActionStatus) => {
    const updated = actions.map(a => 
      a.id === actionId 
        ? { ...a, status, statusUpdatedAt: new Date().toISOString() }
        : a
    )
    onActionsChange(updated)
    if (selectedAction?.id === actionId) {
      setSelectedAction({ ...selectedAction, status, statusUpdatedAt: new Date().toISOString() })
    }
  }
  
  // Filter visible actions (not dismissed unless showing all)
  const visibleActions = actions.filter(a => a.status !== "dismissed")
  const sortedActions = [...visibleActions].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    const statusOrder = { pending: 0, "in-progress": 1, completed: 2, dismissed: 3 }
    
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }
    return statusOrder[a.status] - statusOrder[b.status]
  })
  
  const pendingCount = actions.filter(a => a.status === "pending").length
  const inProgressCount = actions.filter(a => a.status === "in-progress").length
  
  if (grants.length === 0) {
    return (
      <Card className="border-0 bg-gradient-to-br from-slate-50 to-slate-100/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Suggested Actions</CardTitle>
              <p className="text-xs text-muted-foreground">AI-powered recommendations</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-4 mb-3">
              <Zap className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No Actions Available</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              Add grants in the Grant Planner to receive personalized action recommendations.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-0 bg-gradient-to-br from-slate-50 to-slate-100/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Suggested Actions</CardTitle>
                <p className="text-xs text-muted-foreground">AI-powered recommendations</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pendingCount > 0 && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  {pendingCount} pending
                </Badge>
              )}
              {inProgressCount > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {inProgressCount} in progress
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-2">
              {sortedActions.map((action) => {
                const config = actionTypeConfig[action.type]
                const Icon = config.icon
                const priority = priorityConfig[action.priority]
                const status = statusConfig[action.status]
                const StatusIcon = status.icon
                
                return (
                  <div
                    key={action.id}
                    className={cn(
                      "rounded-lg border p-3 cursor-pointer transition-all hover:shadow-md hover:border-primary/30",
                      config.bgColor,
                      action.status === "completed" && "opacity-60"
                    )}
                    onClick={() => setSelectedAction(action)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("rounded-full p-1.5 bg-white/80", config.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded border", priority.color)}>
                            {action.priority === "high" ? "!" : action.priority === "medium" ? "•" : "○"}
                          </span>
                          <Badge variant="outline" className={cn("text-xs h-5", status.color)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm leading-tight">{action.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{action.description}</p>
                        {(action.impact || action.deadline) && (
                          <div className="flex items-center gap-3 mt-2">
                            {action.impact && (
                              <span className="text-xs font-medium text-emerald-700">
                                Impact: {action.impact}
                              </span>
                            )}
                            {action.deadline && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(action.deadline).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => updateActionStatus(action.id, "in-progress")}>
                            <Play className="h-4 w-4 mr-2" />
                            Mark In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateActionStatus(action.id, "completed")}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Mark Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateActionStatus(action.id, "dismissed")}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Dismiss
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateActionStatus(action.id, "pending")}>
                            <Pause className="h-4 w-4 mr-2" />
                            Reset to Pending
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
              
              {sortedActions.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-emerald-700">All caught up!</p>
                  <p className="text-xs text-muted-foreground">No pending actions at this time.</p>
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Compliance Disclosure */}
          <div className="mt-4 pt-3 border-t">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <Info className="h-3 w-3 inline mr-1" />
              <strong>Disclosure:</strong> These suggestions are informational only and do not constitute personalized investment advice. 
              Review all recommendations with appropriate professional advisors before taking action.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Action Detail Sheet */}
      <Sheet open={!!selectedAction} onOpenChange={(open) => !open && setSelectedAction(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedAction && (
            <>
              <SheetHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "rounded-lg p-2",
                    actionTypeConfig[selectedAction.type].bgColor,
                    actionTypeConfig[selectedAction.type].color
                  )}>
                    {(() => {
                      const Icon = actionTypeConfig[selectedAction.type].icon
                      return <Icon className="h-5 w-5" />
                    })()}
                  </div>
                  <div>
                    <SheetTitle className="text-lg">{selectedAction.title}</SheetTitle>
                    <SheetDescription className="text-sm">
                      {selectedAction.type.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())} Action
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              
              <div className="space-y-6">
                {/* Status and Priority */}
                <div className="flex items-center gap-3">
                  <Badge className={priorityConfig[selectedAction.priority].color}>
                    {priorityConfig[selectedAction.priority].label}
                  </Badge>
                  <Badge className={statusConfig[selectedAction.status].color}>
                    {(() => {
                      const StatusIcon = statusConfig[selectedAction.status].icon
                      return <StatusIcon className="h-3 w-3 mr-1" />
                    })()}
                    {statusConfig[selectedAction.status].label}
                  </Badge>
                </div>
                
                {/* Description */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedAction.description}</p>
                </div>
                
                {/* Impact and Deadline */}
                {(selectedAction.impact || selectedAction.deadline) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedAction.impact && (
                      <div className="rounded-lg bg-emerald-50 p-3">
                        <p className="text-xs text-emerald-600 font-medium">Potential Impact</p>
                        <p className="text-lg font-bold text-emerald-700">{selectedAction.impact}</p>
                      </div>
                    )}
                    {selectedAction.deadline && (
                      <div className="rounded-lg bg-blue-50 p-3">
                        <p className="text-xs text-blue-600 font-medium">Deadline</p>
                        <p className="text-lg font-bold text-blue-700">
                          {new Date(selectedAction.deadline).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Educational Content */}
                {selectedAction.educationalContent && (
                  <>
                    {/* Explanation */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold text-sm">Understanding This Action</h4>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedAction.educationalContent.explanation}
                      </p>
                      {selectedAction.educationalContent.irsReference && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Reference: {selectedAction.educationalContent.irsReference}
                        </p>
                      )}
                    </div>
                    
                    {/* Key Points */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        <h4 className="font-semibold text-sm">Key Points</h4>
                      </div>
                      <ul className="space-y-2">
                        {selectedAction.educationalContent.keyPoints.map((point, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <ArrowRight className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Resources */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <ExternalLink className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold text-sm">Related Resources</h4>
                      </div>
                      <div className="space-y-2">
                        {selectedAction.educationalContent.resources.map((resource, i) => (
                          <a
                            key={i}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50 hover:border-primary/30 group"
                          >
                            <span className="text-sm font-medium group-hover:text-primary">{resource.label}</span>
                            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  {selectedAction.status !== "completed" && (
                    <Button 
                      className="flex-1"
                      onClick={() => updateActionStatus(selectedAction.id, "completed")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark Completed
                    </Button>
                  )}
                  {selectedAction.status === "pending" && (
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => updateActionStatus(selectedAction.id, "in-progress")}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Progress
                    </Button>
                  )}
                  {selectedAction.status !== "dismissed" && (
                    <Button 
                      variant="ghost"
                      onClick={() => {
                        updateActionStatus(selectedAction.id, "dismissed")
                        setSelectedAction(null)
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Dismiss
                    </Button>
                  )}
                </div>
                
                {/* Compliance Disclaimer */}
                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  <strong>Compliance Notice:</strong> This information is provided for educational purposes only and does not constitute 
                  personalized investment, legal, or tax advice. The suggestions presented are generated based on general best practices 
                  and the client data entered into this system. Always consult with qualified tax, legal, and financial professionals 
                  before making decisions regarding equity compensation.
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

// Export function to get action summaries for reports
export function getActionSummariesForReport(actions: SuggestedAction[]): {
  pending: SuggestedAction[]
  inProgress: SuggestedAction[]
  completed: SuggestedAction[]
  dismissed: SuggestedAction[]
} {
  return {
    pending: actions.filter(a => a.status === "pending"),
    inProgress: actions.filter(a => a.status === "in-progress"),
    completed: actions.filter(a => a.status === "completed"),
    dismissed: actions.filter(a => a.status === "dismissed"),
  }
}
