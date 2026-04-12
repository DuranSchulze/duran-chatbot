import { useCallback, useEffect, useState } from "react"
import {
  archiveProfile,
  createProfile,
  fetchProfiles,
  type ProfileMeta,
} from "@/api/profiles"

export function useProfiles() {
  const [profiles, setProfiles] = useState<ProfileMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchProfiles()
      setProfiles(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profiles")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const create = async (name: string, slug: string): Promise<ProfileMeta> => {
    const profile = await createProfile(name, slug)
    setProfiles((prev) => [...prev, profile])
    return profile
  }

  const archive = async (slug: string): Promise<void> => {
    await archiveProfile(slug)
    setProfiles((prev) =>
      prev.map((p) => (p.slug === slug ? { ...p, status: "archived" as const } : p))
    )
  }

  return { profiles, loading, error, create, archive, reload: load }
}
