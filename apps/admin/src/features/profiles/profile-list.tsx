import { useState } from "react"
import { Bot, Plus, Archive, ArrowRight, Calendar, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ProfileMeta } from "@/api/profiles"
import { ProfileCreateDialog } from "./profile-create-dialog"

type ProfileListProps = {
  profiles: ProfileMeta[]
  loading: boolean
  error: string | null
  onSelect: (slug: string) => void
  onCreate: (name: string, slug: string) => Promise<void>
  onArchive: (slug: string) => Promise<void>
}

export function ProfileList({
  profiles,
  loading,
  error,
  onSelect,
  onCreate,
  onArchive,
}: ProfileListProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [archiving, setArchiving] = useState<string | null>(null)

  const active = profiles.filter((p) => p.status === "active")
  const archived = profiles.filter((p) => p.status === "archived")

  const handleArchive = async (slug: string) => {
    if (!confirm(`Archive the "${slug}" profile? It will no longer be editable.`)) return
    setArchiving(slug)
    try {
      await onArchive(slug)
    } finally {
      setArchiving(null)
    }
  }

  const handleCreate = async (name: string, slug: string) => {
    await onCreate(name, slug)
    setShowCreate(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
          <p className="text-sm text-slate-500">Loading profiles…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Bot className="size-5" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900">Chatbot Profiles</h1>
            </div>
            <p className="text-sm text-slate-500 ml-11.5">
              Each profile has its own knowledge, persona, and widget settings.
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2 shrink-0">
            <Plus className="size-4" />
            New profile
          </Button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        {/* Active profiles */}
        {active.length > 0 ? (
          <div className="space-y-3 mb-8">
            {active.map((profile) => (
              <div
                key={profile.slug}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                    <Globe className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 truncate">{profile.name}</p>
                      <Badge variant="success">Active</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">{profile.slug}</p>
                    {profile.createdAt && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="size-3" />
                        {new Date(profile.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleArchive(profile.slug)}
                    disabled={archiving === profile.slug || active.length <= 1}
                    title="Archive profile"
                  >
                    <Archive className="size-4 text-slate-400" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onSelect(profile.slug)}
                    className="gap-1.5"
                  >
                    Edit
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center mb-8">
            <Bot className="mx-auto size-10 text-slate-300 mb-3" />
            <p className="font-medium text-slate-600">No profiles yet</p>
            <p className="text-sm text-slate-400 mt-1">Create your first profile to get started.</p>
            <Button onClick={() => setShowCreate(true)} className="mt-4 gap-2">
              <Plus className="size-4" />
              Create profile
            </Button>
          </div>
        )}

        {/* Archived profiles */}
        {archived.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Archived
            </p>
            <div className="space-y-2">
              {archived.map((profile) => (
                <div
                  key={profile.slug}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 opacity-60"
                >
                  <div>
                    <p className="font-medium text-slate-700">{profile.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{profile.slug}</p>
                  </div>
                  <Badge variant="secondary">Archived</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <ProfileCreateDialog
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}
