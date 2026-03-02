'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useApi } from '@/lib/hooks/useApi';
import { useApiConfig } from '@/lib/hooks/useApiConfig';
import type { Tenant } from '@/lib/types';

export default function ClinicasPage() {
  const { listTenants } = useApi();
  const { config } = useApiConfig();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const loadClinicas = async () => {
    console.log("🔄 Iniciando loadClinicas... apiKey:", !!config.apiKey);

    if (!config.apiKey) {
      console.warn("⚠️ Sem apiKey no config");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await listTenants();
      console.log("✅ Dados recebidos do backend:", data);

      const clinicasList = data?.clinicas || [];
      setTenants(clinicasList);
      setTotal(data?.total || clinicasList.length);

      console.log(`📊 Setou ${clinicasList.length} clínicas no estado`);
    } catch (err: any) {
      console.error("❌ Erro ao carregar clínicas:", err);
      toast.error("Erro ao carregar clínicas. Verifique a API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClinicas();
  }, [config.apiKey]);

  // Filtro seguro
  const filteredTenants = Array.isArray(tenants)
    ? tenants.filter((t) =>
        t.nome?.toLowerCase().includes(search.toLowerCase()) ||
        t.dentista?.toLowerCase().includes(search.toLowerCase()) ||
        t.whatsapp?.includes(search)
      )
    : [];

  console.log("🎯 Estado atual - tenants:", tenants.length, " | filtered:", filteredTenants.length);

  // ==================== JSX ====================
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Clínicas</h1>
          <p className="text-gray-400">Gerencie todas as clínicas cadastradas na plataforma</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl font-medium flex items-center gap-2"
        >
          + Nova Clínica
        </button>
      </div>

      {/* Barra de busca */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Buscar por nome, dentista ou WhatsApp..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-3 pl-12 focus:outline-none focus:border-green-600"
        />
        <button
          onClick={loadClinicas}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 hover:text-green-400"
        >
          🔄 Atualizar
        </button>
      </div>

      {loading && (
        <div className="text-center py-20 text-gray-400">Carregando clínicas...</div>
      )}

      {!loading && filteredTenants.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-16 text-center">
          <div className="mx-auto w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-6">
            📋
          </div>
          <h3 className="text-2xl font-semibold mb-2">Nenhuma clínica cadastrada</h3>
          <p className="text-gray-400">Crie a primeira clínica clicando no botão acima</p>
        </div>
      )}

      {!loading && filteredTenants.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
          {/* AQUI VAI SUA TABELA */}
          {/* Exemplo simples para testar: */}
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left p-6">Nome</th>
                <th className="text-left p-6">Dentista</th>
                <th className="text-left p-6">WhatsApp</th>
                <th className="text-left p-6">Plano</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((clinica) => (
                <tr key={clinica.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                  <td className="p-6 font-medium">{clinica.nome}</td>
                  <td className="p-6">{clinica.dentista}</td>
                  <td className="p-6 text-green-400">{clinica.whatsapp}</td>
                  <td className="p-6">{clinica.plano}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}