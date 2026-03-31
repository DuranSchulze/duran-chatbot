import { AlertTriangle, Info } from "lucide-react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type StatusBannerProps = {
  tone?: "info" | "error"
  title: string
  description: string
}

export function StatusBanner({
  tone = "info",
  title,
  description,
}: StatusBannerProps) {
  const Icon = tone === "error" ? AlertTriangle : Info

  return (
    <Card
      className={cn(
        "flex items-start gap-3 border px-4 py-4 shadow-none",
        tone === "error" ? "border-rose-200 bg-rose-50" : "border-border bg-white"
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          tone === "error" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </Card>
  )
}
