"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { User, UserRole } from "./types"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const HARDCODED_USERS: { email: string; password: string; user: User }[] = [
  {
    email: "admin@odontoia.com",
    password: "admin123",
    user: {
      email: "admin@odontoia.com",
      name: "Administrador",
      role: "super_admin" as UserRole,
    },
  },
  {
    email: "clinica@exemplo.com",
    password: "123456",
    user: {
      email: "clinica@exemplo.com",
      name: "Clinica Odonto Sorriso",
      role: "clinic_user" as UserRole,
      tenant_id: "clinica_odonto_sorriso",
    },
  },
]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem("odontoia_user")
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem("odontoia_user")
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const found = HARDCODED_USERS.find(
      (u) => u.email === email && u.password === password
    )
    if (found) {
      setUser(found.user)
      localStorage.setItem("odontoia_user", JSON.stringify(found.user))
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem("odontoia_user")
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
