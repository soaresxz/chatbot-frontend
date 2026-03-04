"use client"

import { Lock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

interface PlanGateProps {
  children: React.ReactNode
  requiredPlan?: "pro" | "enterprise"
  featureName?: string
}

const PLAN_ORDER = ["basic", "pro", "enterprise"]

function hasAccess(userPlan: string, requiredPlan: string): boolean {
  return PLAN_ORDER.indexOf(userPlan) >= PLAN_ORDER.indexOf(requiredPlan)
}

export function PlanGate({
  children,
  requiredPlan = "pro",
  featureName = "este recurso",
}: PlanGateProps) {
  const { user } = useAuth()
  const plan = user?.plan ?? "basic"

  if (hasAccess(plan, requiredPlan)) {
    return <>{children}</>
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Banner de upgrade */}
      <div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-7 w-7 text-primary" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight">
            Recurso exclusivo do Plano Pro
          </h2>
          <p className="max-w-md text-muted-foreground">
            O acesso a <strong>{featureName}</strong> está disponível apenas no
            plano <strong>Pro</strong>. Faça upgrade para desbloquear agendamentos,
            relatórios e muito mais.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <Button size="lg" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Fazer upgrade para o Plano Pro
          </Button>
          <p className="text-xs text-muted-foreground">
            Plano atual: <span className="font-medium capitalize">{plan}</span>
          </p>
        </div>
      </div>

      {/* Preview desfocado do conteúdo */}
      <div className="pointer-events-none select-none opacity-30 blur-sm">
        {children}
      </div>
    </div>
  )
}