import { mergeWithDefaults, type ChatbotConfig } from "@duran-chatbot/config"

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

function configUrl(profileSlug?: string): string {
  return profileSlug ? `${CONFIG_PATH}?profile=${encodeURIComponent(profileSlug)}` : CONFIG_PATH
}

export async function fetchConfig(profileSlug?: string): Promise<ChatbotConfig> {
  const response = await fetch(configUrl(profileSlug))
  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, `Failed to fetch config (${response.status})`),
    )
  }
  const config = (await response.json()) as Partial<ChatbotConfig>
  return mergeWithDefaults(config)
}

export async function saveConfig(config: ChatbotConfig, profileSlug?: string): Promise<void> {
  const response = await fetch(configUrl(profileSlug), {
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
