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
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Bell, Palette, Shield, Database } from "lucide-react"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [notifications, setNotifications] = useState({
    vestReminders: true,
    blackoutAlerts: true,
    isoDeadlines: true,
    emailDigest: false,
  })

  const [display, setDisplay] = useState({
    theme: "light",
    compactMode: false,
    showTrends: true,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Settings</DialogTitle>
          <DialogDescription>
            Customize your dashboard preferences and notification settings
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="notifications" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="display" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Display</span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Compliance</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Data</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notification Preferences</CardTitle>
                <CardDescription>
                  Choose which alerts you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="vest-reminders">Vest Reminders</Label>
                    <p className="text-xs text-muted-foreground">
                      Get notified 14, 7, and 1 day before vest dates
                    </p>
                  </div>
                  <Switch
                    id="vest-reminders"
                    checked={notifications.vestReminders}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, vestReminders: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="blackout-alerts">Blackout Window Alerts</Label>
                    <p className="text-xs text-muted-foreground">
                      Alerts before trading blackout periods begin
                    </p>
                  </div>
                  <Switch
                    id="blackout-alerts"
                    checked={notifications.blackoutAlerts}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, blackoutAlerts: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="iso-deadlines">ISO Exercise Deadlines</Label>
                    <p className="text-xs text-muted-foreground">
                      Warnings for ISO expiration and 90-day rules
                    </p>
                  </div>
                  <Switch
                    id="iso-deadlines"
                    checked={notifications.isoDeadlines}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, isoDeadlines: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-digest">Weekly Email Digest</Label>
                    <p className="text-xs text-muted-foreground">
                      Summary of upcoming events sent every Monday
                    </p>
                  </div>
                  <Switch
                    id="email-digest"
                    checked={notifications.emailDigest}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, emailDigest: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="display" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Display Settings</CardTitle>
                <CardDescription>
                  Customize the look and feel of your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <p className="text-xs text-muted-foreground">
                      Choose your preferred color scheme
                    </p>
                  </div>
                  <Select
                    value={display.theme}
                    onValueChange={(value) => setDisplay({ ...display, theme: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="compact-mode">Compact Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      Reduce spacing for more data density
                    </p>
                  </div>
                  <Switch
                    id="compact-mode"
                    checked={display.compactMode}
                    onCheckedChange={(checked) =>
                      setDisplay({ ...display, compactMode: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-trends">Show Trend Indicators</Label>
                    <p className="text-xs text-muted-foreground">
                      Display percentage changes on KPI cards
                    </p>
                  </div>
                  <Switch
                    id="show-trends"
                    checked={display.showTrends}
                    onCheckedChange={(checked) =>
                      setDisplay({ ...display, showTrends: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Compliance Settings</CardTitle>
                <CardDescription>
                  Configure compliance and regulatory preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firm-name">Firm Name</Label>
                  <Input id="firm-name" defaultValue="Circle Financial Planning" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crd-number">CRD Number</Label>
                  <Input id="crd-number" placeholder="Enter CRD #" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disclosure">Custom Disclosure Language</Label>
                  <Input id="disclosure" placeholder="Additional disclosure text..." />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Data Management</CardTitle>
                <CardDescription>
                  Import, export, and manage your data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Export All Data</p>
                    <p className="text-xs text-muted-foreground">
                      Download all client and grant data as CSV
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Export
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Import Data</p>
                    <p className="text-xs text-muted-foreground">
                      Upload data from another system
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Import
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-destructive">Clear All Data</p>
                    <p className="text-xs text-muted-foreground">
                      Remove all grants and settings (cannot be undone)
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
