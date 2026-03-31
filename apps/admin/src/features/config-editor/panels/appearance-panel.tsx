import type { AppearanceConfig } from "@duran-chatbot/config"

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

export function AppearancePanel({ appearance, onChange }: AppearancePanelProps) {
  const update = <K extends keyof AppearanceConfig>(key: K, value: AppearanceConfig[K]) => {
    onChange({ ...appearance, [key]: value })
  }

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
        <Field>
          <FieldLabel htmlFor="borderRadius">Border radius</FieldLabel>
          <Input
            id="borderRadius"
            type="number"
            min={0}
            max={50}
            value={appearance.borderRadius}
            onChange={(event) => update("borderRadius", Number(event.target.value))}
          />
          <FieldDescription>Rounded corners for the widget shell and controls.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="fontFamily">Font family</FieldLabel>
          <Input
            id="fontFamily"
            value={appearance.fontFamily}
            onChange={(event) => update("fontFamily", event.target.value)}
          />
          <FieldDescription>Use a valid CSS font stack that matches your brand.</FieldDescription>
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
