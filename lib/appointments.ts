"use client"

import { useCallback } from "react"
import { useApiConfig } from "./api-config"

export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show"

export interface Appointment {
  id: string
  tenant_id: string
  patient_id: string
  patient?: { id: string; name: string; phone: string }
  dentist_name: string | null
  procedure: string | null
  value: number | null
  scheduled_date: string
  status: AppointmentStatus
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

export interface ClinicHours {
  id: string
  tenant_id: string
  day_of_week: number
  day_name: string
  start_time: string
  end_time: string
  slot_duration_minutes: number
  is_active: boolean
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://chatbotia-production.up.railway.app"

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("odontoia_token") : null
  const res = await fetch(`${BASE_URL}/api/v1${path}`, {
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

export async function fetchAppointments(
  filter: "hoje" | "amanha" | "pendentes" | "todos" = "todos",
  page = 1,
  pageSize = 20
): Promise<AppointmentListResponse> {
  return apiFetch(`/appointments?filter=${filter}&page=${page}&page_size=${pageSize}`)
}

export async function fetchAppointment(id: string): Promise<Appointment> {
  return apiFetch(`/appointments/${id}`)
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
  return apiFetch(`/appointments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

export async function deleteAppointment(id: string): Promise<void> {
  await apiFetch(`/appointments/${id}`, { method: "DELETE" })
}

export async function fetchAvailableSlots(date: string): Promise<AvailableSlots> {
  return apiFetch(`/appointments/slots?date=${date}`)
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