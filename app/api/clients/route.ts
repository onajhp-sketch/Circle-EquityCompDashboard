// app/api/clients/route.ts
// GET  /api/clients        — list all clients for the signed-in advisor
// POST /api/clients        — create a new client

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
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") // optional filter

  let query = supabase
    .from("clients")
    .select("*")
    .eq("advisor_id", advisorId)
    .order("name", { ascending: true })

  if (status) query = query.eq("status", status)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ clients: data })
}

export async function POST(req: NextRequest) {
  const advisorId = await getAdvisorId(req)
  if (!advisorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from("clients")
    .insert({ ...body, advisor_id: advisorId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ client: data }, { status: 201 })
}
