import type { ChatbotConfig } from "@duran-chatbot/config"
import { Bot, Database, Link2, Palette } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ConfigSummaryCard({ config }: { config: ChatbotConfig }) {
  const items = [
    { label: "Brand", value: config.appearance.companyName, icon: Palette },
    { label: "Model", value: config.ai.model, icon: Bot },
    { label: "Quick Links", value: `${config.quickLinks.length} items`, icon: Link2 },
    { label: "Dataset", value: `${config.dataset.length} entries`, icon: Database },
  ]

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle>Configuration Snapshot</CardTitle>
        <CardDescription>Current status at a glance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-slate-50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-white text-primary">
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold text-foreground">{item.value}</p>
                </div>
              </div>
              {item.label === "Dataset" && config.dataset.length > 0 ? (
                <Badge variant="success">Ready</Badge>
              ) : null}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
