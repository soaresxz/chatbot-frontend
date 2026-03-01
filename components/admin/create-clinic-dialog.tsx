"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CreateClinicDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    name: string
    dentist_name: string
    whatsapp_number: string
    plan: string
  }) => void
}

export function CreateClinicDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateClinicDialogProps) {
  const [name, setName] = useState("")
  const [dentistName, setDentistName] = useState("")
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [plan, setPlan] = useState("basico")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    await onSubmit({ name, dentist_name: dentistName, whatsapp_number: whatsappNumber, plan })
    setSubmitting(false)
    setName("")
    setDentistName("")
    setWhatsappNumber("")
    setPlan("basico")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Clinica</DialogTitle>
          <DialogDescription>
            Preencha os dados para cadastrar uma nova clinica na plataforma.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="clinic-name">Nome da Clinica</Label>
            <Input
              id="clinic-name"
              placeholder="Ex: Clinica Odonto Sorriso"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="dentist-name">Nome do Dentista</Label>
            <Input
              id="dentist-name"
              placeholder="Ex: Dr. Joao Silva"
              value={dentistName}
              onChange={(e) => setDentistName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="whatsapp">Numero do WhatsApp</Label>
            <Input
              id="whatsapp"
              placeholder="Ex: +5511999999999"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="plan">Plano</Label>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger id="plan">
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basico">Basico</SelectItem>
                <SelectItem value="profissional">Profissional</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Criando...
                </span>
              ) : (
                "Criar Clinica"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
