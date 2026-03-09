"use client"

import { useState, useEffect } from "react"
import { fetchClinicHours, upsertClinicHours, type ClinicHours } from "@/lib/appointments"
import { cn } from "@/lib/utils"

const DAYS = [
  { index: 0, short: "Seg", label: "Segunda-feira" },
  { index: 1, short: "Ter", label: "Terça-feira" },
  { index: 2, short: "Qua", label: "Quarta-feira" },
  { index: 3, short: "Qui", label: "Quinta-feira" },
  { index: 4, short: "Sex", label: "Sexta-feira" },
  { index: 5, short: "Sáb", label: "Sábado" },
  { index: 6, short: "Dom", label: "Domingo" },
]

const SLOT_OPTIONS = [15, 20, 30, 45, 60]

type HoursMap = Record<number, ClinicHours | undefined>

export function ClinicHoursConfig() {
  const [hoursMap, setHoursMap] = useState<HoursMap>({})
  const [editing, setEditing] = useState<number | null>(null)
  const [form, setForm] = useState({ start_time: "08:00", end_time: "18:00", slot_duration_minutes: 30, is_active: true })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchClinicHours().then((hours) => {
      const map: HoursMap = {}
      hours.forEach((h) => { map[h.day_of_week] = h })
      setHoursMap(map)
    })
  }, [])

  const openEdit = (dayIndex: number) => {
    const existing = hoursMap[dayIndex]
    setForm({
      start_time: existing ? existing.start_time.slice(0, 5) : "08:00",
      end_time: existing ? existing.end_time.slice(0, 5) : "18:00",
      slot_duration_minutes: existing?.slot_duration_minutes ?? 30,
      is_active: existing?.is_active ?? true,
    })
    setEditing(dayIndex)
    setError(null)
  }

  const handleSave = async () => {
    if (editing === null) return
    setSaving(true)
    setError(null)
    try {
      const updated = await upsertClinicHours(editing, {
        day_of_week: editing,
        start_time: form.start_time,
        end_time: form.end_time,
        slot_duration_minutes: form.slot_duration_minutes,
        is_active: form.is_active,
      })
      setHoursMap((prev) => ({ ...prev, [editing]: updated }))
      setEditing(null)
    } catch (e: any) {
      setError(e.message ?? "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  const slotsCount = (h: ClinicHours) => {
    const [sh, sm] = h.start_time.split(":").map(Number)
    const [eh, em] = h.end_time.split(":").map(Number)
    const totalMins = (eh * 60 + em) - (sh * 60 + sm)
    return Math.floor(totalMins / h.slot_duration_minutes)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-800">Horários de Funcionamento</h2>
        <p className="text-xs text-slate-400 mt-0.5">Configure os dias e horários disponíveis para agendamento pelo bot</p>
      </div>

      <div className="divide-y divide-slate-100">
        {DAYS.map((day) => {
          const h = hoursMap[day.index]
          const isOpen = h?.is_active && !!h
          return (
            <div key={day.index} className="flex items-center gap-4 px-5 py-3.5">
              {/* Day name */}
              <div className="w-28">
                <span className={cn("text-sm font-medium", isOpen ? "text-slate-800" : "text-slate-400")}>
                  {day.label}
                </span>
              </div>

              {/* Status + info */}
              <div className="flex-1">
                {h && h.is_active ? (
                  <span className="text-sm text-slate-600">
                    {h.start_time.slice(0, 5)} – {h.end_time.slice(0, 5)}
                    <span className="ml-2 text-xs text-slate-400">
                      {h.slot_duration_minutes}min · {slotsCount(h)} slots
                    </span>
                  </span>
                ) : (
                  <span className="text-sm text-slate-400 italic">Fechado</span>
                )}
              </div>

              {/* Edit button */}
              <button
                onClick={() => openEdit(day.index)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {h ? "Editar" : "Configurar"}
              </button>
            </div>
          )
        })}
      </div>

      {/* Edit modal (inline) */}
      {editing !== null && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-4">
              {DAYS.find((d) => d.index === editing)?.label}
            </h3>

            <div className="space-y-4">
              {/* is_active toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                  className={cn(
                    "relative h-5 w-9 rounded-full transition-colors cursor-pointer",
                    form.is_active ? "bg-emerald-500" : "bg-slate-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                    form.is_active ? "translate-x-4" : "translate-x-0.5"
                  )} />
                </div>
                <span className="text-sm text-slate-700">Clínica aberta neste dia</span>
              </label>

              {form.is_active && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Início</label>
                      <input
                        type="time"
                        value={form.start_time}
                        onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Fim</label>
                      <input
                        type="time"
                        value={form.end_time}
                        onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">Duração do slot</label>
                    <div className="flex gap-2">
                      {SLOT_OPTIONS.map((m) => (
                        <button
                          key={m}
                          onClick={() => setForm((f) => ({ ...f, slot_duration_minutes: m }))}
                          className={cn(
                            "flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                            form.slot_duration_minutes === m
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          {m}min
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {error && (
                <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2 rounded-xl bg-slate-900 text-sm text-white font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}