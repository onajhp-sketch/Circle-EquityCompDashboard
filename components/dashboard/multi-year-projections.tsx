"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TrendingUp, Calendar, DollarSign, Settings2 } from "lucide-react"
import { useState, useMemo } from "react"
import {
  type Grant,
  type TaxAssumptions,
  calculateGrant,
  formatCurrency,
} from "@/lib/calculations"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

interface MultiYearProjectionsProps {
  grants: Grant[]
  taxAssumptions: TaxAssumptions
}

export function MultiYearProjections({ grants, taxAssumptions }: MultiYearProjectionsProps) {
  const [growthRate, setGrowthRate] = useState(0.08)
  const [years, setYears] = useState(5)

  const projectionData = useMemo(() => {
    const data = []
    const currentYear = new Date().getFullYear()

    for (let i = 0; i <= years; i++) {
      const year = currentYear + i
      const priceMultiplier = Math.pow(1 + growthRate, i)
      const projectedPrice = taxAssumptions.currentPrice * priceMultiplier

      // Only count grants that vest IN this specific year (not cumulatively re-taxed).
      // Grants that vested in prior years have already been taxed; what changes going forward
      // is their *value* if held, not the tax event (which already occurred).
      let vestedValueThisYear = 0
      let taxLiabilityThisYear = 0
      let afterTaxThisYear = 0

      // Running cumulative after-tax (held shares growing)
      let cumulativeAfterTax = 0

      grants.forEach((grant) => {
        const vestYear = new Date(grant.vestDate).getFullYear()

        if (vestYear === year) {
          // Tax event occurs this year at the projected price
          const projAssumptions = { ...taxAssumptions, currentPrice: projectedPrice }
          const calc = calculateGrant({ ...grant, fmvAtVest: projectedPrice }, projAssumptions)
          vestedValueThisYear += grant.shares * projectedPrice
          taxLiabilityThisYear += calc.tax
          afterTaxThisYear += calc.afterTax
        }

        if (vestYear <= year) {
          // After-tax proceeds from prior years' vests grow at the stock's projected rate
          const yearsHeld = year - Math.max(vestYear, currentYear)
          const projAssumptions = {
            ...taxAssumptions,
            currentPrice: taxAssumptions.currentPrice * Math.pow(1 + growthRate, Math.max(0, vestYear - currentYear)),
          }
          const vestCalc = calculateGrant(
            { ...grant, fmvAtVest: projAssumptions.currentPrice },
            projAssumptions,
          )
          // After-tax proceeds reinvested at the same growth rate
          cumulativeAfterTax += vestCalc.afterTax * Math.pow(1 + growthRate, yearsHeld)
        }
      })

      data.push({
        year,
        yearLabel: year.toString(),
        grossValueThisYear: Math.round(vestedValueThisYear),
        taxLiabilityThisYear: Math.round(taxLiabilityThisYear),
        afterTaxThisYear: Math.round(afterTaxThisYear),
        cumulativeAfterTax: Math.round(cumulativeAfterTax),
        stockPrice: Math.round(projectedPrice * 100) / 100,
      })
    }

    return data
  }, [grants, taxAssumptions, growthRate, years])

  const finalYear = projectionData[projectionData.length - 1]

  if (grants.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No Grants to Project</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Add grants in the Grant Planner tab to see multi-year projections and portfolio growth.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="border-b bg-muted/30 pb-4">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Portfolio Planning
                </p>
                <CardTitle className="font-serif text-xl">Multi-Year Projections</CardTitle>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">Growth Rate:</label>
                <div className="relative w-24">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={growthRate}
                    onChange={(e) => setGrowthRate(parseFloat(e.target.value) || 0)}
                    className="h-8 pr-7 font-mono text-sm"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <Select value={years.toString()} onValueChange={(v) => setYears(parseInt(v))}>
                <SelectTrigger className="h-8 w-28 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 5, 7, 10].map((y) => (
                    <SelectItem key={y} value={y.toString()}>{y} Years</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Summary Row */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Projected Stock Price ({finalYear?.year})
                </p>
              </div>
              <p className="font-serif text-2xl font-bold">
                {formatCurrency(finalYear?.stockPrice ?? 0, 2)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                vs. {formatCurrency(taxAssumptions.currentPrice, 2)} today
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Cumulative After-Tax Value
                </p>
              </div>
              <p className="font-serif text-2xl font-bold text-emerald-700">
                {formatCurrency(finalYear?.cumulativeAfterTax ?? 0)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">All vested grants, reinvested</p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Grants Vesting ({finalYear?.year})
                </p>
              </div>
              <p className="font-serif text-2xl font-bold">
                {grants.filter((g) => new Date(g.vestDate).getFullYear() === finalYear?.year).length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Events in final projection year</p>
            </div>
          </div>

          {/* Chart */}
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cumAfterTax" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="grossValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="taxLiability" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis
                  dataKey="yearLabel"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === "cumulativeAfterTax"
                      ? "Cumulative After-Tax"
                      : name === "grossValueThisYear"
                      ? "Gross Value (Year)"
                      : "Tax Liability (Year)",
                  ]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  formatter={(value) =>
                    value === "cumulativeAfterTax"
                      ? "Cumulative After-Tax"
                      : value === "grossValueThisYear"
                      ? "Gross Value (Year)"
                      : "Tax Liability (Year)"
                  }
                />
                <Area
                  type="monotone"
                  dataKey="grossValueThisYear"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#grossValue)"
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeAfterTax"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#cumAfterTax)"
                />
                <Area
                  type="monotone"
                  dataKey="taxLiabilityThisYear"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  fill="url(#taxLiability)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Year-by-year table */}
          <div className="mt-6 overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-2.5 text-left font-semibold">Year</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Stock Price</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Gross (Year)</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Tax (Year)</th>
                  <th className="px-4 py-2.5 text-right font-semibold">After-Tax (Year)</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Cumulative After-Tax</th>
                </tr>
              </thead>
              <tbody>
                {projectionData.map((row, i) => (
                  <tr key={row.year} className={i % 2 === 0 ? "bg-card" : "bg-muted/10"}>
                    <td className="px-4 py-2.5 font-medium">{row.year}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{formatCurrency(row.stockPrice, 2)}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{formatCurrency(row.grossValueThisYear)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-red-600">{formatCurrency(row.taxLiabilityThisYear)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-emerald-600">{formatCurrency(row.afterTaxThisYear)}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-emerald-700">{formatCurrency(row.cumulativeAfterTax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            * Tax events occur in the vest year only. Cumulative after-tax assumes proceeds are
            reinvested at the same projected growth rate. Actual results will vary.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
