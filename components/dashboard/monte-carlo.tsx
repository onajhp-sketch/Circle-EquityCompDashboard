"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useState, useEffect, useCallback } from "react"
import {
  runPortfolioMonteCarlo,
  percentile,
  formatCurrency,
  type Grant,
  type TaxAssumptions,
} from "@/lib/calculations"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import {
  Activity,
  TrendingDown,
  Minus,
  TrendingUp,
  Target,
  RefreshCw,
  Info,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MonteCarloParams {
  drift: number
  volatility: number
  horizonMonths: number
  simulations: number
  steps: number
}

interface MonteCarloProps {
  spotPrice: number
  hasGrants?: boolean
  grants?: Grant[]
  taxAssumptions?: TaxAssumptions
}

export function MonteCarlo({
  spotPrice,
  hasGrants = true,
  grants = [],
  taxAssumptions,
}: MonteCarloProps) {
  const [params, setParams] = useState<MonteCarloParams>({
    drift: 0.08,
    volatility: 0.35,
    horizonMonths: 12,
    simulations: 2000,
    steps: 12,
  })

  const [results, setResults] = useState<{
    p10: number
    p50: number
    p90: number
    histogram: { label: string; count: number; valueNum: number }[]
    mode: "portfolio" | "price"
  }>({ p10: 0, p50: 0, p90: 0, histogram: [], mode: "price" })

  const [isRunning, setIsRunning] = useState(false)

  const runSimulation = useCallback(() => {
    setIsRunning(true)
    setTimeout(() => {
      const hasPortfolio = grants.length > 0 && taxAssumptions !== undefined

      let finals: number[]
      let mode: "portfolio" | "price" = "price"

      if (hasPortfolio && taxAssumptions) {
        // Portfolio after-tax simulation — connected to real grant data
        finals = runPortfolioMonteCarlo(
          grants,
          { ...taxAssumptions, currentPrice: spotPrice },
          params.drift,
          params.volatility,
          params.horizonMonths,
          params.simulations,
          params.steps,
        )
        mode = "portfolio"
      } else {
        // Fall back to price-only simulation
        const { runMonteCarloSimulation } = require("@/lib/calculations")
        finals = runMonteCarloSimulation(
          spotPrice,
          params.drift,
          params.volatility,
          params.horizonMonths,
          params.simulations,
          params.steps,
        )
        mode = "price"
      }

      const p10 = percentile(finals, 0.1)
      const p50 = percentile(finals, 0.5)
      const p90 = percentile(finals, 0.9)

      const min = Math.min(...finals)
      const max = Math.max(...finals)
      const buckets = 50
      const width = (max - min) / buckets || 1
      const counts = Array(buckets).fill(0)
      finals.forEach((v) => {
        const i = Math.min(buckets - 1, Math.max(0, Math.floor((v - min) / width)))
        counts[i]++
      })
      const histogram = counts.map((count, i) => ({
        label: mode === "portfolio"
          ? formatCurrency(min + i * width, 0)
          : `$${Math.round(min + i * width)}`,
        valueNum: min + i * width,
        count,
      }))

      setResults({ p10, p50, p90, histogram, mode })
      setIsRunning(false)
    }, 100)
  }, [params, grants, taxAssumptions, spotPrice])

  useEffect(() => {
    runSimulation()
  }, [runSimulation])

  const handleChange = (key: keyof MonteCarloParams, value: string) => {
    setParams({ ...params, [key]: parseFloat(value) || 0 })
  }

  const getPercentileIndex = (value: number) =>
    results.histogram.findIndex(
      (h, i, arr) => h.valueNum >= value && (i === 0 || arr[i - 1].valueNum < value),
    )

  const fmt = (v: number) =>
    results.mode === "portfolio" ? formatCurrency(v) : formatCurrency(v, 2)

  if (!hasGrants) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Activity className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No Data for Simulation</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Add grants in the Grant Planner tab to run Monte Carlo simulations and view projected
            portfolio outcomes.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-0 bg-gradient-to-br from-primary via-primary to-[oklch(0.20_0.05_250)] text-primary-foreground shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-primary-foreground/10 p-3 backdrop-blur">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="font-serif text-2xl font-bold">
                  Monte Carlo Simulation
                </CardTitle>
                <CardDescription className="text-primary-foreground/70">
                  {results.mode === "portfolio"
                    ? `After-tax portfolio value — ${grants.length} grant${grants.length !== 1 ? "s" : ""} included`
                    : "Stock price path analysis (add grants for portfolio mode)"}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {results.mode === "portfolio" && (
                <Badge
                  variant="secondary"
                  className="bg-emerald-500/20 text-emerald-200 border-0 text-xs"
                >
                  Portfolio Mode
                </Badge>
              )}
              <Badge
                variant="secondary"
                className="bg-primary-foreground/20 text-primary-foreground border-0 font-mono"
              >
                {params.simulations.toLocaleString()} paths
              </Badge>
              <Button
                size="sm"
                variant="secondary"
                onClick={runSimulation}
                disabled={isRunning}
                className="bg-primary-foreground/20 text-primary-foreground border-0 hover:bg-primary-foreground/30"
              >
                <RefreshCw className={cn("h-4 w-4 mr-1.5", isRunning && "animate-spin")} />
                Rerun
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { id: "drift",         label: "Annual Drift (μ)",  suffix: "%", step: "0.01" },
              { id: "volatility",    label: "Annual Vol (σ)",    suffix: "%", step: "0.01" },
              { id: "horizonMonths", label: "Time Horizon",      suffix: "mo", step: "1" },
              { id: "simulations",   label: "Simulations",       suffix: "",  step: "500" },
              { id: "steps",         label: "Time Steps",        suffix: "",  step: "1" },
            ].map(({ id, label, suffix, step }) => (
              <div key={id} className="space-y-1.5">
                <Label htmlFor={id} className="text-xs font-medium text-primary-foreground/70">
                  {label}
                </Label>
                <div className="relative">
                  <Input
                    id={id}
                    type="number"
                    step={step}
                    value={params[id as keyof MonteCarloParams]}
                    onChange={(e) => handleChange(id as keyof MonteCarloParams, e.target.value)}
                    className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 font-mono pr-8"
                  />
                  {suffix && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary-foreground/50">
                      {suffix}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "P10 Bear Case",
            value: results.p10,
            sub: "10th percentile outcome",
            progress: 10,
            icon: TrendingDown,
            colors: { card: "border-red-200 from-red-50", text: "text-red-700", icon: "bg-red-100 text-red-600", bar: "[&>div]:bg-red-500", prog: "bg-red-100" },
          },
          {
            label: "P50 Median",
            value: results.p50,
            sub: "50th percentile outcome",
            progress: 50,
            icon: Minus,
            colors: { card: "border-border from-muted/30", text: "text-foreground", icon: "bg-primary/10 text-primary", bar: "", prog: "" },
          },
          {
            label: "P90 Bull Case",
            value: results.p90,
            sub: "90th percentile outcome",
            progress: 90,
            icon: TrendingUp,
            colors: { card: "border-emerald-200 from-emerald-50", text: "text-emerald-700", icon: "bg-emerald-100 text-emerald-600", bar: "[&>div]:bg-emerald-500", prog: "bg-emerald-100" },
          },
          {
            label: results.mode === "portfolio" ? "Current Portfolio" : "Current Spot",
            value: results.mode === "portfolio"
              ? grants.reduce((s, g) => {
                  if (!taxAssumptions) return s
                  const { calculateGrant: cg } = require("@/lib/calculations")
                  return s + cg({ ...g, fmvAtVest: spotPrice }, { ...taxAssumptions, currentPrice: spotPrice }).afterTax
                }, 0)
              : spotPrice,
            sub: results.mode === "portfolio" ? "After-tax at spot price" : "Today's market price",
            progress: null,
            icon: Target,
            colors: { card: "border-accent/40 from-accent/5 ring-1 ring-accent/20", text: "text-[#9A6A10]", icon: "bg-accent/20 text-accent", bar: "", prog: "" },
          },
        ].map(({ label, value, sub, progress, icon: Icon, colors }) => (
          <Card
            key={label}
            className={`relative overflow-hidden bg-gradient-to-br to-white ${colors.card}`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-current/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="relative pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider opacity-70 ${colors.text}`}>
                    {label}
                  </p>
                  <p className={`mt-2 font-serif text-2xl font-bold tracking-tight lg:text-3xl ${colors.text}`}>
                    {fmt(value)}
                  </p>
                  <p className={`mt-1 text-xs opacity-60 ${colors.text}`}>{sub}</p>
                </div>
                <div className={`rounded-xl p-2.5 ${colors.icon}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              {progress !== null && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`opacity-60 ${colors.text}`}>Probability below</span>
                    <span className={`font-medium ${colors.text}`}>{progress}%</span>
                  </div>
                  <Progress
                    value={progress}
                    className={`h-1.5 ${colors.prog} ${colors.bar}`}
                  />
                </div>
              )}
              {progress === null && (
                <div className="mt-4 flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-accent" />
                  <span className={`text-xs opacity-70 ${colors.text}`}>Reference for simulation</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Distribution Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  {results.mode === "portfolio"
                    ? "Portfolio After-Tax Value Distribution"
                    : "Terminal Price Distribution"}
                </CardTitle>
                <CardDescription className="text-xs">
                  Probability density of simulated outcomes at horizon
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              <span>Hover for details</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={results.histogram} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v.toLocaleString()}
                />
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString(), "Simulations"]}
                  labelFormatter={(label) =>
                    results.mode === "portfolio" ? `After-Tax: ${label}` : `Price: ${label}`
                  }
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    fontSize: "12px",
                  }}
                />
                <ReferenceLine
                  x={results.histogram[getPercentileIndex(results.p10)]?.label}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <ReferenceLine
                  x={results.histogram[getPercentileIndex(results.p50)]?.label}
                  stroke="hsl(var(--primary))"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <ReferenceLine
                  x={results.histogram[getPercentileIndex(results.p90)]?.label}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-lg border bg-muted/20 p-3">
            {[
              { color: "bg-red-500",     label: `P10: ${fmt(results.p10)}` },
              { color: "bg-primary",     label: `P50: ${fmt(results.p50)}` },
              { color: "bg-emerald-500", label: `P90: ${fmt(results.p90)}` },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${color}`} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          {/* SEC-compliant disclosure */}
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
            <p className="text-[10px] text-amber-800 leading-relaxed">
              <strong>Hypothetical Illustration:</strong> Monte Carlo results are simulated using
              Geometric Brownian Motion and do not reflect actual investment results or guarantee
              future performance. These projections are for illustrative purposes only per SEC
              Marketing Rule 206(4)-1. Past performance is not indicative of future results. All
              investments involve risk including loss of principal.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
