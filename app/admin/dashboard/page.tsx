"use client"

import {
  Building2,
  MessageSquare,
  Users,
  Zap,
  TrendingUp,
  Activity,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const stats = [
  {
    label: "Clinicas Ativas",
    value: "12",
    icon: Building2,
    change: "+2 este mes",
    trend: "up",
  },
  {
    label: "Conversas Hoje",
    value: "348",
    icon: MessageSquare,
    change: "+18% vs ontem",
    trend: "up",
  },
  {
    label: "Pacientes Atendidos",
    value: "1.245",
    icon: Users,
    change: "+156 esta semana",
    trend: "up",
  },
  {
    label: "Taxa de Automacao",
    value: "87%",
    icon: Zap,
    change: "+3% vs mes anterior",
    trend: "up",
  },
]

const conversationsData = [
  { name: "Seg", conversas: 45, humano: 8 },
  { name: "Ter", conversas: 52, humano: 12 },
  { name: "Qua", conversas: 48, humano: 6 },
  { name: "Qui", conversas: 61, humano: 15 },
  { name: "Sex", conversas: 55, humano: 10 },
  { name: "Sab", conversas: 32, humano: 4 },
  { name: "Dom", conversas: 18, humano: 2 },
]

const monthlyData = [
  { name: "Jan", pacientes: 180 },
  { name: "Fev", pacientes: 220 },
  { name: "Mar", pacientes: 310 },
  { name: "Abr", pacientes: 280 },
  { name: "Mai", pacientes: 350 },
  { name: "Jun", pacientes: 420 },
]

const planDistribution = [
  { name: "Basico", value: 4 },
  { name: "Profissional", value: 5 },
  { name: "Premium", value: 3 },
]

const TEAL = "#14b8a6"
const TEAL_LIGHT = "#2dd4bf"
const ORANGE = "#f97316"

const PIE_COLORS = [
  "hsl(0, 0%, 30%)",
  TEAL,
  TEAL_LIGHT,
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

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Visao geral da plataforma OdontoIA
        </p>
      </div>

      {/* Stats cards */}
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
              <div className="flex items-center gap-1 text-xs text-primary">
                <TrendingUp className="h-3 w-3" />
                {stat.change}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Conversations chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" />
              Conversas da Semana
            </CardTitle>
            <CardDescription>
              Total de conversas e atendimentos humanos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversationsData}>
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
                    name="IA"
                    fill={TEAL}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="humano"
                    name="Humano"
                    fill={ORANGE}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Plan distribution */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">
              Distribuicao de Planos
            </CardTitle>
            <CardDescription>
              Clinicas por tipo de plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    stroke="none"
                  >
                    {planDistribution.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4">
              {planDistribution.map((plan, i) => (
                <div key={plan.name} className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[i] }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {plan.name} ({plan.value})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly patients chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            Pacientes Atendidos por Mes
          </CardTitle>
          <CardDescription>
            Evolucao do atendimento nos ultimos 6 meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorPacientes" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#colorPacientes)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
