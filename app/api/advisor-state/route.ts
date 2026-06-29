// app/api/advisor-state/route.ts
// GET  /api/advisor-state  — load saved dashboard state for the signed-in advisor
// PUT  /api/advisor-state  — save/upsert dashboard state

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

export async function GET(req: NextRequest) {
  const advisorId = await getAdvisorId(req)
  if (!advisorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from("advisor_state")
    .select("*")
    .eq("advisor_id", advisorId)
    .single()

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ state: data ?? null })
}

export async function PUT(req: NextRequest) {
  const advisorId = await getAdvisorId(req)
  if (!advisorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from("advisor_state")
    .upsert(
      { ...body, advisor_id: advisorId },
      { onConflict: "advisor_id" }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ state: data })
}
