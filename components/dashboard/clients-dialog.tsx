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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Search, 
  Plus, 
  User, 
  Building2, 
  MapPin, 
  Check, 
  ArrowLeft,
  Wallet,
  PieChart,
  FileText,
  Target,
  DollarSign,
  Percent,
  Calendar,
  Briefcase,
} from "lucide-react"

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  company: string
  companyTicker: string
  jobTitle: string
  state: string
  totalGrants: number
  totalValue: number
  status: "active" | "pending" | "archived"
  // Financial details
  netWorth: number
  liquidAssets: number
  concentrationThreshold: number
  liquidityTarget: number
  riskTolerance: "conservative" | "moderate" | "aggressive"
  taxFilingStatus: "single" | "married_joint" | "married_separate" | "head_household"
  // Grant mix
  rsuShares: number
  isoShares: number
  nsoShares: number
  esppShares: number
  // Notes
  notes: string
  createdAt: string
}

const sampleClients: Client[] = [
  {
    id: "1",
    name: "John & Jane Smith",
    email: "jsmith@email.com",
    phone: "(317) 555-1234",
    company: "Tech Corp Inc.",
    companyTicker: "TECH",
    jobTitle: "VP Engineering",
    state: "IN",
    totalGrants: 4,
    totalValue: 875000,
    status: "active",
    netWorth: 2500000,
    liquidAssets: 500000,
    concentrationThreshold: 20,
    liquidityTarget: 100000,
    riskTolerance: "moderate",
    taxFilingStatus: "married_joint",
    rsuShares: 5000,
    isoShares: 10000,
    nsoShares: 2000,
    esppShares: 500,
    notes: "Annual review scheduled for Q1. Interested in 10b5-1 plan.",
    createdAt: "2023-06-15",
  },
  {
    id: "2",
    name: "Michael Johnson",
    email: "mjohnson@email.com",
    phone: "(415) 555-5678",
    company: "Salesforce",
    companyTicker: "CRM",
    jobTitle: "Senior Director",
    state: "CA",
    totalGrants: 6,
    totalValue: 1250000,
    status: "active",
    netWorth: 4000000,
    liquidAssets: 800000,
    concentrationThreshold: 25,
    liquidityTarget: 200000,
    riskTolerance: "aggressive",
    taxFilingStatus: "single",
    rsuShares: 8000,
    isoShares: 15000,
    nsoShares: 5000,
    esppShares: 1000,
    notes: "High concentration in CRM stock. Discuss diversification strategy.",
    createdAt: "2022-11-20",
  },
  {
    id: "3",
    name: "Sarah Williams",
    email: "swilliams@email.com",
    phone: "(206) 555-9012",
    company: "Microsoft",
    companyTicker: "MSFT",
    jobTitle: "Principal PM",
    state: "WA",
    totalGrants: 3,
    totalValue: 450000,
    status: "active",
    netWorth: 1800000,
    liquidAssets: 350000,
    concentrationThreshold: 15,
    liquidityTarget: 75000,
    riskTolerance: "conservative",
    taxFilingStatus: "married_joint",
    rsuShares: 3000,
    isoShares: 0,
    nsoShares: 0,
    esppShares: 800,
    notes: "Recently promoted. New grant expected in Q2.",
    createdAt: "2024-01-10",
  },
]

interface ClientsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedClientId?: string
  onSelectClient: (client: Omit<Client, "createdAt" | "phone" | "email" | "notes" | "status" | "jobTitle" | "netWorth" | "liquidAssets" | "liquidityTarget" | "riskTolerance"> & Partial<Client>) => void
}

const defaultNewClient: Omit<Client, "id" | "createdAt"> = {
  name: "",
  email: "",
  phone: "",
  company: "",
  companyTicker: "",
  jobTitle: "",
  state: "IN",
  totalGrants: 0,
  totalValue: 0,
  status: "active",
  netWorth: 0,
  liquidAssets: 0,
  concentrationThreshold: 20,
  liquidityTarget: 0,
  riskTolerance: "moderate",
  taxFilingStatus: "married_joint",
  rsuShares: 0,
  isoShares: 0,
  nsoShares: 0,
  esppShares: 0,
  notes: "",
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
]

export function ClientsDialog({
  open,
  onOpenChange,
  selectedClientId,
  onSelectClient,
}: ClientsDialogProps) {
  const [search, setSearch] = useState("")
  const [clients, setClients] = useState<Client[]>(sampleClients)
  const [isAddingClient, setIsAddingClient] = useState(false)
  const [newClient, setNewClient] = useState(defaultNewClient)
  const [activeTab, setActiveTab] = useState("basic")

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.company.toLowerCase().includes(search.toLowerCase()) ||
      client.email.toLowerCase().includes(search.toLowerCase())
  )

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)

  const handleAddClient = () => {
    if (!newClient.name.trim()) return

    const client: Client = {
      ...newClient,
      id: `client-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
      totalGrants: (newClient.rsuShares > 0 ? 1 : 0) + 
                   (newClient.isoShares > 0 ? 1 : 0) + 
                   (newClient.nsoShares > 0 ? 1 : 0) + 
                   (newClient.esppShares > 0 ? 1 : 0),
    }

    setClients([client, ...clients])
    setNewClient(defaultNewClient)
    setIsAddingClient(false)
    setActiveTab("basic")
  }

  const handleCancel = () => {
    setNewClient(defaultNewClient)
    setIsAddingClient(false)
    setActiveTab("basic")
  }

  const updateField = <K extends keyof typeof newClient>(
    field: K,
    value: typeof newClient[K]
  ) => {
    setNewClient({ ...newClient, [field]: value })
  }

  // Add Client Form
  if (isAddingClient) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <DialogTitle className="font-serif text-xl">Add New Client</DialogTitle>
                <DialogDescription>
                  Enter client information for equity compensation planning
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="text-xs">
                <User className="mr-1.5 h-3.5 w-3.5" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="financial" className="text-xs">
                <Wallet className="mr-1.5 h-3.5 w-3.5" />
                Financial
              </TabsTrigger>
              <TabsTrigger value="grants" className="text-xs">
                <PieChart className="mr-1.5 h-3.5 w-3.5" />
                Grant Mix
              </TabsTrigger>
              <TabsTrigger value="notes" className="text-xs">
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                Notes
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 pr-4">
              <div className="py-4">
                {/* Basic Info Tab */}
                <TabsContent value="basic" className="mt-0 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          placeholder="John & Jane Smith"
                          value={newClient.name}
                          onChange={(e) => updateField("name", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="client@email.com"
                          value={newClient.email}
                          onChange={(e) => updateField("email", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          placeholder="(317) 555-1234"
                          value={newClient.phone}
                          onChange={(e) => updateField("phone", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Select
                          value={newClient.state}
                          onValueChange={(value) => updateField("state", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {US_STATES.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Employment Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company Name *</Label>
                        <Input
                          id="company"
                          placeholder="Tech Corp Inc."
                          value={newClient.company}
                          onChange={(e) => updateField("company", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ticker">Stock Ticker</Label>
                        <Input
                          id="ticker"
                          placeholder="TECH"
                          value={newClient.companyTicker}
                          onChange={(e) => updateField("companyTicker", e.target.value.toUpperCase())}
                          maxLength={5}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="title">Job Title</Label>
                        <Input
                          id="title"
                          placeholder="VP Engineering"
                          value={newClient.jobTitle}
                          onChange={(e) => updateField("jobTitle", e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Financial Tab */}
                <TabsContent value="financial" className="mt-0 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Net Worth & Liquidity
                      </CardTitle>
                      <CardDescription>
                        Used to calculate concentration risk and liquidity needs
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="netWorth">Estimated Net Worth</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="netWorth"
                            type="number"
                            placeholder="2,500,000"
                            value={newClient.netWorth || ""}
                            onChange={(e) => updateField("netWorth", parseFloat(e.target.value) || 0)}
                            className="pl-9"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="liquidAssets">Liquid Assets</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="liquidAssets"
                            type="number"
                            placeholder="500,000"
                            value={newClient.liquidAssets || ""}
                            onChange={(e) => updateField("liquidAssets", parseFloat(e.target.value) || 0)}
                            className="pl-9"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="liquidityTarget">Liquidity Target</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="liquidityTarget"
                            type="number"
                            placeholder="100,000"
                            value={newClient.liquidityTarget || ""}
                            onChange={(e) => updateField("liquidityTarget", parseFloat(e.target.value) || 0)}
                            className="pl-9"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="concentration">Concentration Threshold</Label>
                        <div className="relative">
                          <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="concentration"
                            type="number"
                            placeholder="20"
                            min={0}
                            max={100}
                            value={newClient.concentrationThreshold || ""}
                            onChange={(e) => updateField("concentrationThreshold", parseFloat(e.target.value) || 0)}
                            className="pl-9"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Planning Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="riskTolerance">Risk Tolerance</Label>
                        <Select
                          value={newClient.riskTolerance}
                          onValueChange={(value: "conservative" | "moderate" | "aggressive") => 
                            updateField("riskTolerance", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="conservative">Conservative</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="aggressive">Aggressive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="taxStatus">Tax Filing Status</Label>
                        <Select
                          value={newClient.taxFilingStatus}
                          onValueChange={(value: "single" | "married_joint" | "married_separate" | "head_household") => 
                            updateField("taxFilingStatus", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="married_joint">Married Filing Jointly</SelectItem>
                            <SelectItem value="married_separate">Married Filing Separately</SelectItem>
                            <SelectItem value="head_household">Head of Household</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Grant Mix Tab */}
                <TabsContent value="grants" className="mt-0 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <PieChart className="h-4 w-4" />
                        Equity Grant Summary
                      </CardTitle>
                      <CardDescription>
                        Enter total shares by grant type from account statements
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="rsuShares" className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">RSU</Badge>
                          Restricted Stock Units
                        </Label>
                        <Input
                          id="rsuShares"
                          type="number"
                          placeholder="5,000"
                          value={newClient.rsuShares || ""}
                          onChange={(e) => updateField("rsuShares", parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="isoShares" className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">ISO</Badge>
                          Incentive Stock Options
                        </Label>
                        <Input
                          id="isoShares"
                          type="number"
                          placeholder="10,000"
                          value={newClient.isoShares || ""}
                          onChange={(e) => updateField("isoShares", parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nsoShares" className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">NSO</Badge>
                          Non-Qualified Stock Options
                        </Label>
                        <Input
                          id="nsoShares"
                          type="number"
                          placeholder="2,000"
                          value={newClient.nsoShares || ""}
                          onChange={(e) => updateField("nsoShares", parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="esppShares" className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">ESPP</Badge>
                          Employee Stock Purchase
                        </Label>
                        <Input
                          id="esppShares"
                          type="number"
                          placeholder="500"
                          value={newClient.esppShares || ""}
                          onChange={(e) => updateField("esppShares", parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Estimated Total Value
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label htmlFor="totalValue">Current Market Value (all grants)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="totalValue"
                            type="number"
                            placeholder="875,000"
                            value={newClient.totalValue || ""}
                            onChange={(e) => updateField("totalValue", parseFloat(e.target.value) || 0)}
                            className="pl-9"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notes Tab */}
                <TabsContent value="notes" className="mt-0 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Planning Notes
                      </CardTitle>
                      <CardDescription>
                        Add any relevant notes from client meetings or account review
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Enter notes about client goals, concerns, upcoming events, or planning considerations..."
                        value={newClient.notes}
                        onChange={(e) => updateField("notes", e.target.value)}
                        className="min-h-[200px]"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Client Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select
                        value={newClient.status}
                        onValueChange={(value: "active" | "pending" | "archived") => 
                          updateField("status", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active Client</SelectItem>
                          <SelectItem value="pending">Pending / Prospect</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </ScrollArea>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 border-t pt-4">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleAddClient} disabled={!newClient.name.trim()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    )
  }

  // Client List View
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Client Directory</DialogTitle>
          <DialogDescription>
            Select a client to view their equity compensation details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Add */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setIsAddingClient(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </div>

          {/* Client List */}
          <ScrollArea className="h-[400px] rounded-lg border">
            <div className="divide-y">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => {
                    onSelectClient(client)
                    onOpenChange(false)
                  }}
                  className={`flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/50 ${
                    selectedClientId === client.id ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{client.name}</span>
                      {selectedClientId === client.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                      <Badge
                        variant={client.status === "active" ? "default" : "secondary"}
                        className={
                          client.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : ""
                        }
                      >
                        {client.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {client.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {client.state}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      {formatCurrency(client.totalValue)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {client.totalGrants} grants
                    </p>
                  </div>
                </button>
              ))}
              {filteredClients.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No clients found matching &ldquo;{search}&rdquo;
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
