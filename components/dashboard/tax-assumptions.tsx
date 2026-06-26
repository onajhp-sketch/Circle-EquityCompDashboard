"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Info, Calculator, ChevronDown, ChevronUp } from "lucide-react"
import type { TaxAssumptions as TaxAssumptionsType } from "@/lib/calculations"
import { useState } from "react"

interface TaxAssumptionsProps {
  assumptions: TaxAssumptionsType
  onChange: (assumptions: TaxAssumptionsType) => void
}

export function TaxAssumptions({ assumptions, onChange }: TaxAssumptionsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleChange = (key: keyof TaxAssumptionsType, value: string) => {
    onChange({ ...assumptions, [key]: parseFloat(value) || 0 })
  }

  const combinedRate = (assumptions.ordinaryRate + assumptions.stateRate) * 100

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Inputs</p>
            <CardTitle className="font-serif text-xl">Tax Assumptions</CardTitle>
          </div>
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Calculator className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Combined Rate */}
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Combined Marginal Rate</span>
            <Badge variant="outline" className="border-accent/40 bg-accent/10 font-mono text-accent-foreground">
              {combinedRate.toFixed(1)}%
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Federal + State for ordinary income</p>
        </div>

        {/* Core Fields */}
        <div className="space-y-4">
          {[
            { id: "ordinaryRate", label: "Federal Ordinary Rate",     suffix: "%", step: "0.01", min: "0", max: "1", prefix: "" },
            { id: "stateRate",    label: "State / Local Rate",        suffix: "%", step: "0.005", min: "0", max: "1", prefix: "" },
            { id: "ltcgRate",     label: "Long-Term Capital Gains",   suffix: "%", step: "0.01", min: "0", max: "1", prefix: "" },
            { id: "amtRate",      label: "AMT Proxy Rate (ISOs)",     suffix: "%", step: "0.01", min: "0", max: "1", prefix: "" },
            { id: "currentPrice", label: "Current Stock Price",       suffix: "",  step: "0.01", min: "0", max: "", prefix: "$" },
          ].map(({ id, label, suffix, step, min, max, prefix }) => (
            <div key={id} className="space-y-2">
              <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
              <div className="relative">
                {prefix && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{prefix}</span>
                )}
                <Input
                  id={id}
                  type="number"
                  step={step}
                  min={min}
                  max={max || undefined}
                  value={assumptions[id as keyof TaxAssumptionsType] as number}
                  onChange={(e) => handleChange(id as keyof TaxAssumptionsType, e.target.value)}
                  className={`font-mono ${prefix ? "pl-7" : "pr-8"}`}
                />
                {suffix && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{suffix}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Advanced Surtax Section */}
        <button
          className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span>Surtax &amp; FICA Settings</span>
          {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {showAdvanced && (
          <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground">
              These rates apply automatically when income exceeds the specified thresholds.
            </p>
            {[
              { id: "netInvestmentIncomeRate",     label: "NIIT Rate (3.8%)",           suffix: "%", step: "0.001", placeholder: "0.038" },
              { id: "additionalMedicareRate",      label: "Addl. Medicare Rate (0.9%)",  suffix: "%", step: "0.001", placeholder: "0.009" },
              { id: "niitThreshold",               label: "NIIT Threshold (MFJ)",        suffix: "",  step: "1000",  placeholder: "250000", prefix: "$" },
              { id: "additionalMedicareThreshold", label: "Addl. Medicare Threshold",    suffix: "",  step: "1000",  placeholder: "250000", prefix: "$" },
              { id: "otherIncome",                 label: "Other W-2/Income (for surtax)", suffix: "", step: "1000", placeholder: "0",      prefix: "$" },
            ].map(({ id, label, suffix, step, placeholder, prefix }) => (
              <div key={id} className="space-y-1.5">
                <Label htmlFor={`adv-${id}`} className="text-xs font-medium">{label}</Label>
                <div className="relative">
                  {prefix && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{prefix}</span>
                  )}
                  <Input
                    id={`adv-${id}`}
                    type="number"
                    step={step}
                    placeholder={placeholder}
                    value={(assumptions[id as keyof TaxAssumptionsType] as number) ?? ""}
                    onChange={(e) => handleChange(id as keyof TaxAssumptionsType, e.target.value)}
                    className={`h-8 font-mono text-sm ${prefix ? "pl-7" : "pr-8"}`}
                  />
                  {suffix && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="flex gap-3 rounded-lg border border-border bg-muted/30 p-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Planning note:</span> ISO calculations
            use a simplified AMT proxy. FICA is capped at the 2024 SS wage base ($168,600).
            Consult a qualified tax professional for final outcomes.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
