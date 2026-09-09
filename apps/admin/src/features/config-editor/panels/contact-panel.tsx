import type { AppearanceConfig } from "@duran-chatbot/config"
import { MapPin, Phone, Mail, Clock, Link as LinkIcon, Navigation } from "lucide-react"
import { Field, FieldDescription, FieldGrid, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SectionHeader } from "@/components/ui/section-header"

type ContactPanelProps = {
  appearance: AppearanceConfig
  onChange: (appearance: AppearanceConfig) => void
}

function LabelWithIcon({ icon, htmlFor, children }: { icon: React.ReactNode; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-slate-400">{icon}</span>
      <FieldLabel htmlFor={htmlFor}>{children}</FieldLabel>
    </div>
  )
}

export function ContactPanel({ appearance, onChange }: ContactPanelProps) {
  const update = <K extends keyof AppearanceConfig>(key: K, value: string) => {
    onChange({ ...appearance, [key]: value })
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Company Details"
        title="Contact & Location"
        description="The official contact details and office location the chatbot shares with visitors. Fill these in and the AI will answer location questions with these exact details."
      />

      <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm text-slate-600">
        This tab is the{" "}
        <span className="font-medium text-slate-800">single source of truth</span>{" "}
        for company details. Reference them anywhere — the AI system prompt,
        dataset entries, or the internal chat's footer — with variables like{" "}
        <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-blue-700 ring-1 ring-slate-200">
          {`{{address}}`}
        </code>
        ,{" "}
        <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-blue-700 ring-1 ring-slate-200">
          {`{{phone}}`}
        </code>
        ,{" "}
        <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-blue-700 ring-1 ring-slate-200">
          {`{{email}}`}
        </code>
        . Update the value here and it changes everywhere.
      </div>

      <FieldGrid>
        <Field className="md:col-span-2">
          <LabelWithIcon icon={<MapPin className="size-3.5" />} htmlFor="companyAddress">
            Office address
          </LabelWithIcon>
          <Input
            id="companyAddress"
            value={appearance.companyAddress ?? ""}
            onChange={(event) => update("companyAddress", event.target.value)}
            placeholder="e.g. 1210 High Street, Bonifacio Global City, Taguig, Metro Manila"
          />
          <FieldDescription>
            Shown in replies when visitors ask where the company is located or how to find it.
          </FieldDescription>
        </Field>

        <Field>
          <LabelWithIcon icon={<Phone className="size-3.5" />} htmlFor="companyPhone">
            Phone number(s)
          </LabelWithIcon>
          <Input
            id="companyPhone"
            value={appearance.companyPhone ?? ""}
            onChange={(event) => update("companyPhone", event.target.value)}
            placeholder="e.g. (+632) 8478 5826, (+63) 917 194 0482"
          />
        </Field>

        <Field>
          <LabelWithIcon icon={<Mail className="size-3.5" />} htmlFor="companyEmail">
            Contact email
          </LabelWithIcon>
          <Input
            id="companyEmail"
            type="email"
            value={appearance.companyEmail ?? ""}
            onChange={(event) => update("companyEmail", event.target.value)}
            placeholder="e.g. info@company.com"
          />
        </Field>

        <Field>
          <LabelWithIcon icon={<Clock className="size-3.5" />} htmlFor="officeHours">
            Office hours
          </LabelWithIcon>
          <Input
            id="officeHours"
            value={appearance.officeHours ?? ""}
            onChange={(event) => update("officeHours", event.target.value)}
            placeholder="e.g. Mon–Fri, 9:00 AM – 6:00 PM"
          />
        </Field>

        <Field>
          <LabelWithIcon icon={<LinkIcon className="size-3.5" />} htmlFor="contactUrl">
            Website / contact page
          </LabelWithIcon>
          <Input
            id="contactUrl"
            value={appearance.contactUrl ?? ""}
            onChange={(event) => update("contactUrl", event.target.value)}
            placeholder="https://company.com/contact"
          />
        </Field>

        <Field className="md:col-span-2">
          <LabelWithIcon icon={<Navigation className="size-3.5" />} htmlFor="mapUrl">
            Map / directions link
          </LabelWithIcon>
          <Input
            id="mapUrl"
            value={appearance.mapUrl ?? ""}
            onChange={(event) => update("mapUrl", event.target.value)}
            placeholder="https://maps.google.com/?q=..."
          />
          <FieldDescription>
            Optional — the AI can share this link when a visitor asks for directions.
          </FieldDescription>
        </Field>
      </FieldGrid>
    </div>
  )
}
