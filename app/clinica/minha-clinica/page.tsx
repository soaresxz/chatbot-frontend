"use client"

import { useAuth } from "@/lib/auth-context"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Calendar,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react"

export default function MinhaClinicaPage() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">
          Minha Clinica
        </h1>
        <p className="text-muted-foreground">
          Informacoes e configuracoes da sua clinica
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" />
              Dados da Clinica
            </CardTitle>
            <CardDescription>Informacoes cadastrais</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{user?.name || "Clinica"}</p>
                <Badge variant="secondary" className="mt-0.5">
                  {user?.tenant_id || "N/A"}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col gap-3 rounded-lg bg-muted/50 p-4">
              <div className="flex items-center gap-3 text-sm">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Responsavel:</span>
                <span>Dr. Silva</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">WhatsApp:</span>
                <span>+55 11 99999-9999</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">E-mail:</span>
                <span>{user?.email || "N/A"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Endereco:</span>
                <span>Rua Exemplo, 123 - Sao Paulo, SP</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-primary" />
              Plano e Assinatura
            </CardTitle>
            <CardDescription>Detalhes do seu plano</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-lg bg-primary/10 p-4">
              <div>
                <p className="text-sm text-muted-foreground">Plano atual</p>
                <p className="text-lg font-bold text-primary">Profissional</p>
              </div>
              <Badge>Ativo</Badge>
            </div>
            <div className="flex flex-col gap-3 rounded-lg bg-muted/50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Mensagens enviadas
                </span>
                <span className="font-medium">1.234 / 5.000</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: "24.7%" }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Proxima renovacao
                </span>
                <span className="font-medium">15/04/2026</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Valor mensal</span>
                <span className="font-medium">R$ 297,00</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
