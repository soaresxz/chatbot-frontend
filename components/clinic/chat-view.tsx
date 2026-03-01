"use client"

import { useEffect, useRef } from "react"
import type { Message } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Bot, UserRound } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface ChatViewProps {
  messages: Message[]
  loading: boolean
  patientPhone: string
}

function formatTime(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return ""
  }
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return "Hoje"
    if (date.toDateString() === yesterday.toDateString()) return "Ontem"

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return ""
  }
}

function groupMessagesByDate(messages: Message[]): Record<string, Message[]> {
  const groups: Record<string, Message[]> = {}
  for (const msg of messages) {
    const dateKey = new Date(msg.timestamp).toDateString()
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(msg)
  }
  return groups
}

export function ChatView({ messages, loading, patientPhone }: ChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}
          >
            <Skeleton
              className={cn(
                "h-12 rounded-2xl",
                i % 2 === 0 ? "w-3/5" : "w-2/5"
              )}
            />
          </div>
        ))}
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Bot className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Nenhuma mensagem encontrada para {patientPhone}
          </p>
        </div>
      </div>
    )
  }

  const grouped = groupMessagesByDate(messages)

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
      {Object.entries(grouped).map(([dateKey, msgs]) => (
        <div key={dateKey} className="flex flex-col gap-2">
          <div className="flex items-center justify-center py-2">
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              {formatDate(msgs[0].timestamp)}
            </span>
          </div>
          {msgs.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.direction === "in" ? "justify-start" : "justify-end"
              )}
            >
              <div
                className={cn(
                  "flex max-w-[75%] items-end gap-2",
                  msg.direction === "in" ? "flex-row" : "flex-row-reverse"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    msg.direction === "in"
                      ? "bg-muted"
                      : "bg-primary/20"
                  )}
                >
                  {msg.direction === "in" ? (
                    <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
                <div
                  className={cn(
                    "flex flex-col gap-1 rounded-2xl px-4 py-2.5",
                    msg.direction === "in"
                      ? "rounded-bl-md bg-muted text-foreground"
                      : "rounded-br-md bg-primary text-primary-foreground"
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                  <span
                    className={cn(
                      "self-end text-[10px]",
                      msg.direction === "in"
                        ? "text-muted-foreground"
                        : "text-primary-foreground/70"
                    )}
                  >
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
