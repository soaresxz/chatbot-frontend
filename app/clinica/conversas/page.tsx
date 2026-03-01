"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useApiConfig } from "@/lib/api-config"
import type { Conversation, Message } from "@/lib/types"
import { ChatView } from "@/components/clinic/chat-view"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
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
import {
  ArrowLeft,
  Bot,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

function formatTimeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return "agora"
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
  } catch {
    return ""
  }
}

export default function ConversasPage() {
  const { user } = useAuth()
  const { buildUrl, config } = useApiConfig()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [search, setSearch] = useState("")
  const [confirmAction, setConfirmAction] = useState<{
    phone: string
    action: "take_over" | "release"
  } | null>(null)
  const [mobileShowChat, setMobileShowChat] = useState(false)

  const tenantId = user?.tenant_id || ""

  const fetchConversations = useCallback(async () => {
    if (!config.apiKey || !tenantId) {
      setLoadingConversations(false)
      return
    }
    setLoadingConversations(true)
    try {
      const url = buildUrl("/api/v1/conversations", { tenant_id: tenantId })
      const res = await fetch(url)
      if (!res.ok) throw new Error("Falha ao buscar conversas")
      const data = await res.json()
      const list: Conversation[] = Array.isArray(data)
        ? data
        : data.conversations || []
      setConversations(list)
    } catch {
      toast.error(
        "Erro ao carregar conversas. Verifique suas configuracoes de API."
      )
    } finally {
      setLoadingConversations(false)
    }
  }, [buildUrl, config.apiKey, tenantId])

  const fetchMessages = useCallback(
    async (phone: string) => {
      if (!config.apiKey || !tenantId) return
      setLoadingMessages(true)
      try {
        const url = buildUrl(`/api/v1/conversations/${encodeURIComponent(phone)}`, {
          tenant_id: tenantId,
        })
        const res = await fetch(url)
        if (!res.ok) throw new Error("Falha ao buscar mensagens")
        const data = await res.json()
        const msgs: Message[] = Array.isArray(data)
          ? data
          : data.messages || []
        setMessages(msgs)
      } catch {
        toast.error("Erro ao carregar mensagens.")
        setMessages([])
      } finally {
        setLoadingMessages(false)
      }
    },
    [buildUrl, config.apiKey, tenantId]
  )

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (selectedPhone) {
      fetchMessages(selectedPhone)
    }
  }, [selectedPhone, fetchMessages])

  function handleSelectConversation(phone: string) {
    setSelectedPhone(phone)
    setMobileShowChat(true)
  }

  function handleBackToList() {
    setMobileShowChat(false)
    setSelectedPhone(null)
    setMessages([])
  }

  async function handleAssumir(phone: string) {
    try {
      const url = buildUrl("/api/v1/conversations/assume", { tenant_id: tenantId })
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_phone: phone }),
      })
      if (!res.ok) throw new Error("Falha ao assumir conversa")
      toast.success(
        "Voce assumiu a conversa. O chatbot IA foi pausado para este paciente."
      )
      setConversations((prev) =>
        prev.map((c) =>
          c.patient_phone === phone
            ? { ...c, status: "human_mode" as const }
            : c
        )
      )
    } catch {
      toast.error("Erro ao assumir conversa.")
    }
    setConfirmAction(null)
  }

  async function handleDevolverIA(phone: string) {
    try {
      const url = buildUrl("/api/v1/conversations/release", { tenant_id: tenantId })
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_phone: phone }),
      })
      if (!res.ok) throw new Error("Falha ao devolver conversa")
      toast.success("Conversa devolvida para a IA.")
      setConversations((prev) =>
        prev.map((c) =>
          c.patient_phone === phone
            ? { ...c, status: "ai_mode" as const }
            : c
        )
      )
    } catch {
      toast.error("Erro ao devolver conversa para a IA.")
    }
    setConfirmAction(null)
  }

  const filtered = conversations.filter(
    (c) =>
      c.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.patient_phone?.includes(search) ||
      c.last_message?.toLowerCase().includes(search.toLowerCase())
  )

  const selectedConversation = conversations.find(
    (c) => c.patient_phone === selectedPhone
  )

  const aiCount = conversations.filter((c) => c.status === "ai_mode").length
  const humanCount = conversations.filter(
    (c) => c.status === "human_mode"
  ).length

  // No API key configured state
  if (!config.apiKey) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">
            Conversas
          </h1>
          <p className="text-muted-foreground">
            Gerencie as conversas do WhatsApp da sua clinica
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed bg-card py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">API nao configurada</h3>
            <p className="text-sm text-muted-foreground">
              Va ate Configuracoes para definir sua API Key antes de visualizar
              conversas.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col gap-0 -m-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-card/50 px-6 py-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Conversas</h1>
            <p className="text-sm text-muted-foreground">
              WhatsApp da clinica
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 px-2.5 py-1">
            <span className="h-2 w-2 rounded-full bg-primary" />
            IA: {aiCount}
          </Badge>
          <Badge
            variant="outline"
            className="gap-1.5 border-orange-500/30 px-2.5 py-1 text-orange-500"
          >
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            Humano: {humanCount}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchConversations}
            className="h-8 w-8"
            aria-label="Atualizar conversas"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: Conversation list */}
        <div
          className={cn(
            "flex w-full flex-col border-r md:w-80 lg:w-96",
            mobileShowChat && "hidden md:flex"
          )}
        >
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar conversa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="flex flex-col gap-1 p-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg p-3">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  {search
                    ? "Nenhuma conversa encontrada"
                    : "Nenhuma conversa ainda"}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5 p-1.5">
                {filtered.map((conv) => (
                  <button
                    key={conv.patient_phone}
                    onClick={() =>
                      handleSelectConversation(conv.patient_phone)
                    }
                    className={cn(
                      "flex items-center gap-3 rounded-lg p-3 text-left transition-colors w-full",
                      selectedPhone === conv.patient_phone
                        ? "bg-accent"
                        : "hover:bg-accent/50"
                    )}
                  >
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <UserRound className="h-5 w-5 text-primary" />
                      {conv.unread_count > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {conv.patient_name || conv.patient_phone}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatTimeAgo(conv.updated_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {conv.status === "human_mode" && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                        )}
                        <p className="truncate text-xs text-muted-foreground">
                          {conv.last_message || "Sem mensagens"}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right panel: Chat view */}
        <div
          className={cn(
            "flex flex-1 flex-col",
            !mobileShowChat && "hidden md:flex"
          )}
        >
          {selectedPhone && selectedConversation ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToList}
                  className="h-8 w-8 md:hidden"
                  aria-label="Voltar para lista"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <UserRound className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-medium">
                    {selectedConversation.patient_name ||
                      selectedConversation.patient_phone}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {selectedConversation.patient_phone}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedConversation.status === "ai_mode" ? (
                    <>
                      <Badge variant="secondary" className="gap-1">
                        <Bot className="h-3 w-3" />
                        IA
                      </Badge>
                      <Button
                        size="sm"
                        className="gap-1.5 bg-orange-600 font-semibold text-orange-50 hover:bg-orange-700"
                        onClick={() =>
                          setConfirmAction({
                            phone: selectedPhone,
                            action: "take_over",
                          })
                        }
                      >
                        <UserRound className="h-4 w-4" />
                        Assumir Conversa
                      </Button>
                    </>
                  ) : (
                    <>
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
                        onClick={() =>
                          setConfirmAction({
                            phone: selectedPhone,
                            action: "release",
                          })
                        }
                      >
                        <Bot className="h-4 w-4" />
                        Devolver para IA
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fetchMessages(selectedPhone)}
                    className="h-8 w-8"
                    aria-label="Recarregar mensagens"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Chat messages */}
              <ChatView
                messages={messages}
                loading={loadingMessages}
                patientPhone={selectedPhone}
              />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <MessageSquare className="h-7 w-7 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    Selecione uma conversa
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Escolha uma conversa na lista ao lado para visualizar as
                    mensagens
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === "take_over"
                ? "Assumir Conversa?"
                : "Devolver para IA?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === "take_over"
                ? "O chatbot IA sera pausado para este paciente. Voce passara a responder diretamente. Deseja continuar?"
                : "O chatbot IA voltara a responder automaticamente para este paciente. Deseja continuar?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction?.action === "take_over") {
                  handleAssumir(confirmAction.phone)
                } else if (confirmAction) {
                  handleDevolverIA(confirmAction.phone)
                }
              }}
              className={
                confirmAction?.action === "take_over"
                  ? "bg-orange-600 text-orange-50 hover:bg-orange-700"
                  : ""
              }
            >
              {confirmAction?.action === "take_over"
                ? "Sim, Assumir"
                : "Sim, Devolver"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
