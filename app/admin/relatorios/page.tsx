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
  LineChart,
  Line,
} from "recharts"
import { BarChart3, Building2, TrendingUp } from "lucide-react"

const clinicPerformance = [
  { name: "Odonto Sorriso", conversas: 120, agendamentos: 45 },
  { name: "Clinica Dental Plus", conversas: 95, agendamentos: 38 },
  { name: "Sorrir Mais", conversas: 88, agendamentos: 32 },
  { name: "Dental Care", conversas: 75, agendamentos: 28 },
  { name: "Clinica Oral", conversas: 62, agendamentos: 22 },
]

const monthlyGrowth = [
  { name: "Jan", clinicas: 6, receita: 4200 },
  { name: "Fev", clinicas: 7, receita: 5100 },
  { name: "Mar", clinicas: 8, receita: 6400 },
  { name: "Abr", clinicas: 9, receita: 7200 },
  { name: "Mai", clinicas: 10, receita: 8500 },
  { name: "Jun", clinicas: 12, receita: 9800 },
]

const TEAL = "#14b8a6"
const TEAL_LIGHT = "#2dd4bf"

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

export default function RelatoriosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">
          Relatorios Globais
        </h1>
        <p className="text-muted-foreground">
          Analise metricas de todas as clinicas
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Clinicas
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="flex items-center gap-1 text-xs text-primary">
              <TrendingUp className="h-3 w-3" />
              +2 este mes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Mensal
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 9.800</div>
            <p className="flex items-center gap-1 text-xs text-primary">
              <TrendingUp className="h-3 w-3" />
              +15% vs mes anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversas Totais
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.450</div>
            <p className="flex items-center gap-1 text-xs text-primary">
              <TrendingUp className="h-3 w-3" />
              +22% este mes
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Desempenho por Clinica
            </CardTitle>
            <CardDescription>
              Top 5 clinicas por volume de conversas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clinicPerformance} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(0, 0%, 14%)"
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(0, 0%, 14%)" }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 11 }}
                    axisLine={{ stroke: "hsl(0, 0%, 14%)" }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="conversas"
                    name="Conversas"
                    fill={TEAL}
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="agendamentos"
                    name="Agendamentos"
                    fill={TEAL_LIGHT}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Crescimento da Plataforma
            </CardTitle>
            <CardDescription>
              Clinicas e receita ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyGrowth}>
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
                    yAxisId="left"
                    tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(0, 0%, 14%)" }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(0, 0%, 14%)" }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="clinicas"
                    name="Clinicas"
                    stroke={TEAL}
                    strokeWidth={2}
                    dot={{ fill: TEAL, r: 4 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="receita"
                    name="Receita (R$)"
                    stroke={TEAL_LIGHT}
                    strokeWidth={2}
                    dot={{ fill: TEAL_LIGHT, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
