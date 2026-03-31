import type { ChatbotConfig } from "@duran-chatbot/config"

const CONFIG_PATH = "/api/config"

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string; details?: string }
    if (data.error && data.details) {
      return `${data.error}: ${data.details}`
    }
    if (data.error) {
      return data.error
    }
  } catch {
    const text = await response.text().catch(() => "")
    if (text) {
      return text
    }
  }

  return fallback
}

export async function fetchConfig(): Promise<ChatbotConfig> {
  const response = await fetch(CONFIG_PATH)
  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, `Failed to fetch config (${response.status})`),
    )
  }
  return response.json()
}

export async function saveConfig(config: ChatbotConfig): Promise<void> {
  const response = await fetch(CONFIG_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  })
  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, `Failed to save config (${response.status})`),
    )
  }
}
