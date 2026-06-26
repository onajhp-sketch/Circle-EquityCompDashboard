"use client"

import { Shield } from "lucide-react"

export function ComplianceDisclaimer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Logo */}
          <img 
            src="/images/circle-logo-horizontal.png" 
            alt="Circle Financial Planning - Boutique Care. Institutional Insight." 
            className="h-24 w-auto max-w-full object-contain sm:h-28 md:h-32"
          />
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Important Disclosure
            </span>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            This dashboard is an educational planning tool provided by Circle
            Financial Planning, Inc. and is intended solely for informational
            purposes. It does not constitute tax, legal, or investment advice.
            Calculations shown are estimates based on user inputs and simplified
            assumptions. Actual tax outcomes depend on individual circumstances,
            applicable tax law, grant-specific plan documents, and other factors.
            Please consult with qualified tax, legal, and financial professionals
            before making any decisions regarding your equity compensation.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span>&copy; {new Date().getFullYear()} Circle Financial Planning, Inc.</span>
            <span className="hidden sm:inline">•</span>
            <span>Indianapolis, IN</span>
            <span className="hidden sm:inline">•</span>
            <a href="#" className="underline-offset-2 hover:underline">
              Privacy Policy
            </a>
            <span className="hidden sm:inline">•</span>
            <a href="#" className="underline-offset-2 hover:underline">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
