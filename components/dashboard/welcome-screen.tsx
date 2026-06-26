"use client"

import { Button } from "@/components/ui/button"
import { Users, Upload, ArrowRight, BarChart3, Shield, FileText } from "lucide-react"
import Image from "next/image"

interface WelcomeScreenProps {
  onOpenClients: () => void
  onOpenSettings: () => void
}

export function WelcomeScreen({ onOpenClients, onOpenSettings }: WelcomeScreenProps) {
  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-6 py-16">
      {/* Logo */}
      <div className="mb-10 flex flex-col items-center gap-4">
        <Image
          src="/images/circle-logo-horizontal.png"
          alt="Circle Financial Planning"
          width={280}
          height={80}
          className="h-auto w-64 object-contain"
          priority
        />
        <div className="h-px w-48 bg-gradient-to-r from-transparent via-[#c9a227] to-transparent" />
        <p className="text-center font-serif text-lg italic text-muted-foreground">
          Boutique Care. Institutional Insight.
        </p>
      </div>

      {/* Headline */}
      <div className="mb-12 text-center">
        <h1 className="font-serif text-3xl font-bold text-primary sm:text-4xl">
          Equity Compensation Dashboard
        </h1>
        <p className="mt-3 max-w-xl text-center text-muted-foreground">
          To get started, load an existing client profile or create a new one.
          All grant data, tax projections, and reports will populate automatically.
        </p>
      </div>

      {/* Action Cards */}
      <div className="welcome-actions mb-14 grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        {/* Load Client */}
        <button
          onClick={onOpenClients}
          className="group flex flex-col items-start gap-4 rounded-2xl border-2 border-border bg-card p-6 text-left shadow-sm transition-all hover:border-primary hover:shadow-md"
        >
          <div className="rounded-xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="font-serif text-lg font-semibold text-foreground">Load a Client</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Select from your saved client roster to load their grants, profile, and planning data.
            </p>
          </div>
          <div className="mt-auto flex items-center gap-1.5 text-sm font-medium text-primary">
            Open client list
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </button>

        {/* Upload Data */}
        <button
          onClick={onOpenClients}
          className="group flex flex-col items-start gap-4 rounded-2xl border-2 border-border bg-card p-6 text-left shadow-sm transition-all hover:border-[#c9a227] hover:shadow-md"
        >
          <div className="rounded-xl bg-[#c9a227]/10 p-3 text-[#c9a227] transition-colors group-hover:bg-[#c9a227] group-hover:text-white">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <p className="font-serif text-lg font-semibold text-foreground">Import Grant Data</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload a CSV or Excel file with grant details to populate the dashboard instantly.
            </p>
          </div>
          <div className="mt-auto flex items-center gap-1.5 text-sm font-medium text-[#c9a227]">
            Create new client
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </button>
      </div>

      {/* Feature Highlights */}
      <div className="w-full max-w-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            What's inside
          </p>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: BarChart3,
              title: "Tax Projections",
              desc: "RSU, ISO, NSO & ESPP calculations with FICA, NIIT, and AMT modeling",
            },
            {
              icon: Shield,
              title: "Strategy Analysis",
              desc: "Monte Carlo simulations, scenario comparison, and tax-lot optimization",
            },
            {
              icon: FileText,
              title: "Branded Reports",
              desc: "Export professional PDF reports with Circle Financial Planning branding",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-3 rounded-xl border bg-muted/20 p-4"
            >
              <div className="mt-0.5 rounded-lg bg-primary/10 p-1.5 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 flex flex-col items-center gap-1 text-center">
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-[#c9a227] to-transparent" />
        <p className="mt-3 text-xs text-muted-foreground">
          Circle Financial Planning, Inc. · 317-841-0370 · circle@moneyconcepts.com
        </p>
        <p className="text-xs text-muted-foreground">
          All securities through Money Concepts Capital Corp. Member FINRA/SIPC.
        </p>
      </div>
    </div>
  )
}
