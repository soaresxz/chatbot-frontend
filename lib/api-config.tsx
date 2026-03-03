"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { ApiConfig } from "./types"

interface ApiConfigContextType {
  config: ApiConfig
  updateConfig: (config: ApiConfig) => void
  buildUrl: (path: string, params?: Record<string, string>) => string
  authHeaders: () => Record<string, string>
}

const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: "https://chatbotia-production.up.railway.app",
  apiKey: "",
}

const ApiConfigContext = createContext<ApiConfigContextType | undefined>(undefined)

export function ApiConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ApiConfig>(DEFAULT_CONFIG)

  useEffect(() => {
    const stored = localStorage.getItem("odontoia_api_config")
    if (stored) {
      try {
        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(stored) })
      } catch {
        // ignore
      }
    }
  }, [])

  const updateConfig = useCallback((newConfig: ApiConfig) => {
    setConfig(newConfig)
    localStorage.setItem("odontoia_api_config", JSON.stringify(newConfig))
  }, [])

  const buildUrl = useCallback(
    (path: string, params?: Record<string, string>) => {
      const base = config.baseUrl.replace(/\/+$/, "")
      const url = new URL(`${base}${path}`)
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.set(key, value)
        })
      }
      return url.toString()
    },
    [config]
  )

  // ✅ Retorna headers com JWT para usar em todas as chamadas autenticadas
  const authHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem("odontoia_token")
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }, [])

  return (
    <ApiConfigContext.Provider value={{ config, updateConfig, buildUrl, authHeaders }}>
      {children}
    </ApiConfigContext.Provider>
  )
}

export function useApiConfig() {
  const context = useContext(ApiConfigContext)
  if (context === undefined) {
    throw new Error("useApiConfig deve ser usado dentro de um ApiConfigProvider")
  }
  return context
}