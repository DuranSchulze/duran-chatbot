import { mergeWithDefaults, type ChatbotConfig, type ChatbotProfile } from "@duran-chatbot/config"

const PROFILES_PATH = "/api/profiles"

async function getErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string; details?: string }
    if (data.error && data.details) return `${data.error}: ${data.details}`
    if (data.error) return data.error
  } catch {
    const text = await response.text().catch(() => "")
    if (text) return text
  }
  return fallback
}

export type ProfileMeta = {
  slug: string
  name: string
  status: "active" | "archived"
  createdAt: string
}

export async function fetchProfiles(): Promise<ProfileMeta[]> {
  const response = await fetch(PROFILES_PATH)
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Failed to fetch profiles (${response.status})`))
  }
  const data = (await response.json()) as { profiles?: ProfileMeta[] }
  return Array.isArray(data.profiles) ? data.profiles : []
}

export async function fetchProfile(slug: string): Promise<ChatbotProfile> {
  const response = await fetch(`${PROFILES_PATH}?slug=${encodeURIComponent(slug)}`)
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Failed to fetch profile (${response.status})`))
  }
  const data = (await response.json()) as Partial<ChatbotProfile>
  return {
    slug: data.slug ?? slug,
    name: data.name ?? "",
    status: data.status ?? "active",
    createdAt: data.createdAt ?? "",
    config: mergeWithDefaults(data.config ?? {}),
  }
}

export async function createProfile(name: string, slug?: string): Promise<ProfileMeta> {
  const response = await fetch(PROFILES_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, slug }),
  })
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Failed to create profile (${response.status})`))
  }
  return (await response.json()) as ProfileMeta
}

export async function saveProfileConfig(slug: string, config: ChatbotConfig): Promise<void> {
  const response = await fetch(`${PROFILES_PATH}?slug=${encodeURIComponent(slug)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config }),
  })
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Failed to save profile (${response.status})`))
  }
}

export async function archiveProfile(slug: string): Promise<void> {
  const response = await fetch(`${PROFILES_PATH}?slug=${encodeURIComponent(slug)}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Failed to archive profile (${response.status})`))
  }
}
