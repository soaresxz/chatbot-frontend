"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useApiConfig } from "@/lib/api-config"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import { Bot, MessageSquare, TrendingUp, Users, Clock, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const TEAL = "#14b8a6"
const TEAL_LIGHT = "#2dd4bf"

interface DashboardData {
  agendamentos_hoje: number
  confirmados: number
  faltas: number
  proximos_agendamentos: number
  taxa_confirmacao: number
  faturamento_mes: number
  conversas_hoje: number
  conversas_semana: number
  conversas_mes: number
  taxa_conversao: number
  conversas_humano: number
  conversas_ia: number
  tempo_medio_resposta_segundos: number
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload) return null
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-foreground">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

function StatSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-28" />
      </CardContent>
    </Card>
  )
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  return `${Math.round(seconds / 60)}min`
}

export default function ClinicRelatoriosPage() {
  const { user } = useAuth()
  const { buildUrl, authHeaders } = useApiConfig()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const tenantId = user?.tenant_id || ""

  async function fetchDashboard() {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await fetch(
        buildUrl(`/dashboard/clinica/${tenantId}`),
        { headers: authHeaders() }
      )
      if (!res.ok) throw new Error()
      const json = await res.json()
      setData(json.metrics)
    } catch {
      toast.error("Erro ao carregar métricas.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [tenantId])

  // Dados para o gráfico de barras (semana — derivados do que temos)
  const weekData = data ? [
    { name: "Esta semana", conversas: data.conversas_semana, agendamentos: data.agendamentos_hoje },
  ] : []

  // Dados para o gráfico de modo de atendimento
  const atendimentoData = data ? [
    { name: "IA", value: data.conversas_ia },
    { name: "Humano", value: data.conversas_humano },
  ] : []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">Analise as métricas da sua clínica</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDashboard} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Cards de métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : data ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Conversas Hoje</CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.conversas_hoje}</div>
                <p className="text-xs text-muted-foreground">{data.conversas_semana} esta semana</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Automação</CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.conversas_ia + data.conversas_humano > 0
                    ? Math.round((data.conversas_ia / (data.conversas_ia + data.conversas_humano)) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.conversas_ia} IA · {data.conversas_humano} humano
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Agendamentos Hoje</CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.agendamentos_hoje}</div>
                <p className="text-xs text-muted-foreground">
                  {data.confirmados} confirmados · {data.faltas} faltas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Médio Resposta</CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.tempo_medio_resposta_segundos > 0
                    ? formatTime(data.tempo_medio_resposta_segundos)
                    : "—"}
                </div>
                <p className="text-xs text-muted-foreground">tempo médio do bot hoje</p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Cards secundários */}
      {!loading && data && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.faturamento_mes.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
              <p className="text-xs text-muted-foreground">consultas com status Concluído</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.taxa_conversao}%</div>
              <p className="text-xs text-muted-foreground">conversas → agendamentos este mês</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Próximos Agendamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.proximos_agendamentos}</div>
              <p className="text-xs text-muted-foreground">confirmados no futuro</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos */}
      {!loading && data && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversas do Mês</CardTitle>
              <CardDescription>{data.conversas_mes} pacientes únicos este mês</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: "Hoje", value: data.conversas_hoje },
                    { name: "Semana", value: data.conversas_semana },
                    { name: "Mês", value: data.conversas_mes },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 14%)" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 12 }} axisLine={{ stroke: "hsl(0, 0%, 14%)" }} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 12 }} axisLine={{ stroke: "hsl(0, 0%, 14%)" }} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Conversas" fill={TEAL} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">IA vs Atendimento Humano</CardTitle>
              <CardDescription>Conversas ativas no momento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={atendimentoData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 14%)" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 12 }} axisLine={{ stroke: "hsl(0, 0%, 14%)" }} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 12 }} axisLine={{ stroke: "hsl(0, 0%, 14%)" }} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Conversas" fill={TEAL_LIGHT} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {loading && (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}