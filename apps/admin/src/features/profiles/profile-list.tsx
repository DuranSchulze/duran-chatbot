import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useToast } from "@/components/ui/toaster"
import {
  Bot,
  Plus,
  ArrowRight,
  Calendar,
  Globe,
  MessageSquare,
  Sparkles,
  Trash2,
  RotateCcw,
  Pencil,
  Archive,
  Megaphone,
  ChevronDown,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ProfileMeta } from "@/api/profiles"
import { ProfileCreateDialog } from "./profile-create-dialog"
import { ProfileEditDialog } from "./profile-edit-dialog"

type RowAction = {
  label: string
  icon: LucideIcon
  /** Navigate instead of calling a handler */
  href?: string
  onClick?: () => void
  disabled?: boolean
  tone?: "default" | "danger" | "success"
  /** Draw a thin separator above this action */
  divider?: boolean
  title?: string
}

/** Compact “Actions ▾” dropdown that lists what a user can do to a row. */
function RowActionsMenu({ items }: { items: RowAction[] }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open])

  const close = () => setOpen(false)

  return (
    <div className="relative shrink-0">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="More actions"
        className={cn("gap-1.5", open && "bg-slate-50")}
      >
        Actions
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <>
          {/* Click-away catcher */}
          <div className="fixed inset-0 z-10" onClick={close} aria-hidden="true" />
          <div
            role="menu"
            className="absolute right-0 top-full z-20 mt-1.5 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          >
            {items.map((action) => (
              <div key={action.label}>
                {action.divider && <div className="my-1 h-px bg-slate-100" />}
                {action.href ? (
                  <Link
                    to={action.href}
                    role="menuitem"
                    onClick={close}
                    title={action.title}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                      action.tone === "danger"
                        ? "text-red-600 hover:bg-red-50"
                        : action.tone === "success"
                          ? "text-emerald-700 hover:bg-emerald-50"
                          : "text-slate-700 hover:bg-slate-100",
                    )}
                  >
                    <action.icon className="size-4 shrink-0" />
                    {action.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      close()
                      action.onClick?.()
                    }}
                    disabled={action.disabled}
                    title={action.title}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-40",
                      action.tone === "danger"
                        ? "text-red-600 hover:bg-red-50"
                        : action.tone === "success"
                          ? "text-emerald-700 hover:bg-emerald-50"
                          : "text-slate-700 hover:bg-slate-100",
                    )}
                  >
                    <action.icon className="size-4 shrink-0" />
                    {action.label}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

type ProfileListProps = {
  profiles: ProfileMeta[]
  loading: boolean
  error: string | null
  onSelect: (slug: string) => void
  onCreate: (name: string, slug: string) => Promise<void>
  onArchive: (slug: string) => Promise<void>
  onHardDelete: (slug: string) => Promise<void>
  onReactivate: (slug: string) => Promise<void>
  onRename: (slug: string, name: string, newSlug: string) => Promise<void>
}

export function ProfileList({
  profiles,
  loading,
  error,
  onSelect,
  onCreate,
  onArchive,
  onHardDelete,
  onReactivate,
  onRename,
}: ProfileListProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [editingProfile, setEditingProfile] = useState<ProfileMeta | null>(null)
  const [archiving, setArchiving] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [reactivating, setReactivating] = useState<string | null>(null)
  const { toast } = useToast()

  const active = profiles.filter((p) => p.status === "active")
  const archived = profiles.filter((p) => p.status === "archived")

  const handleArchive = async (slug: string) => {
    if (!confirm(`Archive the "${slug}" profile? It can be reactivated later.`)) return
    setArchiving(slug)
    try {
      await onArchive(slug)
      toast({ title: "Profile archived", description: `"${slug}" can be reactivated later.`, tone: "success" })
    } catch (err) {
      toast({ title: "Failed to archive profile", description: err instanceof Error ? err.message : undefined, tone: "error" })
    } finally {
      setArchiving(null)
    }
  }

  const handleHardDelete = async (slug: string, name: string) => {
    if (!confirm(
      `Permanently delete "${name}"?\n\nThis will delete ALL data for this profile including:\n` +
      `• Chatbot configuration\n• All conversation history\n• All messages\n• All quote requests\n\nThis action CANNOT be undone.`
    )) return
    setDeleting(slug)
    try {
      await onHardDelete(slug)
      toast({ title: "Profile deleted", description: `"${name}" and all of its data were permanently removed.`, tone: "success" })
    } catch (err) {
      toast({ title: "Failed to delete profile", description: err instanceof Error ? err.message : undefined, tone: "error" })
    } finally {
      setDeleting(null)
    }
  }

  const handleReactivate = async (slug: string) => {
    setReactivating(slug)
    try {
      await onReactivate(slug)
      toast({ title: "Profile reactivated", description: `"${slug}" is active again.`, tone: "success" })
    } catch (err) {
      toast({ title: "Failed to reactivate profile", description: err instanceof Error ? err.message : undefined, tone: "error" })
    } finally {
      setReactivating(null)
    }
  }

  const handleCreate = async (name: string, slug: string) => {
    try {
      await onCreate(name, slug)
      setShowCreate(false)
      toast({ title: "Profile created", description: `"${name}" is ready to configure.`, tone: "success" })
    } catch (err) {
      toast({ title: "Failed to create profile", description: err instanceof Error ? err.message : undefined, tone: "error" })
    }
  }

  const handleRename = async (name: string, slug: string) => {
    if (!editingProfile) return
    try {
      await onRename(editingProfile.slug, name, slug)
      setEditingProfile(null)
      toast({ title: "Profile renamed", description: `Now known as "${name}".`, tone: "success" })
    } catch (err) {
      toast({ title: "Failed to rename profile", description: err instanceof Error ? err.message : undefined, tone: "error" })
    }
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
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
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/announcements"
              className="inline-flex h-10 items-center justify-center gap-2 border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <Megaphone className="size-4" aria-hidden="true" />
              What’s new
            </Link>
            <Button onClick={() => setShowCreate(true)} className="gap-2 shrink-0">
              <Plus className="size-4" />
              New profile
            </Button>
          </div>
        </div>

        {/* Legal Chatbot CTA */}
        <Link to="/internal" className="block mb-8 group">
          <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-5 flex items-center gap-4 shadow-sm hover:shadow-lg transition-shadow">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-transparent" />
            <div className="flex items-center justify-center size-14 rounded-2xl bg-blue-500/15 border border-blue-500/20 shrink-0">
              <Bot className="size-7 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-white text-base">Legal Chatbot</p>
                <span className="flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                  <Sparkles className="size-2.5" />
                  Internal
                </span>
              </div>
              <p className="text-sm text-slate-400">
                Chat with the AI assistant — customize the system prompt, temperature, and knowledge base.
              </p>
            </div>
            <div className="shrink-0">
              <div className="flex items-center justify-center size-9 rounded-xl bg-blue-600 text-white group-hover:bg-blue-500 transition-colors">
                <ArrowRight className="size-4" />
              </div>
            </div>
          </div>
        </Link>

        {/* Kairo chatbot — external workspace */}
        <a
          href="https://kairo.buildvault.live/login"
          className="group relative mb-8 block overflow-hidden border border-blue-200 bg-blue-50 p-5 shadow-sm hover:border-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-4 sm:p-6"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 320 200"
            fill="none"
            className="pointer-events-none absolute -right-8 -top-3 h-56 w-80 text-blue-600 opacity-[0.08]"
          >
            <path d="M40 24h200v80H96l-32 28v-28H40z" stroke="currentColor" strokeWidth="2" />
            <path d="M112 120h176v56h-24v20l-28-20H112z" stroke="currentColor" strokeWidth="2" />
            <path d="M72 52h128M72 72h88M136 144h112M136 160h72" stroke="currentColor" strokeWidth="4" />
          </svg>
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center border border-blue-200 bg-white text-blue-600">
                <MessageSquare className="size-6" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">Another place to chat</p>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">Meet Kairo</h2>
                <p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">Open the Kairo chatbot and sign in to start a conversation.</p>
              </div>
            </div>
            <span className="flex min-h-10 shrink-0 items-center justify-center gap-2 bg-blue-600 px-4 py-2 text-sm font-medium text-white group-hover:bg-blue-700">
              Open Kairo
              <ArrowRight className="size-4" aria-hidden="true" />
            </span>
          </div>
        </a>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        {/* Active profiles */}
        {active.length > 0 ? (
          <div className="mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Active ({active.length})
            </p>
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

                  <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => onSelect(profile.slug)}
                      className="gap-1.5"
                    >
                      Edit
                      <ArrowRight className="size-3.5" />
                    </Button>
                    <RowActionsMenu
                      items={[
                        {
                          label: "Open conversations",
                          icon: MessageSquare,
                          href: `/conversations?profile=${profile.slug}`,
                          title: "View conversations for this profile",
                        },
                        {
                          label: "Rename profile",
                          icon: Pencil,
                          onClick: () => setEditingProfile(profile),
                          title: "Edit profile name and slug",
                        },
                        {
                          label: "Archive profile",
                          icon: Archive,
                          onClick: () => handleArchive(profile.slug),
                          disabled: archiving === profile.slug || active.length <= 1,
                          title: archiving === profile.slug ? "Archiving…" : "Archive this profile (can be reactivated later)",
                        },
                        {
                          label: "Delete profile",
                          icon: Trash2,
                          onClick: () => handleHardDelete(profile.slug, profile.name),
                          disabled: deleting === profile.slug,
                          tone: "danger",
                          divider: true,
                          title: deleting === profile.slug ? "Deleting…" : "Permanently delete profile and all data",
                        },
                      ]}
                    />
                  </div>
                </div>
              ))}
            </div>
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
              Archived ({archived.length})
            </p>
            <div className="space-y-2">
              {archived.map((profile) => (
                <div
                  key={profile.slug}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-slate-200 text-slate-400 shrink-0">
                      <Globe className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-600 truncate">{profile.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{profile.slug}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
                    <Badge variant="secondary">Archived</Badge>
                    <RowActionsMenu
                      items={[
                        {
                          label: "Rename profile",
                          icon: Pencil,
                          onClick: () => setEditingProfile(profile),
                          title: "Edit profile name and slug",
                        },
                        {
                          label: "Reactivate profile",
                          icon: RotateCcw,
                          onClick: () => handleReactivate(profile.slug),
                          disabled: reactivating === profile.slug,
                          tone: "success",
                          title: reactivating === profile.slug ? "Reactivating…" : "Reactivate this profile",
                        },
                        {
                          label: "Delete profile",
                          icon: Trash2,
                          onClick: () => handleHardDelete(profile.slug, profile.name),
                          disabled: deleting === profile.slug,
                          tone: "danger",
                          divider: true,
                          title: deleting === profile.slug ? "Deleting…" : "Permanently delete profile and all data",
                        },
                      ]}
                    />
                  </div>
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

      {editingProfile && (
        <ProfileEditDialog
          currentSlug={editingProfile.slug}
          currentName={editingProfile.name}
          onClose={() => setEditingProfile(null)}
          onSave={handleRename}
        />
      )}
    </div>
  )
}
