// lib/api.ts
import { useCallback } from "react"
import { useApiConfig } from "./api-config"


export function useApi() {
  const { buildUrl } = useApiConfig()

  return {
    // Clínicas
    async listTenants() {
      const res = await fetch(buildUrl("/admin/tenants"))
      if (!res.ok) throw new Error("Erro ao listar clínicas")
      return res.json()
    },

    async createTenant(data: {
      name: string
      dentist_name: string
      whatsapp_number: string
      plan?: "basic" | "premium"
    }) {
      const url = buildUrl("/admin/create-tenant", {
        name: data.name,
        dentist_name: data.dentist_name,
        whatsapp_number: data.whatsapp_number,
        plan: data.plan || "basic",
      })

      const res = await fetch(url)
      if (!res.ok) throw new Error("Erro ao criar clínica")
      return res.json()
    },

    // Conversas
    async listConversations(tenant_id: string) {
      const res = await fetch(buildUrl("/api/v1/conversations", { tenant_id }))
      if (!res.ok) throw new Error("Erro ao buscar conversas")
      return res.json()
    },

    async getConversation(tenant_id: string, patient_phone: string) {
      const res = await fetch(buildUrl(`/api/v1/conversations/${patient_phone}`, { tenant_id }))
      if (!res.ok) throw new Error("Erro ao buscar mensagens")
      return res.json()
    },

    async assumeConversation(tenant_id: string, patient_phone: string) {
      const url = buildUrl("/api/v1/conversations/assume", { tenant_id, patient_phone })
      const res = await fetch(url, { method: "POST" })
      if (!res.ok) throw new Error("Erro ao assumir conversa")
      return res.json()
    },
  }
}