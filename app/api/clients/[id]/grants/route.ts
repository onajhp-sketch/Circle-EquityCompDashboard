// app/api/clients/[id]/grants/route.ts
// GET  /api/clients/:id/grants  — list all grants for a client
// POST /api/clients/:id/grants  — add a grant to a client
// PUT  /api/clients/:id/grants  — replace all grants (bulk save)

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

async function getAdvisorId(req: NextRequest): Promise<string | null> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return null
  const supabase = getServiceClient()
  const { data: { user } } = await supabase.auth.getUser(token)
  return user?.id ?? null
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const advisorId = await getAdvisorId(req)
  if (!advisorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = getServiceClient()

  // Verify client belongs to this advisor
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", params.id)
    .eq("advisor_id", advisorId)
    .single()

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { data, error } = await supabase
    .from("grants")
    .select("*")
    .eq("client_id", params.id)
    .order("grant_date", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ grants: data })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  // Bulk replace — saves the entire grants array for a client
  const advisorId = await getAdvisorId(req)
  if (!advisorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = getServiceClient()

  // Verify ownership
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", params.id)
    .eq("advisor_id", advisorId)
    .single()

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { grants } = await req.json()

  // Delete existing grants for this client, then insert new ones
  await supabase.from("grants").delete().eq("client_id", params.id)

  if (grants && grants.length > 0) {
    // Map from your Grant interface (camelCase) to DB columns (snake_case)
    const dbGrants = grants.map((g: Record<string, unknown>) => ({
      id: g.id,
      client_id: params.id,
      advisor_id: advisorId,
      type: g.type,
      symbol: g.symbol ?? null,
      shares: g.shares,
      strike: g.strike ?? null,
      grant_date: g.grantDate ?? g.grant_date ?? "",
      vest_date: g.vestDate ?? g.vest_date ?? "",
      fmv_at_vest: g.fmvAtVest ?? g.fmv_at_vest ?? null,
      vesting_schedule: g.vestingSchedule ?? g.vesting_schedule ?? null,
      cost_basis_per_share: g.costBasisPerShare ?? g.cost_basis_per_share ?? null,
      as_of_date: g.asOfDate ?? g.as_of_date ?? null,
      espp_offer_date: g.esppOfferDate ?? g.espp_offer_date ?? null,
      espp_purchase_date: g.esppPurchaseDate ?? g.espp_purchase_date ?? null,
      espp_discount: g.esppDiscount ?? g.espp_discount ?? null,
      espp_lookback: g.esppLookback ?? g.espp_lookback ?? false,
      has_early_exercise: g.hasEarlyExercise ?? g.has_early_exercise ?? false,
      exercised_83b: g.exercised83b ?? g.exercised_83b ?? false,
    }))

    const { error } = await supabase.from("grants").insert(dbGrants)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
