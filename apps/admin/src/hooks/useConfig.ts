import { useCallback, useEffect, useState } from "react"
import type { ChatbotConfig } from "@duran-chatbot/config"
import { fetchConfig, saveConfig } from "@/api/config"

export function useConfig(profileSlug?: string) {
  const [config, setConfig] = useState<ChatbotConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchConfig(profileSlug)
      setConfig(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load config")
    } finally {
      setLoading(false)
    }
  }, [profileSlug])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const updateConfig = async (newConfig: ChatbotConfig) => {
    try {
      setSaving(true)
      await saveConfig(newConfig, profileSlug)
      setConfig(newConfig)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save config")
      return false
    } finally {
      setSaving(false)
    }
  }

  return { config, loading, error, saving, updateConfig, reload: loadConfig }
}
