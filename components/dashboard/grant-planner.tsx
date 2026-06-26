"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Download,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  Pencil,
  Check,
  X,
  Plus,
  Trash2,
} from "lucide-react"
import {
  type Grant,
  type TaxAssumptions,
  type Blackout,
  type VestingSchedule,
  calculateGrant,
  isInBlackout,
  formatCurrency,
  generateId,
} from "@/lib/calculations"
import { parseExcel, parseCSV, generateCombinedTemplate } from "@/lib/excel-parser"
import { cn } from "@/lib/utils"
import React, { useRef, useState } from "react"

interface GrantPlannerProps {
  grants: Grant[]
  taxAssumptions: TaxAssumptions
  blackouts: Blackout[]
  onGrantsChange: (grants: Grant[]) => void
  primarySymbol?: string
}

function getGrantTypeBadgeClass(type: Grant["type"]) {
  const classes: Record<Grant["type"], string> = {
    RSU: "bg-emerald-100 text-emerald-800 border-emerald-200",
    NSO: "bg-blue-100 text-blue-800 border-blue-200",
    ISO: "bg-purple-100 text-purple-800 border-purple-200",
    ESPP: "bg-amber-100 text-amber-800 border-amber-200",
  }
  return classes[type]
}

function calculateVestProgress(grantDate: string, vestDate: string): number {
  if (!grantDate || !vestDate) return 0
  const grant = new Date(grantDate).getTime()
  const vest = new Date(vestDate).getTime()
  const now = Date.now()
  if (now >= vest) return 100
  if (now <= grant) return 0
  return Math.round(((now - grant) / (vest - grant)) * 100)
}

export function GrantPlanner({
  grants,
  taxAssumptions,
  blackouts,
  onGrantsChange,
  primarySymbol = "TECH",
}: GrantPlannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editGrant, setEditGrant] = useState<Grant | null>(null)

  // Calculate totals
  const totals = grants.reduce(
    (acc, grant) => {
      const calc = calculateGrant(grant, taxAssumptions)
      return {
        shares: acc.shares + grant.shares,
        income: acc.income + calc.income,
        tax: acc.tax + calc.tax,
        cash: acc.cash + calc.cash,
        afterTax: acc.afterTax + calc.afterTax,
      }
    },
    { shares: 0, income: 0, tax: 0, cash: 0, afterTax: 0 }
  )

  const handleDownloadTemplate = () => {
    const content = generateCombinedTemplate()
    const blob = new Blob([content], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "grant_import_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [showAsOfDateInput, setShowAsOfDateInput] = useState(false)
  const [csvAsOfDate, setCsvAsOfDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setUploadSuccess(null)
    
    // Validate file type first
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls") && !fileName.endsWith(".csv")) {
      setUploadError("Please upload a CSV or Excel file (.csv, .xlsx, .xls)")
      e.target.value = ""
      return
    }
    
    // Store the file and show as-of date input
    setPendingFile(file)
    setShowAsOfDateInput(true)
    e.target.value = ""
  }

  const handleConfirmUpload = async () => {
    if (!pendingFile) return

    try {
      let grants: Grant[] = []
      
      // Determine file type and parse accordingly
      const fileName = pendingFile.name.toLowerCase()
      if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        grants = await parseExcel(pendingFile)
      } else if (fileName.endsWith(".csv")) {
        const text = await pendingFile.text()
        grants = parseCSV(text)
      }
      
      if (grants.length === 0) {
        setUploadError("No valid grants found in file. Please check the format.")
        setShowAsOfDateInput(false)
        setPendingFile(null)
        return
      }

      // Add asOfDate to all imported grants
      const grantsWithAsOfDate = grants.map(grant => ({
        ...grant,
        asOfDate: csvAsOfDate,
      }))

      onGrantsChange(grantsWithAsOfDate)
      setUploadSuccess(`Successfully imported ${grants.length} grant${grants.length !== 1 ? "s" : ""} as of ${csvAsOfDate}`)
      
      // Clear success message after 5 seconds
      setTimeout(() => setUploadSuccess(null), 5000)
      
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to parse file")
    }
    
    setShowAsOfDateInput(false)
    setPendingFile(null)
  }

  const handleCancelUpload = () => {
    setShowAsOfDateInput(false)
    setPendingFile(null)
  }

  const handleStartEdit = (grant: Grant) => {
    setEditingId(grant.id)
    setEditGrant({ ...grant })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditGrant(null)
  }

  const handleSaveEdit = () => {
    if (!editGrant) return
    onGrantsChange(grants.map((g) => (g.id === editGrant.id ? editGrant : g)))
    setEditingId(null)
    setEditGrant(null)
  }

  const handleAddGrant = () => {
    const newGrant: Grant = {
      id: generateId(),
      type: "RSU",
      symbol: primarySymbol,
      shares: 0,
      strike: null,
      grantDate: new Date().toISOString().split("T")[0],
      vestDate: "",
      fmvAtVest: null,
    }
    onGrantsChange([...grants, newGrant])
    handleStartEdit(newGrant)
  }

  const handleDeleteGrant = (id: string) => {
    onGrantsChange(grants.filter((g) => g.id !== id))
  }

  return (
    <Card className="flex-1 overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-b bg-muted/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Portfolio
            </p>
            <CardTitle className="font-serif text-xl">Grant Inventory</CardTitle>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddGrant}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Grant
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Template
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Upload Status Messages */}
        {uploadError && (
          <div className="mx-4 mt-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{uploadError}</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-6 w-6 p-0"
              onClick={() => setUploadError(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {uploadSuccess && (
          <div className="mx-4 mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            <Check className="h-4 w-4 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}
        
        {/* CSV As-Of Date Input */}
        {showAsOfDateInput && (
          <div className="mx-4 mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex flex-col gap-3">
              <div>
                <p className="font-medium text-sm">Set Data As-Of Date</p>
                <p className="text-xs text-muted-foreground">
                  Enter the date this grant data was captured. This helps track cost basis and lot timing for tax purposes.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="date"
                  value={csvAsOfDate}
                  onChange={(e) => setCsvAsOfDate(e.target.value)}
                  className="w-40"
                />
                <Button size="sm" onClick={handleConfirmUpload} className="gap-1">
                  <Check className="h-3.5 w-3.5" />
                  Import
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelUpload} className="gap-1">
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                File: {pendingFile?.name}
              </p>
            </div>
          </div>
        )}
        
        {/* Grant Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Symbol</TableHead>
                <TableHead className="text-right font-semibold">Shares</TableHead>
                <TableHead className="text-right font-semibold">Strike</TableHead>
                <TableHead className="font-semibold">Progress</TableHead>
                <TableHead className="text-right font-semibold">FMV</TableHead>
                <TableHead className="text-right font-semibold">Income</TableHead>
                <TableHead className="text-right font-semibold">Tax</TableHead>
                <TableHead className="text-right font-semibold">After-Tax</TableHead>
                <TableHead className="text-center font-semibold">Status</TableHead>
                <TableHead className="w-24 text-center font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grants.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="py-12 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                      <div>
                        <p className="font-medium">No grants loaded</p>
                        <p className="text-sm">
                          Click Add Grant, upload a CSV, or Reset Sample to load data
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                grants.map((grant) => {
                  const calc = calculateGrant(grant, taxAssumptions)
                  const inBlackout = isInBlackout(grant.vestDate, blackouts)
                  const vestProgress = calculateVestProgress(
                    grant.grantDate,
                    grant.vestDate
                  )
                  const isEditing = editingId === grant.id

                  if (isEditing && editGrant) {
                    return (
                      <React.Fragment key={grant.id}>
                      <TableRow className="bg-primary/5 border-b-0">
                        <TableCell>
                          <Select
                            value={editGrant.type}
                            onValueChange={(v) =>
                              setEditGrant({ ...editGrant, type: v as Grant["type"] })
                            }
                          >
                            <SelectTrigger className="h-8 w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="RSU">RSU</SelectItem>
                              <SelectItem value="NSO">NSO</SelectItem>
                              <SelectItem value="ISO">ISO</SelectItem>
                              <SelectItem value="ESPP">ESPP</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={editGrant.symbol || ""}
                            onChange={(e) =>
                              setEditGrant({
                                ...editGrant,
                                symbol: e.target.value.toUpperCase(),
                              })
                            }
                            className="h-8 w-20 font-mono text-xs uppercase"
                            placeholder={primarySymbol}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={editGrant.shares}
                            onChange={(e) =>
                              setEditGrant({
                                ...editGrant,
                                shares: parseInt(e.target.value) || 0,
                              })
                            }
                            className="h-8 w-20 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={editGrant.strike ?? ""}
                            onChange={(e) =>
                              setEditGrant({
                                ...editGrant,
                                strike: e.target.value ? parseFloat(e.target.value) : null,
                              })
                            }
                            className="h-8 w-20 text-right"
                            placeholder="—"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={editGrant.vestDate}
                            onChange={(e) =>
                              setEditGrant({ ...editGrant, vestDate: e.target.value })
                            }
                            className="h-8 w-32"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={editGrant.fmvAtVest ?? ""}
                            onChange={(e) =>
                              setEditGrant({
                                ...editGrant,
                                fmvAtVest: e.target.value
                                  ? parseFloat(e.target.value)
                                  : null,
                              })
                            }
                            className="h-8 w-20 text-right"
                            placeholder="Current"
                          />
                        </TableCell>
                        <TableCell colSpan={4} />
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-emerald-600"
                              onClick={handleSaveEdit}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-600"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {/* Expanded Edit Panel for Vesting Schedule & Cost Basis */}
                      <TableRow key={`${grant.id}-expanded`} className="bg-primary/5">
                        <TableCell colSpan={11} className="py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
                            {/* Vesting Schedule */}
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-muted-foreground">Vesting Frequency</label>
                              <Select
                                value={editGrant.vestingSchedule?.frequency || "quarterly"}
                                onValueChange={(v) =>
                                  setEditGrant({
                                    ...editGrant,
                                    vestingSchedule: {
                                      ...editGrant.vestingSchedule,
                                      frequency: v as VestingSchedule["frequency"],
                                      totalMonths: editGrant.vestingSchedule?.totalMonths || 48,
                                      cliffMonths: editGrant.vestingSchedule?.cliffMonths || 12,
                                    },
                                  })
                                }
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                  <SelectItem value="quarterly">Quarterly</SelectItem>
                                  <SelectItem value="annual">Annual</SelectItem>
                                  <SelectItem value="cliff">Cliff (one-time)</SelectItem>
                                  <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-muted-foreground">Total Vesting (months)</label>
                              <Input
                                type="number"
                                value={editGrant.vestingSchedule?.totalMonths ?? 48}
                                onChange={(e) =>
                                  setEditGrant({
                                    ...editGrant,
                                    vestingSchedule: {
                                      ...editGrant.vestingSchedule,
                                      frequency: editGrant.vestingSchedule?.frequency || "quarterly",
                                      totalMonths: parseInt(e.target.value) || 48,
                                      cliffMonths: editGrant.vestingSchedule?.cliffMonths || 12,
                                    },
                                  })
                                }
                                className="h-8"
                                placeholder="48"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-muted-foreground">Cliff Period (months)</label>
                              <Input
                                type="number"
                                value={editGrant.vestingSchedule?.cliffMonths ?? 12}
                                onChange={(e) =>
                                  setEditGrant({
                                    ...editGrant,
                                    vestingSchedule: {
                                      ...editGrant.vestingSchedule,
                                      frequency: editGrant.vestingSchedule?.frequency || "quarterly",
                                      totalMonths: editGrant.vestingSchedule?.totalMonths || 48,
                                      cliffMonths: parseInt(e.target.value) || 0,
                                    },
                                  })
                                }
                                className="h-8"
                                placeholder="12"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-muted-foreground">Cost Basis / Share</label>
                              <Input
                                type="number"
                                step="0.01"
                                value={editGrant.costBasisPerShare ?? ""}
                                onChange={(e) =>
                                  setEditGrant({
                                    ...editGrant,
                                    costBasisPerShare: e.target.value ? parseFloat(e.target.value) : undefined,
                                  })
                                }
                                className="h-8"
                                placeholder="Auto from FMV"
                              />
                            </div>
                          </div>
                          <div className="mt-3 px-2 text-xs text-muted-foreground">
                            <p>Vesting schedule helps determine cost basis for individual share lots. Cost basis defaults to FMV at vest if not specified.</p>
                            {editGrant.asOfDate && (
                              <p className="mt-1">Data as of: <span className="font-medium">{editGrant.asOfDate}</span></p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      </React.Fragment>
                    )
                  }

                  return (
                    <TableRow
                      key={grant.id}
                      className="transition-colors hover:bg-muted/20"
                    >
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-semibold",
                            getGrantTypeBadgeClass(grant.type)
                          )}
                        >
                          {grant.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-medium text-muted-foreground">
                        {grant.symbol || primarySymbol}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {grant.shares.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {grant.strike !== null
                          ? formatCurrency(grant.strike, 2)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={vestProgress} className="h-2 w-16" />
                          <span className="text-xs text-muted-foreground">
                            {vestProgress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(calc.fmv, 2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(calc.income)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {formatCurrency(calc.tax)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono font-semibold",
                          calc.afterTax >= 0 ? "text-emerald-700" : "text-red-600"
                        )}
                      >
                        {formatCurrency(calc.afterTax)}
                      </TableCell>
                      <TableCell className="text-center">
                        {inBlackout ? (
                          <Badge
                            variant="destructive"
                            className="text-xs font-medium"
                          >
                            Blackout
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-800 text-xs font-medium hover:bg-emerald-100">
                            Open
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={() => handleStartEdit(grant)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteGrant(grant.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
            {grants.length > 0 && (
              <TableFooter>
                <TableRow className="bg-primary/5 font-semibold">
                  <TableCell>Totals</TableCell>
                  <TableCell />
                  <TableCell className="text-right font-mono">
                    {totals.shares.toLocaleString()}
                  </TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totals.income)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-red-600">
                    {formatCurrency(totals.tax)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-emerald-700">
                    {formatCurrency(totals.afterTax)}
                  </TableCell>
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
