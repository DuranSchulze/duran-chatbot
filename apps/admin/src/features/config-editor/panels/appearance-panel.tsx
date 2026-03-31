import type { AppearanceConfig } from "@duran-chatbot/config"

import { cn } from "@/lib/utils"
import { ColorInput } from "@/components/ui/color-input"
import { Field, FieldDescription, FieldGrid, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SectionHeader } from "@/components/ui/section-header"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type AppearancePanelProps = {
  appearance: AppearanceConfig
  onChange: (appearance: AppearanceConfig) => void
}

const borderRadiusOptions = [
  { label: "Small", value: 8 },
  { label: "Medium", value: 12 },
  { label: "Large", value: 16 },
] as const

export function AppearancePanel({ appearance, onChange }: AppearancePanelProps) {
  const update = <K extends keyof AppearanceConfig>(key: K, value: AppearanceConfig[K]) => {
    onChange({ ...appearance, [key]: value })
  }

  const selectedRadius =
    borderRadiusOptions.find((option) => option.value === appearance.borderRadius)?.value ??
    borderRadiusOptions.reduce((closest, option) => {
      return Math.abs(option.value - appearance.borderRadius) <
        Math.abs(closest.value - appearance.borderRadius)
        ? option
        : closest
    }).value

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Brand System"
        title="Appearance"
        description="Control brand details, layout, and the first message visitors see."
      />

      <FieldGrid>
        <Field>
          <FieldLabel htmlFor="companyName">Company name</FieldLabel>
          <Input
            id="companyName"
            value={appearance.companyName}
            onChange={(event) => update("companyName", event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="position">Widget position</FieldLabel>
          <Select
            id="position"
            value={appearance.position}
            onChange={(event) => update("position", event.target.value as AppearanceConfig["position"])}
          >
            <option value="bottom-right">Bottom right</option>
            <option value="bottom-left">Bottom left</option>
          </Select>
        </Field>
      </FieldGrid>

      <FieldGrid>
        <Field>
          <FieldLabel>Primary color</FieldLabel>
          <ColorInput value={appearance.primaryColor} onChange={(value) => update("primaryColor", value)} />
        </Field>
        <Field>
          <FieldLabel>Accent color</FieldLabel>
          <ColorInput value={appearance.accentColor} onChange={(value) => update("accentColor", value)} />
        </Field>
        <Field>
          <FieldLabel>Background color</FieldLabel>
          <ColorInput
            value={appearance.backgroundColor}
            onChange={(value) => update("backgroundColor", value)}
          />
        </Field>
        <Field>
          <FieldLabel>Text color</FieldLabel>
          <ColorInput value={appearance.textColor} onChange={(value) => update("textColor", value)} />
        </Field>
      </FieldGrid>

      <FieldGrid>
        <Field className="md:col-span-2">
          <FieldLabel>Border radius</FieldLabel>
          <div className="grid gap-3 md:grid-cols-3">
            {borderRadiusOptions.map((option) => {
              const isSelected = selectedRadius === option.value

              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => update("borderRadius", option.value)}
                  className={cn(
                    "rounded-2xl border bg-white p-4 text-left transition-all",
                    isSelected
                      ? "border-blue-500 ring-2 ring-blue-100"
                      : "border-slate-200 hover:border-slate-300",
                  )}
                  aria-pressed={isSelected}
                >
                  <div className="mb-4 flex h-16 items-center justify-center rounded-xl bg-slate-50">
                    <div
                      className="h-10 w-20 border-2 border-slate-300 bg-white transition-all"
                      style={{ borderRadius: `${option.value}px` }}
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                  <p className="text-xs text-slate-500">{option.value}px radius</p>
                </button>
              )
            })}
          </div>
          <FieldDescription>Choose how rounded the widget shell and controls should feel.</FieldDescription>
        </Field>
      </FieldGrid>

      <Field>
        <FieldLabel htmlFor="welcomeMessage">Welcome message</FieldLabel>
        <Textarea
          id="welcomeMessage"
          rows={5}
          value={appearance.welcomeMessage}
          onChange={(event) => update("welcomeMessage", event.target.value)}
        />
        <FieldDescription>This opens the conversation with the right tone and context.</FieldDescription>
      </Field>
    </div>
  )
}
