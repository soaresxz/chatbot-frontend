"use client";

import { useCallback, useEffect, useState } from "react"
import { useApiConfig } from "@/lib/api-config"
import { useApi } from "@/lib/api";
import { toast } from "sonner"
import type { Tenant } from "@/lib/types"
import { ClinicsTable } from "@/components/admin/clinics-table"
import { CreateClinicDialog } from "@/components/admin/create-clinic-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Building2, Plus, RefreshCw, Search } from "lucide-react"


export default function ClinicasPage() {
  const { listTenants } = useApi();
  const { buildUrl, config } = useApiConfig();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [ total, setTotal ] = useState(0); // ✅ FIX 2: estado total removido, não é necessário
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const loadClinics = useCallback(async () => {
    if (!config.apiKey) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await listTenants();
      setTenants(data.tenants ?? data ?? []);
      setTotal(data.total || (data.tenants ? data.tenants.length : 0)); // ✅ FIX 2: total calculado a partir dos tenants, se disponível
    } catch (err: any) {
      console.error("Erro ao carregar clinicas:", err);
      toast.error("Erro ao carregar clinicas. Verifique suas configuracoes de API.");
    } finally {
      setLoading(false);
    }
  }, [listTenants, config.apiKey]);


  useEffect(() => {
    loadClinics();
  }, [config.apiKey]);

  const filteredTenants = Array.isArray(tenants) ? tenants.filter((t) => 
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.dentist_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.whatsapp_number?.includes(search)
  ) : [];
  // ✅ FIX 3: criação via POST com body JSON (não GET com query params)
  async function handleCreateClinic(data: {
    name: string
    dentist_name: string
    whatsapp_number: string
    plan: string
  }) {
    try {
      const res = await fetch(buildUrl("/admin/create-tenant"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Falha ao criar clinica")
      toast.success("Clinica criada com sucesso!")
      setCreateOpen(false)
      await loadClinics() // ✅ FIX 1: recarrega a lista após criação, usando a função de carregamento que já existe
    } catch (err: any) {
      toast.error("Erro ao criar clinica. Tente novamente.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">Clinicas</h1>
          <p className="text-muted-foreground">
            Gerencie todas as clinicas cadastradas na plataforma
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Clinica
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, dentista ou WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon" onClick={loadClinics} aria-label="Atualizar lista">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {!config.apiKey ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed bg-card py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">API nao configurada</h3>
            <p className="text-sm text-muted-foreground">
              Va ate Configuracoes para definir sua API Key antes de gerenciar clinicas.
            </p>
          </div>
        </div>
      ) : loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed bg-card py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">
              {search ? "Nenhuma clinica encontrada" : "Nenhuma clinica cadastrada"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {search
                ? "Tente alterar os termos de busca"
                : "Crie a primeira clinica clicando no botao acima"}
            </p>
          </div>
        </div>
      ) : (
        <ClinicsTable tenants={filteredTenants} onRefresh={loadClinics} />
      )}

      <CreateClinicDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreateClinic}
      />
    </div>
  )
}