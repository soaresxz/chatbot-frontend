"use client"

import { useState } from "react"
import type { Conversation } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Bot, Phone, UserRound } from "lucide-react"
import { toast } from "sonner"

interface ConversationListProps {
  conversations: Conversation[]
  onTakeOver: (id: string) => void
  onReleaseToAi: (id: string) => void
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "agora"
  if (minutes < 60) return `${minutes}min atras`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h atras`
  const days = Math.floor(hours / 24)
  return `${days}d atras`
}

export function ConversationList({
  conversations,
  onTakeOver,
  onReleaseToAi,
}: ConversationListProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<"take_over" | "release" | null>(null)

  function handleConfirm() {
    if (!confirmId || !confirmAction) return
    if (confirmAction === "take_over") {
      onTakeOver(confirmId)
      toast.success("Voce assumiu a conversa. O chatbot IA foi pausado para este paciente.")
    } else {
      onReleaseToAi(confirmId)
      toast.success("Conversa devolvida para a IA.")
    }
    setConfirmId(null)
    setConfirmAction(null)
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className="flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/30 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3 sm:items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <UserRound className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{conv.patient_name}</span>
                  {conv.unread_count > 0 && (
                    <Badge className="h-5 min-w-5 justify-center rounded-full px-1.5 text-xs">
                      {conv.unread_count}
                    </Badge>
                  )}
                </div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {conv.patient_phone}
                </span>
                <p className="line-clamp-1 text-sm text-muted-foreground">
                  {conv.last_message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:shrink-0">
              <span className="text-xs text-muted-foreground">
                {formatTimeAgo(conv.updated_at)}
              </span>

              {conv.status === "ai_mode" ? (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Bot className="h-3 w-3" />
                    IA
                  </Badge>
                  <Button
                    size="sm"
                    className="gap-1.5 bg-orange-600 font-semibold text-orange-50 hover:bg-orange-700"
                    onClick={() => {
                      setConfirmId(conv.id)
                      setConfirmAction("take_over")
                    }}
                  >
                    <UserRound className="h-4 w-4" />
                    Assumir Conversa
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="gap-1 border-orange-500/30 text-orange-500"
                  >
                    <UserRound className="h-3 w-3" />
                    Humano
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => {
                      setConfirmId(conv.id)
                      setConfirmAction("release")
                    }}
                  >
                    <Bot className="h-4 w-4" />
                    Devolver para IA
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <AlertDialog
        open={!!confirmId}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmId(null)
            setConfirmAction(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "take_over"
                ? "Assumir Conversa?"
                : "Devolver para IA?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "take_over"
                ? "O chatbot IA sera pausado para este paciente. Voce passara a responder diretamente. Deseja continuar?"
                : "O chatbot IA voltara a responder automaticamente para este paciente. Deseja continuar?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                confirmAction === "take_over"
                  ? "bg-orange-600 text-orange-50 hover:bg-orange-700"
                  : ""
              }
            >
              {confirmAction === "take_over" ? "Sim, Assumir" : "Sim, Devolver"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
