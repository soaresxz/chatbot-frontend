"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  const { login, user, isLoading } = useAuth()
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (user) {
    if (user.role === "super_admin") {
      router.replace("/admin/clinicas")
    } else {
      router.replace("/clinica/conversas")
    }
    return null
  }

  async function handleLogin(email: string, password: string) {
    setError("")
    setLoading(true)
    const success = await login(email, password)
    if (success) {
      const stored = localStorage.getItem("odontoia_user")
      if (stored) {
        const u = JSON.parse(stored)
        if (u.role === "super_admin") {
          router.push("/admin/clinicas")
        } else {
          router.push("/clinica/conversas")
        }
      }
    } else {
      setError("E-mail ou senha incorretos")
      setLoading(false)
    }
  }

  return <LoginForm onLogin={handleLogin} error={error} loading={loading} />
}
