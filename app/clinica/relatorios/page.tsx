"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import { Bot, MessageSquare, TrendingUp, Users } from "lucide-react"

const weekData = [
  { name: "Seg", conversas: 18, agendamentos: 5 },
  { name: "Ter", conversas: 22, agendamentos: 8 },
  { name: "Qua", conversas: 15, agendamentos: 3 },
  { name: "Qui", conversas: 28, agendamentos: 10 },
  { name: "Sex", conversas: 24, agendamentos: 7 },
  { name: "Sab", conversas: 12, agendamentos: 2 },
  { name: "Dom", conversas: 6, agendamentos: 0 },
]

const monthlyData = [
  { name: "Jan", pacientes: 45 },
  { name: "Fev", pacientes: 62 },
  { name: "Mar", pacientes: 78 },
  { name: "Abr", pacientes: 85 },
  { name: "Mai", pacientes: 92 },
  { name: "Jun", pacientes: 110 },
]

const TEAL = "#14b8a6"
const TEAL_LIGHT = "#2dd4bf"

const stats = [
  {
    label: "Conversas Hoje",
    value: "24",
    icon: MessageSquare,
    change: "+12% vs ontem",
  },
  {
    label: "Taxa de Automacao",
    value: "91%",
    icon: Bot,
    change: "+5% esta semana",
  },
  {
    label: "Pacientes Novos",
    value: "8",
    icon: Users,
    change: "+3 vs semana passada",
  },
  {
    label: "Agendamentos",
    value: "12",
    icon: TrendingUp,
    change: "+2 hoje",
  },
]

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload) return null
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-foreground">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

export default function ClinicRelatoriosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">
          Relatorios
        </h1>
        <p className="text-muted-foreground">
          Analise as metricas da sua clinica
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="flex items-center gap-1 text-xs text-primary">
                <TrendingUp className="h-3 w-3" />
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversas da Semana</CardTitle>
            <CardDescription>
              Conversas e agendamentos realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(0, 0%, 14%)"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(0, 0%, 14%)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(0, 0%, 14%)" }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="conversas"
                    name="Conversas"
                    fill={TEAL}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="agendamentos"
                    name="Agendamentos"
                    fill={TEAL_LIGHT}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Pacientes Atendidos por Mes
            </CardTitle>
            <CardDescription>
              Evolucao dos ultimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient
                      id="colorClinicPacientes"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor={TEAL} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(0, 0%, 14%)"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(0, 0%, 14%)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(0, 0%, 14%)" }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="pacientes"
                    name="Pacientes"
                    stroke={TEAL}
                    strokeWidth={2}
                    fill="url(#colorClinicPacientes)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
