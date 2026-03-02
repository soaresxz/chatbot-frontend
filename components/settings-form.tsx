"use client"

import { useState, useEffect } from "react"
import { useApiConfig } from "@/lib/api-config"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Globe, Key, Save, TestTube } from "lucide-react"

export function SettingsForm() {
  const { config, updateConfig } = useApiConfig()
  const [baseUrl, setBaseUrl] = useState(config.baseUrl)
  const [apiKey, setApiKey] = useState(config.apiKey)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    setBaseUrl(config.baseUrl)
    setApiKey(config.apiKey)
  }, [config])

  function handleSave() {
    updateConfig({ baseUrl: baseUrl.replace(/\/+$/, ""), apiKey })
    toast.success("Configuracoes salvas com sucesso!")
  }

  async function handleTest() {
    setTesting(true)
    try {
      const url = `${baseUrl.replace(/\/+$/, "")}/admin/tenants?api_key=${apiKey}`
      const res = await fetch(url)
      if (res.ok) {
        toast.success("Conexao com a API realizada com sucesso!")
      } else {
        toast.error(`Falha na conexao: Status ${res.status}`)
      }
    } catch {
      toast.error("Nao foi possivel conectar a API. Verifique a URL.")
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Configuracao da API</CardTitle>
        <CardDescription>
          Defina a URL base e a chave de acesso da API do chatbot
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="base-url" className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            URL Base da API
          </Label>
          <Input
            id="base-url"
            placeholder="https://chatbotia-production.up.railway.app"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Endereco do servidor da API do chatbot
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="api-key" className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            ADMIN_API_KEY
          </Label>
          <Input
            id="api-key"
            type="password"
            placeholder="Sua chave de API"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Chave de autenticacao para acessar os endpoints administrativos
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Salvar Configuracoes
          </Button>
          <Button variant="outline" onClick={handleTest} disabled={testing} className="gap-2">
            <TestTube className="h-4 w-4" />
            {testing ? "Testando..." : "Testar Conexao"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
