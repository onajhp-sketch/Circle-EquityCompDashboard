"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  PieChart,
  DollarSign,
  Clock,
  ArrowLeft,
  ArrowRight,
  User,
  Building,
} from "lucide-react"

export interface ReportOptions {
  preparedBy: string
  preparedFor: string
}

interface ReportsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerateReport: (reportType: string, options: ReportOptions) => void
  defaultPreparedFor?: string
}

const reports = [
  {
    id: "equity-summary",
    title: "Equity Compensation Summary",
    description: "Complete overview of all grants, vesting schedules, and current values",
    icon: FileText,
    type: "PDF",
  },
  {
    id: "tax-projection",
    title: "Tax Projection Report",
    description: "Estimated tax liability for various exercise scenarios",
    icon: DollarSign,
    type: "PDF",
  },
  {
    id: "vesting-calendar",
    title: "Vesting Calendar",
    description: "12-month forward view of all upcoming vest events",
    icon: Calendar,
    type: "PDF / ICS",
  },
  {
    id: "concentration-analysis",
    title: "Concentration Analysis",
    description: "Portfolio concentration risk assessment and recommendations",
    icon: PieChart,
    type: "PDF",
  },
  {
    id: "exercise-strategy",
    title: "Exercise Strategy Comparison",
    description: "Side-by-side comparison of exercise timing strategies",
    icon: TrendingUp,
    type: "PDF",
  },
  {
    id: "blackout-schedule",
    title: "Blackout Window Schedule",
    description: "Annual trading restriction periods and key dates",
    icon: Clock,
    type: "PDF",
  },
]

export function ReportsDialog({ 
  open, 
  onOpenChange, 
  onGenerateReport,
  defaultPreparedFor = "",
}: ReportsDialogProps) {
  const [step, setStep] = useState<"select" | "details">("select")
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [preparedBy, setPreparedBy] = useState("Circle Financial Planning")
  const [preparedFor, setPreparedFor] = useState(defaultPreparedFor)

  // Update preparedFor when defaultPreparedFor changes
  useState(() => {
    if (defaultPreparedFor) {
      setPreparedFor(defaultPreparedFor)
    }
  })

  const handleSelectReport = (reportId: string) => {
    setSelectedReport(reportId)
    setStep("details")
  }

  const handleBack = () => {
    setStep("select")
    setSelectedReport(null)
  }

  const handleGenerate = () => {
    if (selectedReport) {
      onGenerateReport(selectedReport, { preparedBy, preparedFor })
      onOpenChange(false)
      // Reset state for next time
      setStep("select")
      setSelectedReport(null)
    }
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset state when closing
      setStep("select")
      setSelectedReport(null)
    }
    onOpenChange(isOpen)
  }

  const selectedReportData = reports.find(r => r.id === selectedReport)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        {step === "select" ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Generate Reports</DialogTitle>
              <DialogDescription>
                Create professional reports for client presentations and planning discussions
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {reports.map((report) => {
                const Icon = report.icon
                return (
                  <Card
                    key={report.id}
                    className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                    onClick={() => handleSelectReport(report.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {report.type}
                        </Badge>
                      </div>
                      <CardTitle className="text-base">{report.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-xs">
                        {report.description}
                      </CardDescription>
                      <Button variant="ghost" size="sm" className="mt-3 w-full">
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Select
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <DialogTitle className="font-serif text-xl">Report Details</DialogTitle>
                  <DialogDescription>
                    Customize your {selectedReportData?.title}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="mt-6 space-y-6">
              {/* Selected Report Preview */}
              <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
                {selectedReportData && (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <selectedReportData.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold">{selectedReportData.title}</p>
                      <p className="text-sm text-muted-foreground">{selectedReportData.description}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="preparedFor" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Prepared For (Client Name)
                  </Label>
                  <Input
                    id="preparedFor"
                    value={preparedFor}
                    onChange={(e) => setPreparedFor(e.target.value)}
                    placeholder="Enter client name"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preparedBy" className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    Prepared By (Advisor/Firm)
                  </Label>
                  <Input
                    id="preparedBy"
                    value={preparedBy}
                    onChange={(e) => setPreparedBy(e.target.value)}
                    placeholder="Enter preparer name"
                    className="h-11"
                  />
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-end gap-3 border-t pt-4">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button 
                  onClick={handleGenerate}
                  disabled={!preparedFor.trim()}
                  className="min-w-[140px]"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
