"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText,
  Plus,
  Trash2,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import { useState } from "react"
import { generateId } from "@/lib/calculations"
import { cn } from "@/lib/utils"

interface PlanningNote {
  id: string
  type: "10b5-1" | "general" | "tax" | "compliance"
  content: string
  createdAt: string
  status: "active" | "resolved" | "pending"
}

const noteTypes = {
  "10b5-1": { label: "10b5-1 Plan", icon: Shield, color: "bg-blue-100 text-blue-700 border-blue-200" },
  general: { label: "General", icon: FileText, color: "bg-slate-100 text-slate-700 border-slate-200" },
  tax: { label: "Tax Planning", icon: AlertTriangle, color: "bg-amber-100 text-amber-700 border-amber-200" },
  compliance: { label: "Compliance", icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
}

export function PlanningNotes() {
  const [notes, setNotes] = useState<PlanningNote[]>([
    {
      id: "1",
      type: "10b5-1",
      content: "Client considering 10b5-1 plan adoption in Q4. Review blackout calendar and coordinate with legal for plan establishment during next open window.",
      createdAt: "2024-03-15",
      status: "active",
    },
    {
      id: "2",
      type: "tax",
      content: "ISO holding period ends March 2025. Discuss qualifying disposition strategy vs. early sale for diversification.",
      createdAt: "2024-03-10",
      status: "pending",
    },
  ])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newNote, setNewNote] = useState({
    type: "general" as PlanningNote["type"],
    content: "",
  })

  const handleAddNote = () => {
    if (!newNote.content.trim()) return
    const note: PlanningNote = {
      id: generateId(),
      type: newNote.type,
      content: newNote.content,
      createdAt: new Date().toISOString().split("T")[0],
      status: "active",
    }
    setNotes([note, ...notes])
    setNewNote({ type: "general", content: "" })
    setShowAddForm(false)
  }

  const handleRemoveNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id))
  }

  const handleStatusChange = (id: string, status: PlanningNote["status"]) => {
    setNotes(
      notes.map((n) => (n.id === id ? { ...n, status } : n))
    )
  }

  return (
    <Card>
      <CardHeader className="border-b bg-muted/30 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Advisor
              </p>
              <CardTitle className="font-serif text-xl">
                Planning Notes
              </CardTitle>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Note
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {/* Add Note Form */}
        {showAddForm && (
          <div className="mb-4 space-y-3 rounded-lg border bg-muted/20 p-4">
            <div className="flex gap-3">
              <div className="w-40 space-y-1">
                <label className="text-xs font-medium">Type</label>
                <Select
                  value={newNote.type}
                  onValueChange={(v) => setNewNote({ ...newNote, type: v as PlanningNote["type"] })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(noteTypes).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Note</label>
              <Textarea
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                placeholder="Enter planning note, 10b5-1 considerations, tax strategies..."
                className="min-h-[100px] resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddNote}>
                Save Note
              </Button>
            </div>
          </div>
        )}

        {/* Notes List */}
        <div className="space-y-3">
          {notes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No planning notes yet. Add notes to track 10b5-1 plans, tax strategies, and compliance items.
            </p>
          ) : (
            notes.map((note) => {
              const typeInfo = noteTypes[note.type]
              const Icon = typeInfo.icon
              return (
                <div
                  key={note.id}
                  className={cn(
                    "rounded-lg border bg-card p-4 transition-colors hover:bg-muted/20",
                    note.status === "resolved" && "opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className={cn("shrink-0", typeInfo.color)}>
                        <Icon className="mr-1 h-3 w-3" />
                        {typeInfo.label}
                      </Badge>
                      <div className="space-y-1">
                        <p className="text-sm leading-relaxed">{note.content}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {note.createdAt}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={note.status}
                        onValueChange={(v) => handleStatusChange(note.id, v as PlanningNote["status"])}
                      >
                        <SelectTrigger className="h-7 w-24 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveNote(note.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
