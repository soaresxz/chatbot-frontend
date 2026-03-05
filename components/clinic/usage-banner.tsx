"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useApiConfig } from "@/lib/api-config"
import { AlertTriangle, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UsageData {
  mensagens_mes: number
  limite_mensagens: number | null
  percentual_uso: number | null
}

export function UsageBanner() {
  const { user } = useAuth()
  const { buildUrl, authHeaders } = useApiConfig()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [dismissed, setDismissed] = useState(false)

  const tenantId = user?.tenant_id || ""

  useEffect(() => {
    if (!tenantId) return

    async function fetchUsage() {
      try {
        const res = await fetch(
          buildUrl(`/dashboard/clinica/${tenantId}`),
          { headers: authHeaders() }
        )
        if (!res.ok) return
        const json = await res.json()
        const m = json.metrics
        setUsage({
          mensagens_mes: m.mensagens_mes,
          limite_mensagens: m.limite_mensagens,
          percentual_uso: m.percentual_uso,
        })
      } catch {
        // silencioso — banner é opcional
      }
    }

    fetchUsage()
  }, [tenantId])

  // Não exibe se: sem dados, ilimitado, abaixo de 70%, ou dispensado
  if (!usage || usage.limite_mensagens === null) return null
  if ((usage.percentual_uso ?? 0) < 70) return null
  if (dismissed) return null

  const isOver = (usage.percentual_uso ?? 0) >= 100
  const isCritical = (usage.percentual_uso ?? 0) >= 90

  return (
    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
      isOver
        ? "border-red-500/30 bg-red-500/10 text-red-400"
        : isCritical
        ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
        : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
    }`}>
      <AlertTriangle className="h-4 w-4 shrink-0" />

      <p className="flex-1">
        {isOver ? (
          <>
            <strong>Limite atingido!</strong> Seu plano <strong>{user?.plan}</strong> usou{" "}
            {usage.mensagens_mes.toLocaleString("pt-BR")} de{" "}
            {usage.limite_mensagens.toLocaleString("pt-BR")} mensagens este mês.
            O bot está pausado até o próximo mês.
          </>
        ) : (
          <>
            <strong>Atenção:</strong> Você usou <strong>{usage.percentual_uso}%</strong> do limite
            do plano ({usage.mensagens_mes.toLocaleString("pt-BR")}/{usage.limite_mensagens.toLocaleString("pt-BR")} mensagens).
          </>
        )}
      </p>

      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 border-current text-current hover:bg-current/10 shrink-0"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Fazer upgrade
      </Button>

      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 opacity-60 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}