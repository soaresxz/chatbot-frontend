"use client"

import { SettingsForm } from "@/components/settings-form"

export default function AdminConfiguracoesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">Configuracoes</h1>
        <p className="text-muted-foreground">
          Configure a conexao com a API do chatbot
        </p>
      </div>
      <SettingsForm />
    </div>
  )
}
