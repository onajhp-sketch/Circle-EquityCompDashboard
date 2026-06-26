"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Trash2, Shield, Calendar, AlertTriangle } from "lucide-react"
import { useState } from "react"
import type { Blackout } from "@/lib/calculations"
import { generateId } from "@/lib/calculations"
import { cn } from "@/lib/utils"

interface BlackoutWindowsProps {
  blackouts: Blackout[]
  onChange: (blackouts: Blackout[]) => void
}

function isActiveBlackout(startDate: string, endDate: string): boolean {
  const now = new Date()
  return now >= new Date(startDate) && now <= new Date(endDate)
}

function isUpcomingBlackout(startDate: string): boolean {
  const now = new Date()
  const start = new Date(startDate)
  const daysUntil = (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return daysUntil > 0 && daysUntil <= 30
}

function formatDateRange(startDate: string, endDate: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
  return `${new Date(startDate).toLocaleDateString("en-US", opts)} – ${new Date(endDate).toLocaleDateString("en-US", opts)}`
}

export function BlackoutWindows({ blackouts, onChange }: BlackoutWindowsProps) {
  const [newBlackout, setNewBlackout] = useState({ startDate: "", endDate: "", reason: "" })

  const handleAdd = () => {
    if (!newBlackout.startDate || !newBlackout.endDate) return
    if (new Date(newBlackout.endDate) < new Date(newBlackout.startDate)) {
      alert("End date must be on or after start date.")
      return
    }
    const blackout: Blackout = {
      id: generateId(),
      startDate: newBlackout.startDate,
      endDate:   newBlackout.endDate,
      reason:    newBlackout.reason,
    }
    onChange([...blackouts, blackout])
    setNewBlackout({ startDate: "", endDate: "", reason: "" })
  }

  const handleRemove = (id: string) => onChange(blackouts.filter((b) => b.id !== id))

  const activeBlackouts   = blackouts.filter((b) => isActiveBlackout(b.startDate, b.endDate))
  const upcomingBlackouts = blackouts.filter(
    (b) => !isActiveBlackout(b.startDate, b.endDate) && isUpcomingBlackout(b.startDate)
  )

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className={cn("border-2", activeBlackouts.length > 0 ? "border-red-200 bg-red-50/50" : "border-emerald-200 bg-emerald-50/50")}>
          <CardContent className="flex items-center gap-4 p-5">
            <div className={cn("rounded-full p-3", activeBlackouts.length > 0 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600")}>
              {activeBlackouts.length > 0 ? <AlertTriangle className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
            </div>
            <div className="flex-1">
              <h3 className="font-serif text-lg font-semibold">
                {activeBlackouts.length > 0 ? "Trading Restricted" : "Trading Window Open"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeBlackouts.length > 0
                  ? `${activeBlackouts.length} active blackout window(s) in effect`
                  : "No active trading restrictions at this time"}
              </p>
            </div>
            {activeBlackouts.length > 0 && <Badge variant="destructive">Active</Badge>}
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-200 bg-amber-50/50">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-full bg-amber-100 p-3 text-amber-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif text-lg font-semibold">Upcoming Windows</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {upcomingBlackouts.length > 0
                  ? `${upcomingBlackouts.length} blackout(s) starting within 30 days`
                  : "No blackouts scheduled in the next 30 days"}
              </p>
            </div>
            {upcomingBlackouts.length > 0 && (
              <Badge className="bg-amber-100 text-amber-800">{upcomingBlackouts.length} upcoming</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Compliance Awareness</p>
              <CardTitle className="font-serif text-xl">Trading Blackout Windows</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Form */}
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="boStart">Start Date</Label>
                <Input
                  id="boStart"
                  type="date"
                  value={newBlackout.startDate}
                  onChange={(e) => setNewBlackout({ ...newBlackout, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="boEnd">End Date</Label>
                <Input
                  id="boEnd"
                  type="date"
                  value={newBlackout.endDate}
                  min={newBlackout.startDate}
                  onChange={(e) => setNewBlackout({ ...newBlackout, endDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="boReason">Reason (optional)</Label>
                <Input
                  id="boReason"
                  type="text"
                  placeholder="e.g., Q2 earnings window"
                  value={newBlackout.reason}
                  onChange={(e) => setNewBlackout({ ...newBlackout, reason: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAdd} className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Add Window
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Date Range</TableHead>
                  <TableHead className="font-semibold">Reason</TableHead>
                  <TableHead className="w-[100px] text-right font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blackouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-3">
                        <Calendar className="h-8 w-8 text-muted-foreground/50" />
                        <div>
                          <p className="font-medium">No blackout windows configured</p>
                          <p className="text-sm">Add quarterly earnings blackouts or other trading restrictions</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  blackouts.map((b) => {
                    const active   = isActiveBlackout(b.startDate, b.endDate)
                    const upcoming = isUpcomingBlackout(b.startDate)
                    return (
                      <TableRow key={b.id} className={cn("transition-colors", active && "bg-red-50/50")}>
                        <TableCell>
                          {active ? (
                            <Badge variant="destructive">Active</Badge>
                          ) : upcoming ? (
                            <Badge className="bg-amber-100 text-amber-800">Upcoming</Badge>
                          ) : (
                            <Badge variant="outline">Scheduled</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{formatDateRange(b.startDate, b.endDate)}</TableCell>
                        <TableCell className="text-sm">{b.reason || "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(b.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
