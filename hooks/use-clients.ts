// hooks/use-clients.ts
// React hook for loading/saving clients from the Supabase API
// Replaces the localStorage-based client storage in client-profile.tsx

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

export interface ClientRecord {
  id: string
  name: string
  email: string
  phone: string
  company: string
  company_ticker: string
  job_title: string
  state: string
  net_worth: number
  liquid_assets: number
  concentration_threshold: number
  liquidity_target: number
  risk_tolerance: "conservative" | "moderate" | "aggressive"
  tax_filing_status: "single" | "married_joint" | "married_separate" | "head_household"
  rsu_shares: number
  iso_shares: number
  nso_shares: number
  espp_shares: number
  status: "active" | "pending" | "archived"
  notes: string
  created_at: string
  updated_at: string
}

async function getAuthHeader(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" }
}

export function useClients() {
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchClients = useCallback(async (status?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const headers = await getAuthHeader()
      const url = status ? `/api/clients?status=${status}` : "/api/clients"
      const res = await fetch(url, { headers })
      if (!res.ok) throw new Error("Failed to load clients")
      const { clients: data } = await res.json()
      setClients(data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const saveClient = useCallback(async (client: Partial<ClientRecord> & { id?: string }) => {
    const headers = await getAuthHeader()
    if (client.id) {
      // Update existing
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(client),
      })
      if (!res.ok) throw new Error("Failed to update client")
      const { client: updated } = await res.json()
      setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      return updated as ClientRecord
    } else {
      // Create new
      const res = await fetch("/api/clients", {
        method: "POST",
        headers,
        body: JSON.stringify(client),
      })
      if (!res.ok) throw new Error("Failed to create client")
      const { client: created } = await res.json()
      setClients((prev) => [...prev, created])
      return created as ClientRecord
    }
  }, [])

  const deleteClient = useCallback(async (id: string, hard = false) => {
    const headers = await getAuthHeader()
    const url = hard ? `/api/clients/${id}?hard=true` : `/api/clients/${id}`
    const res = await fetch(url, { method: "DELETE", headers })
    if (!res.ok) throw new Error("Failed to delete client")
    if (hard) {
      setClients((prev) => prev.filter((c) => c.id !== id))
    } else {
      setClients((prev) => prev.map((c) => (c.id === id ? { ...c, status: "archived" } : c)))
    }
  }, [])

  return { clients, isLoading, error, fetchClients, saveClient, deleteClient }
}

// ── Grants hook ───────────────────────────────────────────────

import type { Grant } from "@/lib/calculations"

function grantFromDb(db: Record<string, unknown>): Grant {
  return {
    id: db.id as string,
    type: db.type as Grant["type"],
    symbol: db.symbol as string | undefined,
    shares: db.shares as number,
    strike: db.strike as number | null,
    grantDate: db.grant_date as string,
    vestDate: db.vest_date as string,
    fmvAtVest: db.fmv_at_vest as number | null,
    vestingSchedule: db.vesting_schedule as Grant["vestingSchedule"],
    costBasisPerShare: db.cost_basis_per_share as number | undefined,
    asOfDate: db.as_of_date as string | undefined,
    esppOfferDate: db.espp_offer_date as string | undefined,
    esppPurchaseDate: db.espp_purchase_date as string | undefined,
    esppDiscount: db.espp_discount as number | undefined,
    esppLookback: db.espp_lookback as boolean | undefined,
    hasEarlyExercise: db.has_early_exercise as boolean | undefined,
    exercised83b: db.exercised_83b as boolean | undefined,
  }
}

export function useClientGrants(clientId: string | null) {
  const [grants, setGrants] = useState<Grant[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchGrants = useCallback(async () => {
    if (!clientId) { setGrants([]); return }
    setIsLoading(true)
    try {
      const headers = await getAuthHeader()
      const res = await fetch(`/api/clients/${clientId}/grants`, { headers })
      if (!res.ok) throw new Error("Failed to load grants")
      const { grants: data } = await res.json()
      setGrants((data ?? []).map(grantFromDb))
    } finally {
      setIsLoading(false)
    }
  }, [clientId])

  useEffect(() => { fetchGrants() }, [fetchGrants])

  const saveGrants = useCallback(async (updatedGrants: Grant[]) => {
    if (!clientId) return
    const headers = await getAuthHeader()
    await fetch(`/api/clients/${clientId}/grants`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ grants: updatedGrants }),
    })
    setGrants(updatedGrants)
  }, [clientId])

  return { grants, isLoading, fetchGrants, saveGrants }
}
