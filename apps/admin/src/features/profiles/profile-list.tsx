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
        className={cn("gap-1.5", open && "bg-background")}
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
            className="absolute right-0 top-full z-20 mt-1.5 w-52 overflow-hidden rounded-xl border border-border bg-card p-2 "
          >
            {items.map((action) => (
              <div key={action.label}>
                {action.divider && <div className="my-1 h-px bg-card" />}
                {action.href ? (
                  <Link
                    to={action.href}
                    role="menuitem"
                    onClick={close}
                    title={action.title}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground",
                      action.tone === "danger"
                        ? "text-muted-foreground hover:bg-secondary"
                        : action.tone === "success"
                          ? "text-muted-foreground hover:bg-secondary"
                          : "text-foreground hover:bg-card",
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
                      "flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground disabled:pointer-events-none disabled:opacity-40",
                      action.tone === "danger"
                        ? "text-muted-foreground hover:bg-secondary"
                        : action.tone === "success"
                          ? "text-muted-foreground hover:bg-secondary"
                          : "text-foreground hover:bg-card",
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-border border-t-border" />
          <p className="text-sm text-muted-foreground">Loading profiles…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="top-navigation">
        <nav aria-label="Main navigation" className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-8">
          <Link to="/" className="flex items-center gap-3 text-sm"><img src="/logo.webp" alt="Duran & Schulze" className="h-9 w-auto" /><span className="hidden sm:inline text-muted-foreground">Chatbot workspace</span></Link>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/internal" className="nav-link">Legal assistant</Link>
            <Link to="/announcements" className="nav-link"><Megaphone className="size-4" />What’s new</Link>
          </div>
        </nav>
      </header>
      <div className="page-container">
        <div className="mb-[72px] flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs tracking-[0.12em] uppercase text-muted-foreground">Your workspace</p>
            <h1 className="page-heading">A considered conversation.<br />Every time.</h1>
            <p className="mt-5 max-w-lg text-sm text-muted-foreground">Manage the knowledge, voice, and experience behind every chatbot profile.</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="h-10 gap-2 px-5 shrink-0"><Plus className="size-4" />New profile</Button>
        </div>
        <div className="mb-[72px] grid gap-8 md:grid-cols-2">
          <Link to="/internal" className="graphite-card group flex flex-col gap-6">
            <div className="flex items-center justify-between text-muted-foreground"><Bot className="size-5" /><span className="text-xs">Internal workspace</span></div>
            <div><h2 className="section-heading">Legal assistant</h2><p className="mt-3 text-sm text-muted-foreground">Research, draft, and work through a matter with your internal AI assistant.</p></div>
            <span className="mt-auto flex items-center gap-2 text-sm">Start a briefing <ArrowRight className="size-4" /></span>
          </Link>
          <a href="https://kairo.buildvault.live/login" className="graphite-card group flex flex-col gap-6">
            <div className="flex items-center justify-between text-muted-foreground"><MessageSquare className="size-5" /><span className="text-xs">Connected workspace</span></div>
            <div><h2 className="section-heading">Meet Kairo</h2><p className="mt-3 text-sm text-muted-foreground">Continue the conversation in Kairo’s dedicated chatbot workspace.</p></div>
            <span className="mt-auto flex items-center gap-2 text-sm">Open Kairo <ArrowRight className="size-4" /></span>
          </a>
        </div>
        {error && (
          <div className="mb-6 rounded-xl border border-border bg-secondary px-4 py-3">
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        {/* Active profiles */}
        {active.length > 0 ? (
          <div className="mb-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Active ({active.length})
            </p>
            <div className="space-y-3 mb-[72px]">
              {active.map((profile) => (
                <div
                  key={profile.slug}
                  className="graphite-card group flex flex-col items-stretch justify-between gap-6 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground shrink-0">
                      <Globe className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">{profile.name}</p>
                        <Badge variant="success">Active</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">{profile.slug}</p>
                      {profile.createdAt && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="size-3" />
                          {new Date(profile.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
                    <Button
                      variant="outline"
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
          <div className="graphite-card text-center mb-8">
            <Bot className="mx-auto size-10 text-foreground mb-3" />
            <p className="font-medium text-muted-foreground">No profiles yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first profile to get started.</p>
            <Button variant="outline" onClick={() => setShowCreate(true)} className="mt-4 gap-2">
              <Plus className="size-4" />
              Create profile
            </Button>
          </div>
        )}

        {/* Archived profiles */}
        {archived.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Archived ({archived.length})
            </p>
            <div className="space-y-3">
              {archived.map((profile) => (
                <div
                  key={profile.slug}
                  className="graphite-card flex flex-col items-stretch justify-between gap-6 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-9 items-center justify-center rounded-control bg-secondary text-muted-foreground shrink-0">
                      <Globe className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-muted-foreground truncate">{profile.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{profile.slug}</p>
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
