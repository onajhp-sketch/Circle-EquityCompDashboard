"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { User, MapPin, Building2, Save, Plus, ChevronDown, Users, X } from "lucide-react"
import { useState, useEffect } from "react"

interface ClientProfile {
  id: string
  name: string
  company: string
  state: string
  filingStatus: "single" | "married" | "head_of_household" | "head_of_household"
}

interface StatePreset {
  code: string
  name: string
  taxRate: number
}

// Full 50-state + DC tax rate list sourced from calculations.ts
const statePresets: StatePreset[] = [
  { code: "AL", name: "Alabama",              taxRate: 0.05    },
  { code: "AK", name: "Alaska",               taxRate: 0       },
  { code: "AZ", name: "Arizona",              taxRate: 0.025   },
  { code: "AR", name: "Arkansas",             taxRate: 0.047   },
  { code: "CA", name: "California",           taxRate: 0.133   },
  { code: "CO", name: "Colorado",             taxRate: 0.044   },
  { code: "CT", name: "Connecticut",          taxRate: 0.0699  },
  { code: "DE", name: "Delaware",             taxRate: 0.066   },
  { code: "FL", name: "Florida",              taxRate: 0       },
  { code: "GA", name: "Georgia",              taxRate: 0.0549  },
  { code: "HI", name: "Hawaii",               taxRate: 0.11    },
  { code: "ID", name: "Idaho",                taxRate: 0.058   },
  { code: "IL", name: "Illinois",             taxRate: 0.0495  },
  { code: "IN", name: "Indiana",              taxRate: 0.0323  },
  { code: "IA", name: "Iowa",                 taxRate: 0.06    },
  { code: "KS", name: "Kansas",               taxRate: 0.057   },
  { code: "KY", name: "Kentucky",             taxRate: 0.045   },
  { code: "LA", name: "Louisiana",            taxRate: 0.0425  },
  { code: "ME", name: "Maine",                taxRate: 0.0715  },
  { code: "MD", name: "Maryland",             taxRate: 0.0575  },
  { code: "MA", name: "Massachusetts",        taxRate: 0.05    },
  { code: "MI", name: "Michigan",             taxRate: 0.0425  },
  { code: "MN", name: "Minnesota",            taxRate: 0.0985  },
  { code: "MS", name: "Mississippi",          taxRate: 0.05    },
  { code: "MO", name: "Missouri",             taxRate: 0.048   },
  { code: "MT", name: "Montana",              taxRate: 0.0675  },
  { code: "NE", name: "Nebraska",             taxRate: 0.0684  },
  { code: "NV", name: "Nevada",               taxRate: 0       },
  { code: "NH", name: "New Hampshire",        taxRate: 0       },
  { code: "NJ", name: "New Jersey",           taxRate: 0.1075  },
  { code: "NM", name: "New Mexico",           taxRate: 0.059   },
  { code: "NY", name: "New York",             taxRate: 0.109   },
  { code: "NC", name: "North Carolina",       taxRate: 0.0475  },
  { code: "ND", name: "North Dakota",         taxRate: 0.025   },
  { code: "OH", name: "Ohio",                 taxRate: 0.0399  },
  { code: "OK", name: "Oklahoma",             taxRate: 0.0475  },
  { code: "OR", name: "Oregon",               taxRate: 0.099   },
  { code: "PA", name: "Pennsylvania",         taxRate: 0.0307  },
  { code: "RI", name: "Rhode Island",         taxRate: 0.0599  },
  { code: "SC", name: "South Carolina",       taxRate: 0.07    },
  { code: "SD", name: "South Dakota",         taxRate: 0       },
  { code: "TN", name: "Tennessee",            taxRate: 0       },
  { code: "TX", name: "Texas",                taxRate: 0       },
  { code: "UT", name: "Utah",                 taxRate: 0.0485  },
  { code: "VT", name: "Vermont",              taxRate: 0.0875  },
  { code: "VA", name: "Virginia",             taxRate: 0.0575  },
  { code: "WA", name: "Washington",           taxRate: 0       },
  { code: "WV", name: "West Virginia",        taxRate: 0.065   },
  { code: "WI", name: "Wisconsin",            taxRate: 0.0765  },
  { code: "WY", name: "Wyoming",              taxRate: 0       },
  { code: "DC", name: "Washington D.C.",      taxRate: 0.1075  },
]

interface SavedClient {
  id: string
  name: string
  company: string
  companyTicker: string
  state: string
  rsuShares?: number
  isoShares?: number
  nsoShares?: number
  esppShares?: number
  taxFilingStatus?: string
}

interface ClientProfileSelectorProps {
  profile: ClientProfile | null
  onProfileChange: (profile: ClientProfile) => void
  onStateRateChange: (rate: number) => void
  onSelectSavedClient?: (client: SavedClient) => void
  onClearProfile?: () => void
}

export function ClientProfileSelector({
  profile,
  onProfileChange,
  onStateRateChange,
  onSelectSavedClient,
  onClearProfile,
}: ClientProfileSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editProfile, setEditProfile] = useState<ClientProfile>(
    profile || {
      id: "1",
      name: "",
      company: "",
      state: "IN",
      filingStatus: "married",
    }
  )
  const [savedClients, setSavedClients] = useState<SavedClient[]>([])

  // Load saved clients from localStorage and refresh periodically
  useEffect(() => {
    const loadClients = () => {
      const stored = localStorage.getItem("circle_clients")
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setSavedClients(parsed)
        } catch {
          // Ignore parse errors
        }
      }
    }
    
    loadClients()
    
    // Listen for storage changes (when clients are added in another component)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "circle_clients") {
        loadClients()
      }
    }
    
    window.addEventListener("storage", handleStorageChange)
    
    // Also refresh on focus (for same-tab updates)
    const handleFocus = () => loadClients()
    window.addEventListener("focus", handleFocus)
    
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("focus", handleFocus)
    }
  }, [])

  const handleSelectSavedClient = (clientId: string) => {
    const client = savedClients.find((c) => c.id === clientId)
    if (client && onSelectSavedClient) {
      onSelectSavedClient(client)
    }
  }

  const handleSave = () => {
    onProfileChange(editProfile)
    const statePreset = statePresets.find((s) => s.code === editProfile.state)
    if (statePreset) {
      onStateRateChange(statePreset.taxRate)
    }
    setIsOpen(false)
  }

  const handleStateChange = (state: string) => {
    setEditProfile({ ...editProfile, state })
    const statePreset = statePresets.find((s) => s.code === state)
    if (statePreset) {
      onStateRateChange(statePreset.taxRate)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Client
                </p>
                <CardTitle className="font-serif text-lg">Profile</CardTitle>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {profile?.name && onClearProfile && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={onClearProfile}
                  title="Clear client profile and associated data"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear
                </Button>
              )}
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                  {profile?.name ? "Edit" : <><Plus className="mr-1 h-3 w-3" /> Add</>}
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif">Client Profile</DialogTitle>
                <DialogDescription>Enter client information for equity compensation planning</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Client Name</label>
                  <Input
                    value={editProfile.name}
                    onChange={(e) =>
                      setEditProfile({ ...editProfile, name: e.target.value })
                    }
                    placeholder="John & Jane Smith"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company</label>
                  <Input
                    value={editProfile.company}
                    onChange={(e) =>
                      setEditProfile({ ...editProfile, company: e.target.value })
                    }
                    placeholder="Tech Corp Inc."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">State of Residence</label>
                  <Select
                    value={editProfile.state}
                    onValueChange={handleStateChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statePresets.map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.name} ({(state.taxRate * 100).toFixed(2)}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Filing Status</label>
                  <Select
                    value={editProfile.filingStatus}
                    onValueChange={(v) =>
                      setEditProfile({
                        ...editProfile,
                        filingStatus: v as ClientProfile["filingStatus"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married Filing Jointly</SelectItem>
                      <SelectItem value="head_of_household">Head of Household</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSave} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Save Profile
                </Button>
              </div>
            </DialogContent>
            </Dialog>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {profile ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{profile.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{profile.company}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="text-xs">
                {statePresets.find((s) => s.code === profile.state)?.name || profile.state}
              </Badge>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No client profile set. Select or add a client above.
          </p>
        )}
      </CardContent>
      
      {/* Client Selection Dropdown - Moved to bottom of card */}
      <div className="px-6 pb-4">
        <Select
            value={profile?.id || ""}
            onValueChange={(value) => {
              if (value === "add-new") {
                setIsOpen(true)
              } else if (value) {
                handleSelectSavedClient(value)
              }
            }}
          >
            <SelectTrigger className="h-9 w-full text-xs">
              <Users className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Select a client..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="add-new" className="text-primary">
                <div className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Add New Client</span>
                </div>
              </SelectItem>
              {savedClients.length > 0 && (
                <div className="my-1 border-t" />
              )}
              {savedClients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{client.name}</span>
                    <span className="text-[10px] text-muted-foreground">{client.company}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
      </div>
    </Card>
  )
}

export type { ClientProfile }
