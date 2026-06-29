// app/api/clients/[id]/route.ts
// GET    /api/clients/:id  — get one client
// PUT    /api/clients/:id  — update client
// DELETE /api/clients/:id  — archive (soft delete) or hard delete

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
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", params.id)
    .eq("advisor_id", advisorId)
    .single()

  if (error) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ client: data })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const advisorId = await getAdvisorId(req)
  if (!advisorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const supabase = getServiceClient()

  // Remove fields that shouldn't be updated
  const { id, advisor_id, created_at, ...updateData } = body

  const { data, error } = await supabase
    .from("clients")
    .update(updateData)
    .eq("id", params.id)
    .eq("advisor_id", advisorId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ client: data })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const advisorId = await getAdvisorId(req)
  if (!advisorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = getServiceClient()
  const { searchParams } = new URL(req.url)
  const hard = searchParams.get("hard") === "true"

  if (hard) {
    // Hard delete — removes all grants too (CASCADE)
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", params.id)
      .eq("advisor_id", advisorId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    // Soft delete — just archive
    const { error } = await supabase
      .from("clients")
      .update({ status: "archived" })
      .eq("id", params.id)
      .eq("advisor_id", advisorId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
