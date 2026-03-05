/**
 * lib/api/appointments.ts
 * Cliente de API para agendamentos — substitui todos os mocks.
 */

export type AppointmentStatus = "pendente" | "confirmado" | "cancelado" | "concluido"

export interface Appointment {
  id: number
  tenant_id: number
  patient_id: number | null
  patient_name: string | null
  patient_phone: string
  dentist_name: string | null
  procedure: string | null
  value: number | null
  scheduled_date: string   // ISO string
  status: AppointmentStatus
  notes: string | null
  created_at: string
  confirmed_at: string | null
}

export interface AppointmentListResponse {
  items: Appointment[]
  total: number
  page: number
  page_size: number
}

export interface AvailableSlots {
  date: string
  day_name: string
  slots: string[]
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://chatbotia-production.up.railway.app"

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? "Erro desconhecido")
  }
  return res.json()
}

// ─── Appointments ────────────────────────────────────────────────────────────

export async function fetchAppointments(
  filter: "hoje" | "amanha" | "pendentes" | "todos" = "todos",
  page = 1,
  pageSize = 20
): Promise<AppointmentListResponse> {
  return apiFetch(`/appointments?filter=${filter}&page=${page}&page_size=${pageSize}`)
}

export async function fetchAppointment(id: number): Promise<Appointment> {
  return apiFetch(`/appointments/${id}`)
}

export async function updateAppointmentStatus(
  id: number,
  status: AppointmentStatus
): Promise<Appointment> {
  return apiFetch(`/appointments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

export async function deleteAppointment(id: number): Promise<void> {
  await apiFetch(`/appointments/${id}`, { method: "DELETE" })
}

// ─── Slots ───────────────────────────────────────────────────────────────────

export async function fetchAvailableSlots(date: string): Promise<AvailableSlots> {
  return apiFetch(`/appointments/slots?date=${date}`)
}

// ─── Clinic Hours ────────────────────────────────────────────────────────────

export interface ClinicHours {
  id: number
  tenant_id: number
  day_of_week: number
  day_name: string
  start_time: string   // "HH:MM:SS"
  end_time: string
  slot_duration_minutes: number
  is_active: boolean
}

export async function fetchClinicHours(): Promise<ClinicHours[]> {
  return apiFetch("/clinic-hours")
}

export async function upsertClinicHours(
  dayOfWeek: number,
  data: Omit<ClinicHours, "id" | "tenant_id" | "day_name">
): Promise<ClinicHours> {
  return apiFetch(`/clinic-hours/${dayOfWeek}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}