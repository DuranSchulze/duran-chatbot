import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"

type ProfileEditDialogProps = {
  currentSlug: string
  currentName: string
  onClose: () => void
  onSave: (name: string, slug: string) => Promise<void>
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function ProfileEditDialog({ currentSlug, currentName, onClose, onSave }: ProfileEditDialogProps) {
  const [name, setName] = useState(currentName)
  const [slug, setSlug] = useState(currentSlug)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Auto-update slug from name unless user manually edited the slug
  const handleNameChange = useCallback((value: string) => {
    setName(value)
    if (!slugManuallyEdited) {
      setSlug(slugify(value))
    }
  }, [slugManuallyEdited])

  const handleSlugChange = useCallback((value: string) => {
    setSlugManuallyEdited(true)
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
      await onSave(name.trim(), slug.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setSubmitting(false)
    }
  }

  const slugChanged = slug !== currentSlug
  const nameChanged = name !== currentName

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md graphite-card">
        <h2 className="font-display text-[28px] font-medium text-foreground mb-1">Edit Profile</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Rename the profile or change its URL-safe slug identifier.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="edit-name">Profile name</FieldLabel>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Duran Schulze Law"
              autoFocus
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-slug">Slug</FieldLabel>
            <Input
              id="edit-slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="duran-schulze-law"
            />
            <FieldDescription>
              Used in embed code: <code className="text-xs bg-card px-1 rounded">data-profile="{slug || "…"}"</code>
              {slugChanged && (
                <span className="block mt-1 text-muted-foreground">
                  ⚠️ Changing the slug will update all embed codes. Existing conversations remain linked.
                </span>
              )}
            </FieldDescription>
          </Field>

          {error && (
            <p className="text-sm text-muted-foreground">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || (!nameChanged && !slugChanged) || !name.trim() || !slug.trim()}
            >
              {submitting ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
