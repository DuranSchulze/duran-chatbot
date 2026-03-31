import { CheckCircle2, Save, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type TopBarProps = {
  saving: boolean
  dirty: boolean
  saveStatus: string
  onSave: () => void
}

export function TopBar({ saving, dirty, saveStatus, onSave }: TopBarProps) {
  return (
    <Card className="border-border bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="size-4" />
            Chatbot Admin
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[30px]">
            Chatbot settings
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage appearance, behavior, and knowledge in one focused workspace.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          {saveStatus ? (
            <Badge variant="success" className="gap-1.5">
              <CheckCircle2 className="size-3.5" />
              {saveStatus}
            </Badge>
          ) : (
            <Badge variant={dirty ? "warning" : "secondary"}>
              {dirty ? "Unsaved changes" : "All changes saved"}
            </Badge>
          )}
          <Button size="default" onClick={onSave} disabled={saving || !dirty} className="min-w-36">
            <Save className="size-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </Card>
  )
}
