"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  Bell,
  Settings,
  User,
  LogOut,
  HelpCircle,
  RotateCcw,
  Calendar,
  Download,
  ChevronDown,
  Building2,
} from "lucide-react"

interface UserInfo {
  name: string
  firmName: string
}

interface HeaderProps {
  onResetSample: () => void
  onExportCalendar: () => void
  onExportPDF: () => void
  onNavigate: (tab: string) => void
  onOpenClients: () => void
  onOpenReports: () => void
  onOpenSettings: () => void
  onLogout: () => void
  activeTab?: string
  user?: UserInfo | null
}

export function Header({ 
  onResetSample, 
  onExportCalendar, 
  onExportPDF,
  onNavigate,
  onOpenClients,
  onOpenReports,
  onOpenSettings,
  onLogout,
  activeTab,
  user,
}: HeaderProps) {
  return (
    <header>
      {/* Sticky Navigation Bar */}
      <div className="sticky top-0 z-50 border-b border-border/40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto max-w-7xl px-6">
          {/* Top Nav Bar */}
          <div className="flex h-14 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-semibold leading-tight text-foreground">
                Circle Financial Planning
              </h1>
              <p className="text-xs text-muted-foreground">Indianapolis, IN</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden items-center gap-1 md:flex">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onNavigate("planner")}
              className={activeTab === "planner" ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground"}
            >
              Dashboard
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onOpenClients}
              className="text-muted-foreground hover:text-foreground"
            >
              Clients
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onOpenReports}
              className="text-muted-foreground hover:text-foreground"
            >
              Reports
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onNavigate("education")}
              className={activeTab === "education" ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground"}
            >
              Resources
            </Button>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-accent p-0 text-xs text-accent-foreground">
                    3
                  </Badge>
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                  <span className="font-medium">RSU vest approaching</span>
                  <span className="text-xs text-muted-foreground">
                    Client JD&apos;s 1,000 RSU vest date is in 14 days
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                  <span className="font-medium">Blackout window starting</span>
                  <span className="text-xs text-muted-foreground">
                    Q2 earnings blackout begins April 1, 2026
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                  <span className="font-medium">ISO exercise deadline</span>
                  <span className="text-xs text-muted-foreground">
                    Client SM has ISO expiring in 60 days
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings */}
            <Button variant="ghost" size="icon" onClick={onOpenSettings}>
              <Settings className="h-5 w-5 text-muted-foreground" />
              <span className="sr-only">Settings</span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 pl-2 pr-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="hidden text-sm font-medium lg:inline-block">
                    {user?.name || "Guest"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.name || "Guest"}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {user?.firmName || "Circle Financial Planning"}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onOpenSettings}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        </div>
      </div>

      {/* Hero Section - Non-sticky, scrolls with content */}
      <div className="relative bg-gradient-to-br from-primary via-primary to-[oklch(0.18_0.05_250)]">
        {/* Decorative accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Title & Description */}
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="font-serif text-xl font-semibold text-primary-foreground lg:text-2xl">
                  Client Dashboard
                </h2>
                <span className="hidden text-xs font-medium uppercase tracking-wider text-primary-foreground/40 sm:inline">
                  Equity Compensation Planning
                </span>
              </div>
              <p className="max-w-lg text-xs text-primary-foreground/60 lg:text-sm">
                RSUs, ISOs, NSOs, ESPPs - exercise strategy, blackout windows, and tax planning
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onResetSample}
                className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Reset
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onExportCalendar}
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Calendar className="mr-1.5 h-3.5 w-3.5" />
                Calendar
              </Button>
              <Button
                size="sm"
                onClick={onExportPDF}
                className="bg-accent text-accent-foreground shadow-md shadow-accent/25 hover:bg-accent/90"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
