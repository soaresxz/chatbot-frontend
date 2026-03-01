export type UserRole = "super_admin" | "clinic_user"

export interface User {
  email: string
  name: string
  role: UserRole
  tenant_id?: string
}

export interface Tenant {
  id: string
  name: string
  dentist_name: string
  whatsapp_number: string
  plan: string
  is_active: boolean
  created_at?: string
}

export interface Conversation {
  id: string
  patient_name: string
  patient_phone: string
  last_message: string
  last_message_time: string
  status: "ai_mode" | "human_mode"
  updated_at: string
  unread_count: number
}

export interface Message {
  id: string
  content: string
  direction: "in" | "out"
  timestamp: string
  sender_name?: string
}

export interface ApiConfig {
  baseUrl: string
  apiKey: string
}
