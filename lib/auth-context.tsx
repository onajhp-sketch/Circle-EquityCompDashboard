"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Fixed user profile - no editing allowed
const FIXED_USER = {
  name: "CircleFP",
  firmName: "Circle Financial Planning",
}

// Site password
const SITE_PASSWORD = "CircleFP2026"

interface AuthContextType {
  user: { name: string; firmName: string } | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const session = localStorage.getItem("circle_session")
    if (session === "active") {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const login = (password: string): boolean => {
    if (password === SITE_PASSWORD) {
      setIsAuthenticated(true)
      localStorage.setItem("circle_session", "active")
      return true
    }
    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("circle_session")
  }

  return (
    <AuthContext.Provider
      value={{
        user: isAuthenticated ? FIXED_USER : null,
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
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
