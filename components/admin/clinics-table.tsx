"use client"

import type { Tenant } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Power, Phone } from "lucide-react"

interface ClinicsTableProps {
  tenants: Tenant[]
  onRefresh: () => void
}

export function ClinicsTable({ tenants }: ClinicsTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Clinica
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Dentista
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                WhatsApp
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Plano
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Acoes
              </th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr
                key={tenant.id}
                className="border-b last:border-0 transition-colors hover:bg-muted/30"
              >
                <td className="px-4 py-3 font-medium">{tenant.name || tenant.id}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {tenant.dentist_name || "-"}
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {tenant.whatsapp_number || "-"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="secondary" className="capitalize">
                    {tenant.plan || "basico"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={tenant.is_active !== false ? "default" : "destructive"}
                    className="gap-1"
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        tenant.is_active !== false ? "bg-primary-foreground" : "bg-destructive-foreground"
                      }`}
                    />
                    {tenant.is_active !== false ? "Ativa" : "Inativa"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Acoes</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Pencil className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                        <Power className="h-4 w-4" />
                        {tenant.is_active !== false ? "Desativar" : "Ativar"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
