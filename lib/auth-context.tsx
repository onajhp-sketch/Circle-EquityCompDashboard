"use client"

// lib/auth-context.tsx
// Replaces the old single-password auth with per-advisor Supabase login
// Drop-in replacement — existing components that call useAuth() still work

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { supabase, type DbAdvisor } from "./supabase"
import type { Session, User } from "@supabase/supabase-js"

interface AuthUser {
  id: string
  email: string
  name: string
  firmName: string
}

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const buildAuthUser = useCallback(
    async (supabaseUser: User): Promise<AuthUser> => {
      const { data: advisor } = await supabase
        .from("advisors")
        .select("full_name, firm_name")
        .eq("id", supabaseUser.id)
        .single<Pick<DbAdvisor, "full_name" | "firm_name">>()

      return {
        id: supabaseUser.id,
        email: supabaseUser.email ?? "",
        name: advisor?.full_name || supabaseUser.email?.split("@")[0] || "Advisor",
        firmName: advisor?.firm_name || "Circle Financial Planning",
      }
    },
    []
  )

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user && mounted) {
        const authUser = await buildAuthUser(session.user)
        setUser(authUser)
      }
      if (mounted) setIsLoading(false)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session: Session | null) => {
        if (!mounted) return
        if (session?.user) {
          const authUser = await buildAuthUser(session.user)
          setUser(authUser)
        } else {
          setUser(null)
        }
        setIsLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [buildAuthUser])

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        })
        if (error) return { success: false, error: error.message }
        if (data.user) {
          const authUser = await buildAuthUser(data.user)
          setUser(authUser)
        }
        return { success: true }
      } catch {
        return { success: false, error: "An unexpected error occurred" }
      } finally {
        setIsLoading(false)
      }
    },
    [buildAuthUser]
  )

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
