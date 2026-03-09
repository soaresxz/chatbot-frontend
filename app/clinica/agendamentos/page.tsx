"use client"

import { useState, useEffect, useCallback } from "react"
import {
  fetchAppointments,
  updateAppointmentStatus,
  deleteAppointment,
  type Appointment,
  type AppointmentStatus,
} from "@/lib/api/appointments"
import { cn } from "@/lib/utils"

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; dot: string }> = {
  pending:   { label: "Pendente",   color: "bg-amber-50 text-amber-700 ring-amber-200",       dot: "bg-amber-400" },
  confirmed: { label: "Confirmado", color: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelado",  color: "bg-red-50 text-red-600 ring-red-200",             dot: "bg-red-400" },
  completed: { label: "Concluído",  color: "bg-slate-100 text-slate-600 ring-slate-200",      dot: "bg-slate-400" },
  no_show:   { label: "Faltou",     color: "bg-orange-50 text-orange-600 ring-orange-200",    dot: "bg-orange-400" },
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

function ActionButton({ onClick, className, children }: { onClick: () => void; className?: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("px-2.5 py-1 rounded text-xs font-medium transition-colors", className)}>
      {children}
    </button>
  )
}

function AppointmentRow({
  appt,
  onStatusChange,
  onDelete,
}: {
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
    <tr className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
      <td className="py-3.5 pl-4 pr-3">
        <div className="font-semibold text-slate-800 text-sm tabular-nums">{formatDate(appt.scheduled_date)}</div>
        <div className="text-xs text-slate-400 mt-0.5">{formatTime(appt.scheduled_date)}</div>
      </td>
      <td className="px-3 py-3.5">
        <div className="font-medium text-slate-700 text-sm">Paciente</div>
        <div className="text-xs text-slate-400 mt-0.5">{appt.patient_id}</div>
      </td>
      <td className="px-3 py-3.5">
        <span className="text-sm text-slate-600">{appt.procedure ?? "—"}</span>
      </td>
      <td className="hidden md:table-cell px-3 py-3.5">
        <span className="text-sm text-slate-600">{appt.dentist_name ?? "—"}</span>
      </td>
      <td className="hidden lg:table-cell px-3 py-3.5 text-right">
        <span className="text-sm text-slate-600">{formatCurrency(appt.value)}</span>
      </td>
      <td className="px-3 py-3.5">
        <StatusBadge status={appt.status} />
      </td>
      <td className="pl-3 pr-4 py-3.5">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {appt.status === "pending" && (
            <>
              <ActionButton onClick={() => handle(() => onStatusChange(appt.id, "confirmed"))} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                {loading ? "..." : "Confirmar"}
              </ActionButton>
              <ActionButton onClick={() => handle(() => onStatusChange(appt.id, "cancelled"))} className="bg-red-50 text-red-600 hover:bg-red-100">
                Cancelar
              </ActionButton>
            </>
          )}
          {appt.status === "confirmed" && (
            <ActionButton onClick={() => handle(() => onStatusChange(appt.id, "completed"))} className="bg-slate-100 text-slate-600 hover:bg-slate-200">
              Concluir
            </ActionButton>
          )}
          <ActionButton onClick={() => handle(() => onDelete(appt.id))} className="bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500">
            ✕
          </ActionButton>
        </div>
      </td>
    </tr>
  )
}

export default function AgendamentosPage() {
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
      const res = await fetchAppointments(filter, page, PAGE_SIZE)
      setAppointments(res.items)
      setTotal(res.total)
    } catch (e: any) {
      setError(e.message ?? "Erro ao carregar agendamentos")
    } finally {
      setLoading(false)
    }
  }, [filter, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [filter])

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    await updateAppointmentStatus(id, status)
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este agendamento?")) return
    await deleteAppointment(id)
    await load()
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const countByStatus = appointments.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agendamentos</h1>
            <p className="mt-1 text-sm text-slate-500">{total} {total === 1 ? "agendamento" : "agendamentos"} encontrados</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Atualizado em tempo real
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
            <div key={status} className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
              <div className="text-2xl font-bold text-slate-800">{countByStatus[status] ?? 0}</div>
              <div className={cn("text-xs font-medium mt-0.5", cfg.color.split(" ")[1])}>{cfg.label}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1 mb-4 bg-white rounded-xl border border-slate-200 p-1 w-fit shadow-sm">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                filter === f.key ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-24 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
                <span className="text-sm">Carregando agendamentos...</span>
              </div>
            </div>
          ) : error ? (
            <div className="py-24 flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-500 font-medium mb-2">Erro ao carregar</p>
                <p className="text-sm text-slate-400 mb-4">{error}</p>
                <button onClick={load} className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors">
                  Tentar novamente
                </button>
              </div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-24 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <svg className="mx-auto h-12 w-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="font-medium text-slate-500">Nenhum agendamento encontrado</p>
                <p className="text-sm mt-1">Altere o filtro ou aguarde novos agendamentos pelo bot</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="py-3 pl-4 pr-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Data/Hora</th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Paciente</th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Procedimento</th>
                    <th className="hidden md:table-cell px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Dentista</th>
                    <th className="hidden lg:table-cell px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Valor</th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="pl-3 pr-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ações</th>
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
            <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-slate-500">Página {page} de {totalPages} · {total} registros</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  ← Anterior
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-400 text-center">
          Agendamentos criados pelo bot aparecem aqui automaticamente. Confirmações via WhatsApp atualizam o status em tempo real.
        </p>
      </div>
    </div>
  )
}