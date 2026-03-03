import { useCallback } from "react"
import { useApiConfig } from "./api-config"

export function useApi() {
  const { buildUrl, authHeaders } = useApiConfig()

  // ─── ADMIN ───────────────────────────────────────────────

  const listTenants = useCallback(async () => {
    const res = await fetch(buildUrl("/admin/tenants"), {
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error("Erro ao listar clínicas")
    return res.json()
  }, [buildUrl, authHeaders])

  const createTenant = useCallback(async (data: {
    name: string
    dentist_name: string
    whatsapp_number: string
    plan?: "basic" | "premium"
  }) => {
    const res = await fetch(
      buildUrl("/admin/create-tenant", {
        name: data.name,
        dentist_name: data.dentist_name,
        whatsapp_number: data.whatsapp_number,
        plan: data.plan || "basic",
      }),
      { headers: authHeaders() }
    )
    if (!res.ok) throw new Error("Erro ao criar clínica")
    return res.json()
  }, [buildUrl, authHeaders])

  // ─── CONVERSAS ───────────────────────────────────────────

  const listConversations = useCallback(async (tenant_id: string) => {
    const res = await fetch(buildUrl("/api/v1/conversations", { tenant_id }), {
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error("Erro ao buscar conversas")
    return res.json()
  }, [buildUrl, authHeaders])

  const getConversation = useCallback(async (tenant_id: string, patient_phone: string) => {
    const res = await fetch(
      buildUrl(`/api/v1/conversations/${encodeURIComponent(patient_phone)}`, { tenant_id }),
      { headers: authHeaders() }
    )
    if (!res.ok) throw new Error("Erro ao buscar mensagens")
    return res.json()
  }, [buildUrl, authHeaders])

  const assumeConversation = useCallback(async (tenant_id: string, patient_phone: string) => {
    const res = await fetch(
      buildUrl("/api/v1/conversations/assume", { tenant_id }),
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ patient_phone }),
      }
    )
    if (!res.ok) throw new Error("Erro ao assumir conversa")
    return res.json()
  }, [buildUrl, authHeaders])

  const releaseConversation = useCallback(async (tenant_id: string, patient_phone: string) => {
    const res = await fetch(
      buildUrl("/api/v1/conversations/release", { tenant_id }),
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ patient_phone }),
      }
    )
    if (!res.ok) throw new Error("Erro ao devolver conversa")
    return res.json()
  }, [buildUrl, authHeaders])

  const sendHumanMessage = useCallback(async (data: {
    tenant_id: string
    patient_phone: string
    message: string
  }) => {
    const res = await fetch(buildUrl("/api/human-send"), {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Erro ao enviar mensagem")
    return res.json()
  }, [buildUrl, authHeaders])

  // ─── DASHBOARD ───────────────────────────────────────────

  const getClinicaDashboard = useCallback(async (tenant_id: string) => {
    const res = await fetch(buildUrl(`/dashboard/clinica/${tenant_id}`), {
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error("Erro ao buscar dashboard")
    return res.json()
  }, [buildUrl, authHeaders])

  const getAdminReports = useCallback(async () => {
    const res = await fetch(buildUrl("/reports/admin"), {
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error("Erro ao buscar relatórios")
    return res.json()
  }, [buildUrl, authHeaders])

  // ─── PACIENTES ───────────────────────────────────────────

  const listPacientes = useCallback(async (tenant_id: string) => {
    const res = await fetch(buildUrl(`/clinica/${tenant_id}/pacientes`), {
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error("Erro ao listar pacientes")
    return res.json()
  }, [buildUrl, authHeaders])

  const createPaciente = useCallback(async (
    tenant_id: string,
    data: { nome: string; telefone: string }
  ) => {
    const res = await fetch(buildUrl(`/clinica/${tenant_id}/pacientes`), {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Erro ao criar paciente")
    return res.json()
  }, [buildUrl, authHeaders])

  return {
    listTenants,
    createTenant,
    listConversations,
    getConversation,
    assumeConversation,
    releaseConversation,
    sendHumanMessage,
    getClinicaDashboard,
    getAdminReports,
    listPacientes,
    createPaciente,
  }
}