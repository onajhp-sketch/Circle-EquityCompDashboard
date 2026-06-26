"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Calculator,
  Plus,
  Trash2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react"
import { useState } from "react"
import { formatCurrency, generateId } from "@/lib/calculations"
import { cn } from "@/lib/utils"

interface AMTCredit {
  id: string
  year: number
  isoSpread: number       // AMT preference item (bargain element at exercise)
  amtGenerated: number    // actual AMT paid = max(0, tentativeMinTax - regularTax)
  amtUsed: number         // credits utilised in subsequent years
  carryforward: number    // remaining credit
}

interface AMTTrackerProps {
  isoExercises?: number   // sum of ISO spreads from current grants
  amtRate?: number        // from tax assumptions
  hasGrants?: boolean
}

/** Simplified AMT estimate for display purposes.
 *  True AMT requires Form 6251: AMTI = regular income + ISO spread + other items - exemption.
 *  We show an approximation and note its limitations.
 */
function estimateAMT(isoSpread: number, amtRate: number): number {
  // 2024 AMT exemption (MFJ): $137,000, phases out above $1,237,450
  // Simplified: assume exemption already absorbed by other income
  return Math.max(0, isoSpread * amtRate)
}

export function AMTTracker({ isoExercises = 0, amtRate = 0.28, hasGrants = true }: AMTTrackerProps) {
  const [credits, setCredits] = useState<AMTCredit[]>(
    hasGrants
      ? [
          { id: "1", year: 2022, isoSpread: 53571, amtGenerated: 15000, amtUsed: 5000, carryforward: 10000 },
          { id: "2", year: 2023, isoSpread: 30357, amtGenerated: 8500,  amtUsed: 3500, carryforward: 5000 },
          { id: "3", year: 2024, isoSpread: 42857, amtGenerated: 12000, amtUsed: 0,    carryforward: 12000 },
        ]
      : []
  )
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCredit, setNewCredit] = useState({
    year: new Date().getFullYear(),
    isoSpread: 0,
  })

  const totalCarryforward = credits.reduce((s, c) => s + c.carryforward, 0)
  const totalGenerated    = credits.reduce((s, c) => s + c.amtGenerated, 0)
  const totalUsed         = credits.reduce((s, c) => s + c.amtUsed, 0)
  const utilizationRate   = totalGenerated > 0 ? totalUsed / totalGenerated : 0

  // Estimated AMT from current ISO exercises in grants
  const projectedAMT = estimateAMT(isoExercises, amtRate)

  const handleAddCredit = () => {
    const generated = estimateAMT(newCredit.isoSpread, amtRate)
    const credit: AMTCredit = {
      id: generateId(),
      year: newCredit.year,
      isoSpread: newCredit.isoSpread,
      amtGenerated: generated,
      amtUsed: 0,
      carryforward: generated,
    }
    setCredits([...credits, credit].sort((a, b) => a.year - b.year))
    setNewCredit({ year: new Date().getFullYear(), isoSpread: 0 })
    setShowAddForm(false)
  }

  const handleRemoveCredit = (id: string) => setCredits(credits.filter((c) => c.id !== id))

  if (!hasGrants) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Calculator className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No AMT Data Available</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Add ISO grants in the Grant Planner tab to track AMT credits and plan tax-efficient
            exercise strategies.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="border-b bg-muted/30 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2 text-purple-700">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tax Planning</p>
              <CardTitle className="font-serif text-xl">AMT Credit Tracking</CardTitle>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="mr-1 h-3 w-3" />
            Add Year
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {/* Summary Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-muted/20 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Carryforward</p>
            <p className="mt-1 font-serif text-2xl font-bold text-purple-700">
              {formatCurrency(totalCarryforward)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Available to offset future regular tax</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Generated</p>
            <p className="mt-1 font-serif text-2xl font-bold">{formatCurrency(totalGenerated)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Cumulative AMT paid across years</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Utilization Rate</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="font-serif text-2xl font-bold">{(utilizationRate * 100).toFixed(0)}%</p>
              <Progress value={utilizationRate * 100} className="h-2 flex-1" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Credits recovered vs. generated</p>
          </div>
        </div>

        {/* Current ISO exposure notice */}
        {isoExercises > 0 && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-medium text-amber-800">Potential AMT Exposure from Current ISO Grants</p>
                <p className="text-sm text-amber-700 mt-1">
                  ISO bargain element (spread): <strong>{formatCurrency(isoExercises)}</strong>
                </p>
                <p className="text-sm text-amber-700">
                  Estimated AMT at {(amtRate * 100).toFixed(0)}% rate:{" "}
                  <strong>{formatCurrency(projectedAMT)}</strong>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 pl-8">
              <Info className="mt-0.5 h-4 w-4 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-600 leading-relaxed">
                This is a simplified estimate. Actual AMT depends on your total AMTI, the 2024 exemption
                ($137,000 MFJ, phasing out above $1,237,450), and all other preference items. Use
                Form 6251 or consult a tax advisor for your actual liability.
              </p>
            </div>
          </div>
        )}

        {/* Add Credit Form */}
        {showAddForm && (
          <div className="mb-4 flex items-end gap-3 rounded-lg border bg-muted/20 p-4">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium">Tax Year</label>
              <Input
                type="number"
                value={newCredit.year}
                onChange={(e) => setNewCredit({ ...newCredit, year: parseInt(e.target.value) })}
                className="h-9"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium">ISO Bargain Element (Spread)</label>
              <Input
                type="number"
                value={newCredit.isoSpread}
                onChange={(e) =>
                  setNewCredit({ ...newCredit, isoSpread: parseFloat(e.target.value) || 0 })
                }
                className="h-9"
                placeholder="$0"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Est. AMT</label>
              <div className="h-9 flex items-center px-3 rounded-md border bg-muted/30 font-mono text-sm">
                {formatCurrency(estimateAMT(newCredit.isoSpread, amtRate))}
              </div>
            </div>
            <Button size="sm" onClick={handleAddCredit}>Add</Button>
          </div>
        )}

        {/* Credits Table */}
        <div className="space-y-2">
          {credits.map((credit) => (
            <div
              key={credit.id}
              className="flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-muted/20"
            >
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="font-mono">{credit.year}</Badge>
                <div className="flex items-center gap-6 text-sm flex-wrap">
                  <div>
                    <span className="text-muted-foreground">Spread:</span>{" "}
                    <span className="font-medium">{formatCurrency(credit.isoSpread)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">AMT Paid:</span>{" "}
                    <span className="font-medium">{formatCurrency(credit.amtGenerated)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Used:</span>{" "}
                    <span className="font-medium text-emerald-600">{formatCurrency(credit.amtUsed)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Remaining:</span>{" "}
                    <span className="font-semibold text-purple-700">{formatCurrency(credit.carryforward)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {credit.carryforward === 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveCredit(credit.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
