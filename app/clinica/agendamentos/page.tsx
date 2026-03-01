"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Phone, RefreshCw, UserRound } from "lucide-react"

const MOCK_APPOINTMENTS = [
  {
    id: "1",
    patient_name: "Maria Silva",
    patient_phone: "+5511988887777",
    date: "2026-03-02",
    time: "09:00",
    service: "Limpeza",
    status: "confirmado",
  },
  {
    id: "2",
    patient_name: "Joao Santos",
    patient_phone: "+5511977776666",
    date: "2026-03-02",
    time: "10:30",
    service: "Consulta de avaliacao",
    status: "pendente",
  },
  {
    id: "3",
    patient_name: "Ana Oliveira",
    patient_phone: "+5511966665555",
    date: "2026-03-02",
    time: "14:00",
    service: "Clareamento",
    status: "confirmado",
  },
  {
    id: "4",
    patient_name: "Carlos Lima",
    patient_phone: "+5511955554444",
    date: "2026-03-03",
    time: "08:30",
    service: "Extracao",
    status: "pendente",
  },
  {
    id: "5",
    patient_name: "Fernanda Costa",
    patient_phone: "+5511944443333",
    date: "2026-03-03",
    time: "11:00",
    service: "Restauracao",
    status: "confirmado",
  },
]

function statusBadge(status: string) {
  if (status === "confirmado") {
    return <Badge>Confirmado</Badge>
  }
  return (
    <Badge
      variant="outline"
      className="border-orange-500/30 text-orange-500"
    >
      Pendente
    </Badge>
  )
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T12:00:00")
  return date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  })
}

export default function AgendamentosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">
            Agendamentos
          </h1>
          <p className="text-muted-foreground">
            Gerencie os agendamentos da sua clinica
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hoje
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">agendamentos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Amanha
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">agendamentos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              aguardando confirmacao
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proximos Agendamentos</CardTitle>
          <CardDescription>
            Lista de consultas agendadas via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Paciente
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Data
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Horario
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Servico
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_APPOINTMENTS.map((apt) => (
                    <tr
                      key={apt.id}
                      className="border-b last:border-0 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <UserRound className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{apt.patient_name}</p>
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {apt.patient_phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(apt.date)}
                      </td>
                      <td className="px-4 py-3 font-medium">{apt.time}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {apt.service}
                      </td>
                      <td className="px-4 py-3">{statusBadge(apt.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
