"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  FileText,
  Info,
  ExternalLink,
  Calendar,
  Zap,
} from "lucide-react"
import { formatCurrency, generateId } from "@/lib/calculations"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────

interface Election83b {
  id: string
  grantType: "ISO" | "NSO" | "RSU" | "Restricted Stock"
  symbol: string
  shares: number
  fmvAtGrant: number       // FMV per share on grant date (used for 83(b) valuation)
  strikePrice: number      // exercise / purchase price per share
  grantDate: string        // the "transfer" date — clock starts here
  filedDate?: string       // when the election was actually filed
  status: "pending" | "filed" | "expired" | "not-applicable"
  notes?: string
}

interface ElectionTrackerProps {
  hasGrants?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────

function deadlineDate(grantDate: string): Date {
  const d = new Date(grantDate)
  d.setDate(d.getDate() + 30)
  return d
}

function daysRemaining(grantDate: string): number {
  return Math.ceil((deadlineDate(grantDate).getTime() - Date.now()) / 86400000)
}

function urgencyLevel(days: number): "expired" | "critical" | "warning" | "ok" {
  if (days < 0)  return "expired"
  if (days <= 5) return "critical"
  if (days <= 15) return "warning"
  return "ok"
}

const URGENCY_STYLES = {
  expired:  { badge: "bg-gray-100 text-gray-500 border-gray-200",   bar: "[&>div]:bg-gray-400",  card: "border-gray-200",      icon: "text-gray-400"  },
  critical: { badge: "bg-red-100 text-red-700 border-red-200",      bar: "[&>div]:bg-red-500",   card: "border-red-300 bg-red-50/30",   icon: "text-red-500"   },
  warning:  { badge: "bg-amber-100 text-amber-700 border-amber-200", bar: "[&>div]:bg-amber-500", card: "border-amber-200 bg-amber-50/20", icon: "text-amber-500" },
  ok:       { badge: "bg-emerald-100 text-emerald-700 border-emerald-200", bar: "[&>div]:bg-emerald-500", card: "border-border", icon: "text-emerald-500" },
}

// ─── Education sheet content ─────────────────────────────────

function ElectionGuide({ onClose }: { onClose: () => void }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-primary">
            Understanding the 83(b) Election
          </DialogTitle>
          <DialogDescription>
            IRC Section 83(b) — Taxation of Property Received for Services
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          {/* What is it */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="font-semibold text-primary mb-2">What is an 83(b) Election?</p>
            <p className="text-muted-foreground leading-relaxed">
              An 83(b) election is a written notice filed with the IRS that allows you to pay
              ordinary income tax on restricted property (typically stock or options exercised early)
              at the time of grant rather than at vesting. If the stock appreciates, this can
              dramatically reduce your total tax burden by converting future gains from ordinary
              income to long-term capital gains.
            </p>
          </div>

          {/* The 30-day rule */}
          <div>
            <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-red-500" />
              The 30-Day Window — No Exceptions
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              The election <strong className="text-foreground">must be filed within 30 days</strong> of
              the grant or early exercise date. The IRS does not grant extensions for any reason —
              missing this deadline permanently eliminates the option to make the election for that grant.
            </p>
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-xs text-red-700 font-medium">
                ⚠ The postmark date counts, not the IRS receipt date. File via certified mail
                with return receipt so you have proof of timely filing.
              </p>
            </div>
          </div>

          {/* When it applies */}
          <div>
            <p className="font-semibold text-foreground mb-2">When Does It Apply?</p>
            <div className="space-y-2">
              {[
                { type: "Early-Exercise ISOs/NSOs", desc: "If your company allows early exercise before vesting, you can file an 83(b) on the unvested shares. You pay tax on the current spread (often $0 if exercised at grant) and future appreciation is LTCG." },
                { type: "Restricted Stock Awards (RSAs)", desc: "RSAs are immediately taxable at vesting unless you file an 83(b) at grant. Filing lets you pay tax at the (often lower) grant-date value instead of the (often higher) vest-date value." },
                { type: "Founder Shares / Early Startup Equity", desc: "Particularly valuable when the current FMV is low. Filing at grant means minimal ordinary income now and potential LTCG treatment on all future appreciation." },
              ].map(({ type, desc }) => (
                <div key={type} className="flex gap-3 rounded-lg border bg-muted/20 p-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground text-xs">{type}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* When NOT to file */}
          <div>
            <p className="font-semibold text-foreground mb-2">When NOT to File</p>
            <div className="space-y-2">
              {[
                "Standard RSU vesting — RSUs don't qualify for 83(b) elections because there's no property transfer at grant",
                "If the FMV at grant equals the exercise price and the stock is unlikely to appreciate significantly",
                "If you may forfeit the shares (e.g., leave the company) — you cannot recover taxes paid on forfeited property",
              ].map((item) => (
                <div key={item} className="flex gap-2 text-xs text-muted-foreground">
                  <span className="text-red-400 font-bold mt-0.5">×</span>
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How to file */}
          <div>
            <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              How to File
            </p>
            <ol className="space-y-2">
              {[
                "Prepare a written election statement including your name, address, SSN, description of the property, date of transfer, nature of restriction, FMV at transfer, and amount paid",
                "Make 4 copies: one for IRS, one for your employer, one for your tax return, one for your records",
                "Mail to the IRS Service Center where you file your federal return via certified mail with return receipt requested",
                "File within 30 days of the grant/exercise date — the postmark is what counts",
                "Attach a copy to your federal income tax return for the year of transfer",
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-xs text-muted-foreground">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* IRS reference */}
          <div className="flex items-center gap-2 rounded-lg border bg-muted/20 p-3">
            <ExternalLink className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="text-xs font-medium">IRS Reference</p>
              <p className="text-xs text-muted-foreground">
                IRC Section 83(b) · Treasury Regulation §1.83-2 · IRS Publication 525
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground border-t pt-4">
            This information is educational only and does not constitute tax or legal advice.
            Consult a qualified tax professional before making any election decision.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ──────────────────────────────────────────

export function ElectionTracker({ hasGrants = true }: ElectionTrackerProps) {
  const [elections, setElections] = useState<Election83b[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [newElection, setNewElection] = useState<Partial<Election83b>>({
    grantType: "ISO",
    symbol: "",
    shares: 0,
    fmvAtGrant: 0,
    strikePrice: 0,
    grantDate: "",
    status: "pending",
    notes: "",
  })

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("circle_83b_elections")
      if (saved) setElections(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem("circle_83b_elections", JSON.stringify(elections))
  }, [elections])

  // Auto-update expired statuses
  useEffect(() => {
    setElections((prev) =>
      prev.map((e) => {
        if (e.status === "pending" && daysRemaining(e.grantDate) < 0) {
          return { ...e, status: "expired" }
        }
        return e
      })
    )
  }, [])

  const handleAdd = () => {
    if (!newElection.grantDate || !newElection.symbol) return
    const election: Election83b = {
      id: generateId(),
      grantType: newElection.grantType || "ISO",
      symbol: newElection.symbol || "",
      shares: newElection.shares || 0,
      fmvAtGrant: newElection.fmvAtGrant || 0,
      strikePrice: newElection.strikePrice || 0,
      grantDate: newElection.grantDate || "",
      status: "pending",
      notes: newElection.notes || "",
    }
    setElections([...elections, election].sort(
      (a, b) => new Date(a.grantDate).getTime() - new Date(b.grantDate).getTime()
    ))
    setNewElection({ grantType: "ISO", symbol: "", shares: 0, fmvAtGrant: 0, strikePrice: 0, grantDate: "", status: "pending", notes: "" })
    setShowForm(false)
  }

  const handleMarkFiled = (id: string) => {
    setElections((prev) =>
      prev.map((e) => e.id === id ? { ...e, status: "filed", filedDate: new Date().toISOString().split("T")[0] } : e)
    )
  }

  const handleRemove = (id: string) => {
    setElections((prev) => prev.filter((e) => e.id !== id))
  }

  // Summary stats
  const pending  = elections.filter((e) => e.status === "pending")
  const critical = pending.filter((e) => urgencyLevel(daysRemaining(e.grantDate)) === "critical")
  const filed    = elections.filter((e) => e.status === "filed")
  const expired  = elections.filter((e) => e.status === "expired")

  if (!hasGrants && elections.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">83(b) Election Tracker</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-4">
            Track 30-day filing windows for early-exercise options and restricted stock awards.
            Add a grant below to get started.
          </p>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> Add Election
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {showGuide && <ElectionGuide onClose={() => setShowGuide(false)} />}

      <Card>
        <CardHeader className="border-b bg-muted/30 pb-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Tax Planning
                </p>
                <CardTitle className="font-serif text-xl">83(b) Election Tracker</CardTitle>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGuide(true)}
                className="gap-1.5"
              >
                <Info className="h-3.5 w-3.5" />
                What is 83(b)?
              </Button>
              <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add Election
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-5">
          {/* Critical alert banner */}
          {critical.length > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800">
                  {critical.length} Election{critical.length > 1 ? "s" : ""} Expiring Within 5 Days
                </p>
                <p className="text-sm text-red-700 mt-0.5">
                  File immediately via certified mail. Missing the 30-day window cannot be undone.
                </p>
              </div>
            </div>
          )}

          {/* Summary row */}
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Pending",  value: pending.length,  color: "text-amber-700",   bg: "bg-amber-50  border-amber-200" },
              { label: "Filed",    value: filed.length,    color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
              { label: "Expired",  value: expired.length,  color: "text-gray-500",    bg: "bg-gray-50   border-gray-200" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`rounded-lg border p-3 text-center ${bg}`}>
                <p className={`font-serif text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Add form */}
          {showForm && (
            <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
              <p className="text-sm font-semibold text-foreground">New 83(b) Election</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Grant Type</Label>
                  <select
                    value={newElection.grantType}
                    onChange={(e) => setNewElection({ ...newElection, grantType: e.target.value as Election83b["grantType"] })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="ISO">ISO (Early Exercise)</option>
                    <option value="NSO">NSO (Early Exercise)</option>
                    <option value="Restricted Stock">Restricted Stock Award</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Symbol</Label>
                  <Input
                    placeholder="TICKER"
                    value={newElection.symbol}
                    onChange={(e) => setNewElection({ ...newElection, symbol: e.target.value.toUpperCase() })}
                    className="h-9 font-mono uppercase"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Grant / Transfer Date</Label>
                  <Input
                    type="date"
                    value={newElection.grantDate}
                    onChange={(e) => setNewElection({ ...newElection, grantDate: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Shares</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newElection.shares || ""}
                    onChange={(e) => setNewElection({ ...newElection, shares: parseFloat(e.target.value) || 0 })}
                    className="h-9 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">FMV at Grant (per share)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newElection.fmvAtGrant || ""}
                      onChange={(e) => setNewElection({ ...newElection, fmvAtGrant: parseFloat(e.target.value) || 0 })}
                      className="h-9 pl-6 font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Exercise / Purchase Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newElection.strikePrice || ""}
                      onChange={(e) => setNewElection({ ...newElection, strikePrice: parseFloat(e.target.value) || 0 })}
                      className="h-9 pl-6 font-mono"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Notes (optional)</Label>
                <Input
                  placeholder="e.g., Early exercise on Series A preferred"
                  value={newElection.notes}
                  onChange={(e) => setNewElection({ ...newElection, notes: e.target.value })}
                  className="h-9"
                />
              </div>
              {newElection.grantDate && (
                <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                  <Calendar className="h-4 w-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800">
                    Filing deadline:{" "}
                    <strong>{deadlineDate(newElection.grantDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong>
                    {" — "}
                    {daysRemaining(newElection.grantDate) >= 0
                      ? `${daysRemaining(newElection.grantDate)} days remaining`
                      : "deadline has passed"}
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAdd} disabled={!newElection.grantDate || !newElection.symbol}>
                  Add Election
                </Button>
              </div>
            </div>
          )}

          {/* Elections list */}
          {elections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mb-3 opacity-40" />
              <p className="font-medium text-sm">No elections tracked yet</p>
              <p className="text-xs mt-1">Add early-exercise grants or restricted stock awards above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {elections.map((e) => {
                const days     = daysRemaining(e.grantDate)
                const urgency  = e.status === "filed"   ? "ok"
                               : e.status === "expired" ? "expired"
                               : urgencyLevel(days)
                const styles   = URGENCY_STYLES[urgency]
                const deadline = deadlineDate(e.grantDate)
                const taxableSpread = Math.max(0, e.fmvAtGrant - e.strikePrice) * e.shares

                return (
                  <div
                    key={e.id}
                    className={cn(
                      "rounded-xl border-2 p-4 transition-all",
                      styles.card
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      {/* Left: core info */}
                      <div className="flex items-start gap-3">
                        <div className={cn("mt-0.5", styles.icon)}>
                          {e.status === "filed"   ? <CheckCircle2 className="h-5 w-5" />
                           : e.status === "expired" ? <AlertTriangle className="h-5 w-5" />
                           : urgency === "critical" ? <AlertTriangle className="h-5 w-5" />
                           : <Clock className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-foreground font-mono">{e.symbol}</span>
                            <Badge variant="outline" className="text-xs font-mono">{e.grantType}</Badge>
                            <Badge variant="outline" className={cn("text-xs", styles.badge)}>
                              {e.status === "filed"   ? `Filed ${e.filedDate ? new Date(e.filedDate).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : ""}`
                               : e.status === "expired" ? "Deadline Expired"
                               : days === 0            ? "Due Today"
                               : `${days} days left`}
                            </Badge>
                          </div>
                          <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                            <span>{e.shares.toLocaleString()} shares</span>
                            <span>FMV: {formatCurrency(e.fmvAtGrant, 2)}/sh</span>
                            <span>Strike: {formatCurrency(e.strikePrice, 2)}/sh</span>
                            {taxableSpread > 0 && (
                              <span className="text-foreground font-medium">
                                Spread: {formatCurrency(taxableSpread)}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                            <span>Grant: {new Date(e.grantDate).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span>
                            <span>Deadline: {deadline.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span>
                          </div>
                          {e.notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">{e.notes}</p>
                          )}
                        </div>
                      </div>

                      {/* Right: actions */}
                      <div className="flex items-center gap-2 ml-auto">
                        {e.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkFiled(e.id)}
                            className="text-xs gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Mark Filed
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemove(e.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress bar — only for pending */}
                    {e.status === "pending" && days >= 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                          <span>Grant date</span>
                          <span>{30 - days} of 30 days elapsed</span>
                          <span>30-day deadline</span>
                        </div>
                        <Progress
                          value={Math.min(100, ((30 - days) / 30) * 100)}
                          className={cn("h-1.5", styles.bar)}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Info footer */}
          <div className="flex items-start gap-2 rounded-lg border bg-muted/20 p-3">
            <Zap className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Planning tip:</strong> The 83(b) election is most
              valuable when exercised at or near grant date when FMV is low. Click{" "}
              <button onClick={() => setShowGuide(true)} className="underline text-primary font-medium">
                What is 83(b)?
              </button>{" "}
              above for a full filing guide with IRS references.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
