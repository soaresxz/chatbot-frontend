"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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
  Send,
  UserRound,
  Wifi,
  WifiOff,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

function formatTimeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return "agora"
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`
    return `${Math.floor(hours / 24)}d`
  } catch {
    return ""
  }
}

function normalizePhone(p: string | null | undefined): string {
  return p ? p.replace(/\D/g, "") : ""
}

export default function ConversasPage() {
  const { user } = useAuth()
  // ✅ authHeaders adicionado ao destructuring
  const { buildUrl, config, authHeaders } = useApiConfig()
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
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const selectedPhoneRef = useRef<string | null>(null)
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const tenantId = user?.tenant_id || ""

  // ─── FETCH CONVERSATIONS ───────────────────────────────────
  const fetchConversations = useCallback(async () => {
    const token = localStorage.getItem("odontoia_token")
    if (!token || !tenantId) {
      setLoadingConversations(false)
      return
    }
    setLoadingConversations(true)
    try {
      const res = await fetch(
        buildUrl("/api/v1/conversations", { tenant_id: tenantId }),
        { headers: authHeaders() } // ✅ token enviado
      )
      if (!res.ok) throw new Error()
      const data = await res.json()
      setConversations(Array.isArray(data) ? data : data.conversations || [])
    } catch {
      toast.error("Erro ao carregar conversas.")
    } finally {
      setLoadingConversations(false)
    }
  }, [buildUrl, authHeaders, tenantId])

  // ─── FETCH MESSAGES ───────────────────────────────────────
  const fetchMessages = useCallback(
    async (phone: string) => {
      const token = localStorage.getItem("odontoia_token")
      if (!token || !tenantId) return // ✅ guarda por token, não apiKey
      setLoadingMessages(true)
      try {
        const res = await fetch(
          buildUrl(`/api/v1/conversations/${encodeURIComponent(phone)}`, { tenant_id: tenantId }),
          { headers: authHeaders() } // ✅ token enviado
        )
        if (!res.ok) throw new Error()
        const data = await res.json()
        setMessages(Array.isArray(data) ? data : data.messages || [])
      } catch {
        toast.error("Erro ao carregar mensagens.")
        setMessages([])
      } finally {
        setLoadingMessages(false)
      }
    },
    [buildUrl, authHeaders, tenantId]
  )

  // ─── WEBSOCKET ────────────────────────────────────────────
  const connectWebSocket = useCallback(() => {
    const token = localStorage.getItem("odontoia_token")
    if (!token || !tenantId) return // ✅ guarda por token, não apiKey

    const wsBase = config.baseUrl.replace(/^http/, "ws").replace(/\/+$/, "")
    const ws = new WebSocket(`${wsBase}/ws`)
    wsRef.current = ws

    ws.onopen = () => {
      setWsConnected(true)
      console.log("✅ WebSocket conectado")
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        // ✅ Ignora pings e mensagens de outros tenants
        if (data.type === "ping") return
        if (data.tenant_id && data.tenant_id !== tenantId) return

        if (data.type === "new_message") {
          const msg = data.message
          const phone = data.patient_phone || msg?.patient_phone
          
          const cleanPhone = normalizePhone(phone)
          const cleanSelected = normalizePhone(selectedPhoneRef.current)

          console.log("[WS] new_message | phone:", cleanPhone, "| selected:", cleanSelected)

          setConversations((prev) => {
            const exists = prev.find((c) => normalizePhone(c.patient_phone) === cleanPhone)
            if (exists) {
              return prev.map((c) =>
                normalizePhone(c.patient_phone) === cleanPhone
                  ? { ...c, last_message: msg.content, updated_at: msg.timestamp }
                  : c
              )
            }
            fetchConversations()
            return prev
          })

          if (cleanSelected === cleanPhone) {
            console.log("[WS] Appending to active chat!", msg)
            setMessages((prev) => {
              const alreadyExists = prev.find((m) => m.id === msg.id)
              if (alreadyExists) return prev
              return [...prev, msg]
            })
          } else {
            console.log("[WS] Not appending because chat is inactive. active:", cleanSelected, "msg:", cleanPhone)
            toast.info(`Nova mensagem de ${phone}`)
          }
        }

        if (data.type === "status_change") {
          setConversations((prev) =>
            prev.map((c) =>
              normalizePhone(c.patient_phone) === normalizePhone(data.patient_phone)
                ? { ...c, status: data.status }
                : c
            )
          )
        }
      } catch {
        // ignora mensagens malformadas
      }
    }

    ws.onclose = () => {
      setWsConnected(false)
      console.log("🔌 WebSocket desconectado. Reconectando em 3s...")
      reconnectTimeout.current = setTimeout(connectWebSocket, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [config.baseUrl, tenantId, fetchConversations])

  // ─── EFFECTS ──────────────────────────────────────────────
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (selectedPhone) {
      selectedPhoneRef.current = selectedPhone
      fetchMessages(selectedPhone)
    } else {
      selectedPhoneRef.current = null
    }
  }, [selectedPhone, fetchMessages])

  useEffect(() => {
    connectWebSocket()
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
      wsRef.current?.close()
    }
  }, [connectWebSocket])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!wsConnected) fetchConversations()
    }, 15000)
    return () => clearInterval(interval)
  }, [wsConnected, fetchConversations])

  // ─── HANDLERS ─────────────────────────────────────────────
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
      const res = await fetch(buildUrl("/api/v1/conversations/assume", { tenant_id: tenantId }), {
        method: "POST",
        headers: authHeaders(), // ✅ token enviado
        body: JSON.stringify({ patient_phone: phone }),
      })
      if (!res.ok) throw new Error()
      toast.success("Você assumiu a conversa. O chatbot IA foi pausado.")
      setConversations((prev) =>
        prev.map((c) => c.patient_phone === phone ? { ...c, status: "human_mode" as const } : c)
      )
    } catch {
      toast.error("Erro ao assumir conversa.")
    }
    setConfirmAction(null)
  }

  async function handleDevolverIA(phone: string) {
    try {
      const res = await fetch(buildUrl("/api/v1/conversations/release", { tenant_id: tenantId }), {
        method: "POST",
        headers: authHeaders(), // ✅ token enviado
        body: JSON.stringify({ patient_phone: phone }),
      })
      if (!res.ok) throw new Error()
      toast.success("Conversa devolvida para a IA.")
      setConversations((prev) =>
        prev.map((c) => c.patient_phone === phone ? { ...c, status: "ai_mode" as const } : c)
      )
    } catch {
      toast.error("Erro ao devolver conversa para a IA.")
    }
    setConfirmAction(null)
  }

  async function handleSendMessage() {
    if (!newMessage.trim() || !selectedPhone || !tenantId) return
    setSendingMessage(true)
    try {
      const res = await fetch(buildUrl("/api/human-send"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          tenant_id: tenantId,
          patient_phone: selectedPhone,
          message: newMessage.trim(),
        }),
      })
      if (!res.ok) throw new Error()

      // ✅ Sem optimistic update — o WebSocket já adiciona a mensagem em tempo real
      setNewMessage("")
    } catch {
      toast.error("Erro ao enviar mensagem.")
    } finally {
      setSendingMessage(false)
    }
  }

  // ─── DERIVED STATE ────────────────────────────────────────
  const filtered = conversations.filter(
    (c) =>
      c.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.patient_phone?.includes(search) ||
      c.last_message?.toLowerCase().includes(search.toLowerCase())
  )

  const selectedConversation = conversations.find((c) => c.patient_phone === selectedPhone)
  const aiCount = conversations.filter((c) => c.status === "ai_mode").length
  const humanCount = conversations.filter((c) => c.status === "human_mode").length
  const isHumanMode = selectedConversation?.status === "human_mode"

  // ✅ guarda por token JWT, não por apiKey
  const token = typeof window !== "undefined" ? localStorage.getItem("odontoia_token") : null
  if (!token) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conversas</h1>
          <p className="text-muted-foreground">Gerencie as conversas do WhatsApp da sua clínica</p>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed bg-card py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">Sessão não encontrada</h3>
            <p className="text-sm text-muted-foreground">
              Faça login para acessar as conversas.
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
        <div>
          <h1 className="text-xl font-bold tracking-tight">Conversas</h1>
          <p className="text-sm text-muted-foreground">WhatsApp da clínica</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex items-center gap-1.5 text-xs",
              wsConnected ? "text-green-500" : "text-muted-foreground"
            )}
          >
            {wsConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {wsConnected ? "Ao vivo" : "Offline"}
          </span>
          <Badge variant="secondary" className="gap-1.5 px-2.5 py-1">
            <span className="h-2 w-2 rounded-full bg-primary" />
            IA: {aiCount}
          </Badge>
          <Badge variant="outline" className="gap-1.5 border-orange-500/30 px-2.5 py-1 text-orange-500">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            Humano: {humanCount}
          </Badge>
          <Button variant="ghost" size="icon" onClick={fetchConversations} className="h-8 w-8">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Lista */}
        <div className={cn("flex w-full flex-col border-r md:w-80 lg:w-96", mobileShowChat && "hidden md:flex")}>
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
                  {search ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5 p-1.5">
                {filtered.map((conv) => (
                  <button
                    key={conv.patient_phone}
                    onClick={() => handleSelectConversation(conv.patient_phone)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg p-3 text-left transition-colors w-full",
                      selectedPhone === conv.patient_phone ? "bg-accent" : "hover:bg-accent/50"
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

        {/* Chat */}
        <div className={cn("flex flex-1 flex-col", !mobileShowChat && "hidden md:flex")}>
          {selectedPhone && selectedConversation ? (
            <>
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <Button variant="ghost" size="icon" onClick={handleBackToList} className="h-8 w-8 md:hidden">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <UserRound className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-medium">
                    {selectedConversation.patient_name || selectedConversation.patient_phone}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {selectedConversation.patient_phone}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isHumanMode ? (
                    <>
                      <Badge variant="outline" className="gap-1 border-orange-500/30 text-orange-500">
                        <UserRound className="h-3 w-3" />
                        Humano
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => setConfirmAction({ phone: selectedPhone, action: "release" })}
                      >
                        <Bot className="h-4 w-4" />
                        Devolver para IA
                      </Button>
                    </>
                  ) : (
                    <>
                      <Badge variant="secondary" className="gap-1">
                        <Bot className="h-3 w-3" />
                        IA
                      </Badge>
                      <Button
                        size="sm"
                        className="gap-1.5 bg-orange-600 font-semibold text-orange-50 hover:bg-orange-700"
                        onClick={() => setConfirmAction({ phone: selectedPhone, action: "take_over" })}
                      >
                        <UserRound className="h-4 w-4" />
                        Assumir Conversa
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => fetchMessages(selectedPhone)} className="h-8 w-8">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ChatView messages={messages} loading={loadingMessages} patientPhone={selectedPhone} />

              {isHumanMode && (
                <div className="border-t bg-card/50 p-3">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      disabled={sendingMessage}
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
                    Você está respondendo diretamente. A IA está pausada.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <MessageSquare className="h-7 w-7 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Selecione uma conversa</h3>
                  <p className="text-sm text-muted-foreground">
                    Escolha uma conversa na lista ao lado para visualizar as mensagens
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === "take_over" ? "Assumir Conversa?" : "Devolver para IA?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === "take_over"
                ? "O chatbot IA será pausado para este paciente. Você passará a responder diretamente. Deseja continuar?"
                : "O chatbot IA voltará a responder automaticamente. Deseja continuar?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction?.action === "take_over") handleAssumir(confirmAction.phone)
                else if (confirmAction) handleDevolverIA(confirmAction.phone)
              }}
              className={confirmAction?.action === "take_over" ? "bg-orange-600 text-orange-50 hover:bg-orange-700" : ""}
            >
              {confirmAction?.action === "take_over" ? "Sim, Assumir" : "Sim, Devolver"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}