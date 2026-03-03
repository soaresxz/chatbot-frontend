"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { User, UserRole } from "./types"

const API_BASE_URL = "https://chatbotia-production.up.railway.app"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Restaura sessão salva
    const stored = localStorage.getItem("odontoia_user")
    const token = localStorage.getItem("odontoia_token")
    if (stored && token) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem("odontoia_user")
        localStorage.removeItem("odontoia_token")
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) return false

      const data = await res.json()

      const userData: User = {
        email: data.user.email,
        name: data.user.name,
        role: data.user.role as UserRole,
        tenant_id: data.user.tenant_id ?? undefined,
      }

      setUser(userData)
      localStorage.setItem("odontoia_user", JSON.stringify(userData))
      localStorage.setItem("odontoia_token", data.access_token)
      return true
    } catch {
      return false
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem("odontoia_user")
    localStorage.removeItem("odontoia_token")
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider")
  }
  return context
}