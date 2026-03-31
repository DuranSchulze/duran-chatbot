import type { BehaviorConfig } from "@duran-chatbot/config"

import { Badge } from "@/components/ui/badge"
import { Field, FieldDescription, FieldLabel, FieldRow } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SectionHeader } from "@/components/ui/section-header"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

type BehaviorPanelProps = {
  behavior: BehaviorConfig
  onChange: (behavior: BehaviorConfig) => void
}

export function BehaviorPanel({ behavior, onChange }: BehaviorPanelProps) {
  const update = <K extends keyof BehaviorConfig>(key: K, value: BehaviorConfig[K]) => {
    onChange({ ...behavior, [key]: value })
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Interaction"
        title="Behavior"
        description="Set interaction rules, utility actions, and widget timing."
      />

      <div className="space-y-5">
        <Field className="rounded-3xl border border-border/70 bg-muted/35 p-5">
          <FieldRow>
            <div>
              <FieldLabel>Show timestamps</FieldLabel>
              <FieldDescription>Display message times to help users follow the conversation.</FieldDescription>
            </div>
            <Switch
              checked={behavior.showTimestamps}
              onCheckedChange={(checked) => update("showTimestamps", checked)}
            />
          </FieldRow>
        </Field>

        <Field className="rounded-3xl border border-border/70 bg-muted/35 p-5">
          <FieldRow>
            <div>
              <FieldLabel>Enable copy button</FieldLabel>
              <FieldDescription>Let users copy assistant responses with a single click.</FieldDescription>
            </div>
            <Switch
              checked={behavior.enableCopyButton}
              onCheckedChange={(checked) => update("enableCopyButton", checked)}
            />
          </FieldRow>
        </Field>

        <Field className="rounded-3xl border border-border/70 bg-muted/35 p-5">
          <FieldRow>
            <div>
              <div className="flex items-center gap-2">
                <FieldLabel>Enable quote request</FieldLabel>
                <Badge variant={behavior.enableQuoteRequest ? "success" : "secondary"}>
                  {behavior.enableQuoteRequest ? "On" : "Off"}
                </Badge>
              </div>
              <FieldDescription>Offer a quote-request path when the conversation needs human follow-up.</FieldDescription>
            </div>
            <Switch
              checked={behavior.enableQuoteRequest}
              onCheckedChange={(checked) => update("enableQuoteRequest", checked)}
            />
          </FieldRow>
        </Field>
      </div>

      <Field>
        <div className="flex items-center justify-between gap-4">
          <FieldLabel htmlFor="autoOpenDelay">Auto-open delay</FieldLabel>
          <span className="text-sm font-semibold text-primary">{behavior.autoOpenDelay}s</span>
        </div>
        <Slider
          id="autoOpenDelay"
          min={0}
          max={30}
          value={behavior.autoOpenDelay}
          onChange={(event) => update("autoOpenDelay", Number(event.target.value))}
        />
        <FieldDescription>Set to 0 to disable automatic widget opening.</FieldDescription>
      </Field>

      {behavior.enableQuoteRequest ? (
        <Field>
          <FieldLabel htmlFor="quoteEmail">Quote request email</FieldLabel>
          <Input
            id="quoteEmail"
            type="email"
            value={behavior.quoteEmail ?? ""}
            onChange={(event) => update("quoteEmail", event.target.value)}
            placeholder="sales@example.com"
          />
        </Field>
      ) : null}
    </div>
  )
}
