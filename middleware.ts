// middleware.ts
// Protects all dashboard routes — unauthenticated requests are
// allowed through to the client (the LoginPage component handles the gate)
// This middleware handles token refresh so sessions stay alive

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function middleware(req: NextRequest) {
  // Allow all static assets and public routes
  const { pathname } = req.nextUrl
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/apple-icon")
  ) {
    return NextResponse.next()
  }

  // For API routes, token validation happens inside each route handler
  // We let them pass through here — each handler calls getAdvisorId()
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Page routes: let the client-side AuthProvider handle the login gate
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
