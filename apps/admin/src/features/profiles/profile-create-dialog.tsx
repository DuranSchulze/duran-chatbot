import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"

type ProfileCreateDialogProps = {
  onClose: () => void
  onCreate: (name: string, slug: string) => Promise<void>
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function ProfileCreateDialog({ onClose, onCreate }: ProfileCreateDialogProps) {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleNameChange = useCallback((value: string) => {
    setName(value)
    if (!slugTouched) {
      setSlug(slugify(value))
    }
  }, [slugTouched])

  const handleSlugChange = useCallback((value: string) => {
    setSlugTouched(true)
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/^-+/, ""))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError("Profile name is required"); return }
    if (!slug.trim()) { setError("Slug is required"); return }
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) {
      setError("Slug must use only lowercase letters, numbers, and hyphens")
      return
    }
    setError("")
    setSubmitting(true)
    try {
      await onCreate(name.trim(), slug.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create profile")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md graphite-card">
        <h2 className="font-display text-[28px] font-medium text-foreground mb-1">New Profile</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Create a chatbot profile for a new website or brand.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="profile-name">Profile name</FieldLabel>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Duran Schulze Law"
              autoFocus
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="profile-slug">Slug</FieldLabel>
            <Input
              id="profile-slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="duran-schulze-law"
            />
            <FieldDescription>
              Used in embed code: <code className="text-xs bg-card px-1 rounded">data-profile=&quot;{slug || "…"}&quot;</code>
            </FieldDescription>
          </Field>

          {error && (
            <p className="text-sm text-muted-foreground">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !name.trim() || !slug.trim()}>
              {submitting ? "Creating…" : "Create profile"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
