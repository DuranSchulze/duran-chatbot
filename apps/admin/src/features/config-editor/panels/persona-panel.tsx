import type { PersonaConfig } from "@duran-chatbot/config";

import {
  Field,
  FieldDescription,
  FieldGrid,
  FieldLabel,
  FieldRow,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type PersonaPanelProps = {
  persona: PersonaConfig;
  onChange: (persona: PersonaConfig) => void;
};

export function PersonaPanel({ persona, onChange }: PersonaPanelProps) {
  const update = <K extends keyof PersonaConfig>(
    key: K,
    value: PersonaConfig[K],
  ) => {
    onChange({ ...persona, [key]: value });
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Voice"
        title="Persona"
        description="Personalize how the bot sounds without replacing your main prompt and guardrails."
      />

      <Field className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <FieldRow>
          <div>
            <FieldLabel>Enable persona voice</FieldLabel>
            <FieldDescription>
              Layer voice guidance on top of the main system prompt so the bot feels more human and consistent.
            </FieldDescription>
          </div>
          <Switch
            checked={persona.enabled}
            onCheckedChange={(checked) => update("enabled", checked)}
          />
        </FieldRow>
      </Field>

      <Field className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <FieldDescription>
          Persona guidance mirrors communication style only. It should not make the bot pretend to literally be the person.
        </FieldDescription>
      </Field>

      <FieldGrid>
        <Field>
          <FieldLabel htmlFor="personaName">Persona name</FieldLabel>
          <Input
            id="personaName"
            value={persona.personaName}
            onChange={(event) => update("personaName", event.target.value)}
            placeholder="Atty. Maria Santos"
          />
          <FieldDescription>
            The person whose tone or communication style the bot should reflect.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="roleOrRelationship">Role / relationship</FieldLabel>
          <Input
            id="roleOrRelationship"
            value={persona.roleOrRelationship}
            onChange={(event) =>
              update("roleOrRelationship", event.target.value)
            }
            placeholder="Managing partner"
          />
          <FieldDescription>
            Helps shape how that person would normally respond in this context.
          </FieldDescription>
        </Field>
      </FieldGrid>

      <Field>
        <FieldLabel htmlFor="tone">Tone</FieldLabel>
        <Textarea
          id="tone"
          rows={3}
          value={persona.tone}
          onChange={(event) => update("tone", event.target.value)}
          placeholder="Warm, formal, reassuring, and calm."
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="writingStyle">Writing style</FieldLabel>
        <Textarea
          id="writingStyle"
          rows={4}
          value={persona.writingStyle}
          onChange={(event) => update("writingStyle", event.target.value)}
          placeholder="Uses short paragraphs, clear wording, and avoids slang."
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="signaturePhrases">Signature phrases</FieldLabel>
        <Textarea
          id="signaturePhrases"
          rows={3}
          value={persona.signaturePhrases}
          onChange={(event) =>
            update("signaturePhrases", event.target.value)
          }
          placeholder="Uses lines like 'We'd be glad to assist you.'"
        />
      </Field>

      <FieldGrid>
        <Field>
          <FieldLabel htmlFor="dos">Do</FieldLabel>
          <Textarea
            id="dos"
            rows={4}
            value={persona.dos}
            onChange={(event) => update("dos", event.target.value)}
            placeholder="Acknowledge concerns, sound respectful, explain clearly."
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="donts">Don&apos;t</FieldLabel>
          <Textarea
            id="donts"
            rows={4}
            value={persona.donts}
            onChange={(event) => update("donts", event.target.value)}
            placeholder="Do not sound too casual, do not use emojis, do not overpromise."
          />
        </Field>
      </FieldGrid>

      <Field>
        <FieldLabel htmlFor="audienceNotes">Audience notes</FieldLabel>
        <Textarea
          id="audienceNotes"
          rows={4}
          value={persona.audienceNotes}
          onChange={(event) => update("audienceNotes", event.target.value)}
          placeholder="Write clearly for clients unfamiliar with legal terms."
        />
        <FieldDescription>
          Describe who the bot is speaking to and how that should affect wording.
        </FieldDescription>
      </Field>
    </div>
  );
}
