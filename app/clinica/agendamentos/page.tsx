"use client"

import { useState, useEffect, useCallback } from "react"
import { useApiConfig } from "@/lib/api-config"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react"

type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show"

interface Appointment {
  id: string
  tenant_id: string
  patient_id: string
  dentist_name: string | null
  procedure: string | null
  value: number | null
  scheduled_date: string
  status: AppointmentStatus
  created_at: string
  confirmed_at: string | null
}

interface AppointmentListResponse {
  items: Appointment[]
  total: number
  page: number
  page_size: number
}

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; dot: string }> = {
  pending:   { label: "Pendente",   color: "bg-amber-500/10 text-amber-500 ring-amber-500/20",    dot: "bg-amber-500" },
  confirmed: { label: "Confirmado", color: "bg-teal-500/10 text-teal-400 ring-teal-500/20",       dot: "bg-teal-400" },
  cancelled: { label: "Cancelado",  color: "bg-red-500/10 text-red-400 ring-red-500/20",          dot: "bg-red-400" },
  completed: { label: "Concluído",  color: "bg-muted text-muted-foreground ring-border",          dot: "bg-muted-foreground" },
  no_show:   { label: "Faltou",     color: "bg-orange-500/10 text-orange-400 ring-orange-500/20", dot: "bg-orange-400" },
}

const FILTERS = [
  { key: "hoje",      label: "Hoje" },
  { key: "amanha",    label: "Amanhã" },
  { key: "pendentes", label: "Pendentes" },
  { key: "todos",     label: "Todos" },
] as const

type Filter = (typeof FILTERS)[number]["key"]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}
function formatCurrency(v: number | null) {
  if (v == null) return "—"
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset", cfg.color)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  )
}

function ActionBtn({ onClick, className, children }: { onClick: () => void; className?: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("px-2.5 py-1 rounded text-xs font-medium transition-colors", className)}>
      {children}
    </button>
  )
}

function AppointmentRow({ appt, onStatusChange, onDelete }: {
  appt: Appointment
  onStatusChange: (id: string, status: AppointmentStatus) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  const handle = async (action: () => Promise<void>) => {
    setLoading(true)
    try { await action() } finally { setLoading(false) }
  }

  return (
    <tr className="group border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <td className="py-3.5 pl-4 pr-3">
        <div className="font-semibold text-foreground text-sm tabular-nums">{formatDate(appt.scheduled_date)}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{formatTime(appt.scheduled_date)}</div>
      </td>
      <td className="px-3 py-3.5">
        <div className="font-medium text-foreground text-sm">Paciente</div>
        <div className="text-xs text-muted-foreground mt-0.5 font-mono">{appt.patient_id.slice(0, 8)}…</div>
      </td>
      <td className="px-3 py-3.5">
        <span className="text-sm text-muted-foreground">{appt.procedure ?? "—"}</span>
      </td>
      <td className="hidden md:table-cell px-3 py-3.5">
        <span className="text-sm text-muted-foreground">{appt.dentist_name ?? "—"}</span>
      </td>
      <td className="hidden lg:table-cell px-3 py-3.5 text-right">
        <span className="text-sm text-muted-foreground">{formatCurrency(appt.value)}</span>
      </td>
      <td className="px-3 py-3.5"><StatusBadge status={appt.status} /></td>
      <td className="pl-3 pr-4 py-3.5">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {appt.status === "pending" && (
            <>
              <ActionBtn onClick={() => handle(() => onStatusChange(appt.id, "confirmed"))} className="bg-teal-500/10 text-teal-400 hover:bg-teal-500/20">
                {loading ? "..." : "Confirmar"}
              </ActionBtn>
              <ActionBtn onClick={() => handle(() => onStatusChange(appt.id, "cancelled"))} className="bg-red-500/10 text-red-400 hover:bg-red-500/20">
                Cancelar
              </ActionBtn>
            </>
          )}
          {appt.status === "confirmed" && (
            <ActionBtn onClick={() => handle(() => onStatusChange(appt.id, "completed"))} className="bg-muted text-muted-foreground hover:bg-muted/80">
              Concluir
            </ActionBtn>
          )}
          <ActionBtn onClick={() => handle(() => onDelete(appt.id))} className="bg-muted text-muted-foreground hover:bg-red-500/10 hover:text-red-400">
            ✕
          </ActionBtn>
        </div>
      </td>
    </tr>
  )
}

export default function AgendamentosPage() {
  const { buildUrl, authHeaders } = useApiConfig()
  const [filter, setFilter] = useState<Filter>("hoje")
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const PAGE_SIZE = 20

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        buildUrl("/api/v1/appointments", { filter, page: String(page), page_size: String(PAGE_SIZE) }),
        { headers: authHeaders() }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(err.detail ?? "Erro desconhecido")
      }
      const data: AppointmentListResponse = await res.json()
      setAppointments(data.items)
      setTotal(data.total)
    } catch (e: any) {
      setError(e.message ?? "Erro ao carregar agendamentos")
    } finally {
      setLoading(false)
    }
  }, [filter, page, buildUrl, authHeaders])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [filter])

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    await fetch(buildUrl(`/api/v1/appointments/${id}/status`), {
      method: "PATCH", headers: authHeaders(), body: JSON.stringify({ status }),
    })
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este agendamento?")) return
    await fetch(buildUrl(`/api/v1/appointments/${id}`), { method: "DELETE", headers: authHeaders() })
    await load()
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const countByStatus = appointments.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1; return acc
  }, {} as Record<string, number>)

  const statCards = [
    { status: "pending",   label: "Pendentes",   icon: Clock },
    { status: "confirmed", label: "Confirmados", icon: CheckCircle },
    { status: "cancelled", label: "Cancelados",  icon: XCircle },
    { status: "completed", label: "Concluídos",  icon: Calendar },
  ]

  return (
    <div className="flex flex-col gap-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
          <p className="text-muted-foreground">
            {total} {total === 1 ? "agendamento" : "agendamentos"} encontrados
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
          Tempo real
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-12" /></CardContent>
            </Card>
          ))
        ) : statCards.map(({ status, label, icon: Icon }) => (
          <Card key={status}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{countByStatus[status] ?? 0}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 w-fit">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
              filter === f.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}>
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <CardContent className="py-24 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
              <span className="text-sm">Carregando agendamentos...</span>
            </div>
          </CardContent>
        ) : error ? (
          <CardContent className="py-24 flex items-center justify-center">
            <div className="text-center">
              <p className="text-destructive font-medium mb-2">Erro ao carregar</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <button onClick={load} className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors">
                Tentar novamente
              </button>
            </div>
          </CardContent>
        ) : appointments.length === 0 ? (
          <CardContent className="py-24 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Calendar className="mx-auto h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">Nenhum agendamento encontrado</p>
              <p className="text-sm mt-1">Altere o filtro ou aguarde novos agendamentos pelo bot</p>
            </div>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="py-3 pl-4 pr-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data/Hora</th>
                  <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Paciente</th>
                  <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Procedimento</th>
                  <th className="hidden md:table-cell px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dentista</th>
                  <th className="hidden lg:table-cell px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Valor</th>
                  <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="pl-3 pr-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <AppointmentRow key={appt.id} appt={appt} onStatusChange={handleStatusChange} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Página {page} de {totalPages} · {total} registros</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                ← Anterior
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Próxima →
              </button>
            </div>
          </div>
        )}
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Agendamentos criados pelo bot aparecem aqui automaticamente. Confirmações via WhatsApp atualizam o status em tempo real.
      </p>
    </div>
  )
}