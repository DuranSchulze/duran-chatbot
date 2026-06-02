import { useCallback, useEffect, useState } from "react"
import {
  archiveProfile,
  createProfile,
  fetchProfiles,
  hardDeleteProfile,
  reactivateProfile,
  renameProfile,
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

  const hardDelete = async (slug: string): Promise<void> => {
    await hardDeleteProfile(slug)
    setProfiles((prev) => prev.filter((p) => p.slug !== slug))
  }

  const reactivate = async (slug: string): Promise<void> => {
    await reactivateProfile(slug)
    setProfiles((prev) =>
      prev.map((p) => (p.slug === slug ? { ...p, status: "active" as const } : p))
    )
  }

  const rename = async (slug: string, name: string, newSlug: string): Promise<void> => {
    await renameProfile(slug, name, newSlug)
    setProfiles((prev) =>
      prev.map((p) =>
        p.slug === slug
          ? { ...p, name, slug: newSlug }
          : p
      )
    )
  }

  return { profiles, loading, error, create, archive, hardDelete, reactivate, rename, reload: load }
}
