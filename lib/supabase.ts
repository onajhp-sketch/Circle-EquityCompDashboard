// lib/supabase.ts
// Supabase client setup for Circle Financial Planning Dashboard
// Place this file at: lib/supabase.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env.local file.')
}

// Browser client — used in React components and client-side hooks
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'circle_supabase_auth',
  },
})

// ── Database types (mirrors schema.sql) ──────────────────────

export interface DbAdvisor {
  id: string
  email: string
  full_name: string
  firm_name: string
  created_at: string
  updated_at: string
}

export interface DbClient {
  id: string
  advisor_id: string
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
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive'
  tax_filing_status: 'single' | 'married_joint' | 'married_separate' | 'head_household'
  rsu_shares: number
  iso_shares: number
  nso_shares: number
  espp_shares: number
  status: 'active' | 'pending' | 'archived'
  notes: string
  created_at: string
  updated_at: string
}

export interface DbGrant {
  id: string
  client_id: string
  advisor_id: string
  type: 'RSU' | 'NSO' | 'ISO' | 'ESPP'
  symbol: string | null
  shares: number
  strike: number | null
  grant_date: string
  vest_date: string
  fmv_at_vest: number | null
  vesting_schedule: Record<string, unknown> | null
  cost_basis_per_share: number | null
  as_of_date: string | null
  espp_offer_date: string | null
  espp_purchase_date: string | null
  espp_discount: number | null
  espp_lookback: boolean
  has_early_exercise: boolean
  exercised_83b: boolean
  created_at: string
  updated_at: string
}

export interface DbAdvisorState {
  id: string
  advisor_id: string
  client_id: string | null
  tax_assumptions: Record<string, unknown> | null
  scenario_inputs: Record<string, unknown> | null
  blackouts: unknown[] | null
  suggested_actions: unknown[] | null
  preferred_strategy: string | null
  concentration_threshold: number
  liquidity_target: number
  primary_symbol: string
  active_tab: string
  updated_at: string
}
