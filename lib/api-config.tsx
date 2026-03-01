"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { ApiConfig } from "./types"

interface ApiConfigContextType {
  config: ApiConfig
  updateConfig: (config: ApiConfig) => void
  buildUrl: (path: string, params?: Record<string, string>) => string
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
      if (config.apiKey) {
        url.searchParams.set("api_key", config.apiKey)
      }
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.set(key, value)
        })
      }
      return url.toString()
    },
    [config]
  )

  return (
    <ApiConfigContext.Provider value={{ config, updateConfig, buildUrl }}>
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
