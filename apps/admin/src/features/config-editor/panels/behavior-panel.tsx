import type { BehaviorConfig } from "@duran-chatbot/config";

import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldRow,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

type BehaviorPanelProps = {
  behavior: BehaviorConfig;
  onChange: (behavior: BehaviorConfig) => void;
};

export function BehaviorPanel({ behavior, onChange }: BehaviorPanelProps) {
  const update = <K extends keyof BehaviorConfig>(
    key: K,
    value: BehaviorConfig[K],
  ) => {
    onChange({ ...behavior, [key]: value });
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Interaction"
        title="Behavior"
        description="Set interaction rules, utility actions, and widget timing."
      />

      <div className="space-y-5">
        <Field className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <FieldLabel htmlFor="ctaHeading">Call-to-action heading</FieldLabel>
          <FieldDescription>
            Shown above the buttons in the CTA card that appears after the AI
            answers (toggle buttons on in the Action Menu).
          </FieldDescription>
          <Input
            id="ctaHeading"
            type="text"
            value={behavior.ctaHeading ?? ""}
            onChange={(event) => update("ctaHeading", event.target.value)}
            placeholder="Ready to take the next step?"
          />
        </Field>

        <Field className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <FieldRow>
            <div>
              <FieldLabel>Show timestamps</FieldLabel>
              <FieldDescription>
                Display message times to help users follow the conversation.
              </FieldDescription>
            </div>
            <Switch
              checked={behavior.showTimestamps}
              onCheckedChange={(checked) => update("showTimestamps", checked)}
            />
          </FieldRow>
        </Field>

        <Field className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <FieldRow>
            <div>
              <FieldLabel>Enable copy button</FieldLabel>
              <FieldDescription>
                Let users copy assistant responses with a single click.
              </FieldDescription>
            </div>
            <Switch
              checked={behavior.enableCopyButton}
              onCheckedChange={(checked) => update("enableCopyButton", checked)}
            />
          </FieldRow>
        </Field>

        <Field className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <FieldRow>
            <div>
              <div className="flex items-center gap-2">
                <FieldLabel>Enable quote request</FieldLabel>
                <Badge
                  variant={
                    behavior.enableQuoteRequest ? "success" : "secondary"
                  }
                >
                  {behavior.enableQuoteRequest ? "On" : "Off"}
                </Badge>
              </div>
              <FieldDescription>
                Offer a quote-request path when the conversation needs human
                follow-up. Who gets emailed is configured in the Email tab.
              </FieldDescription>
            </div>
            <Switch
              checked={behavior.enableQuoteRequest}
              onCheckedChange={(checked) =>
                update("enableQuoteRequest", checked)
              }
            />
          </FieldRow>
        </Field>
      </div>

      <Field className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
        <FieldRow>
          <div>
            <div className="flex items-center gap-2">
              <FieldLabel>Start expanded</FieldLabel>
              <Badge variant={behavior.openByDefault ? "success" : "secondary"}>
                {behavior.openByDefault ? "Opens immediately" : "Starts minimized"}
              </Badge>
            </div>
            <FieldDescription>
              Show the full chatbox as soon as the widget loads, including on
              WordPress embeds. Visitors can still minimize it.
            </FieldDescription>
          </div>
          <Switch
            checked={behavior.openByDefault}
            onCheckedChange={(checked) => update("openByDefault", checked)}
            aria-label="Start chatbot expanded"
          />
        </FieldRow>
      </Field>

      <Field>
        <div className="flex items-center justify-between gap-4">
          <FieldLabel htmlFor="autoOpenDelay">Auto-open delay</FieldLabel>
          <span className="text-sm font-semibold text-blue-600">
            {behavior.openByDefault ? "Not used" : `${behavior.autoOpenDelay}s`}
          </span>
        </div>
        <Slider
          id="autoOpenDelay"
          min={0}
          max={30}
          value={behavior.autoOpenDelay}
          disabled={behavior.openByDefault}
          onChange={(event) =>
            update("autoOpenDelay", Number(event.target.value))
          }
        />
        <FieldDescription>
          Used only when “Start expanded” is off. Set to 0 to keep the widget
          minimized until a visitor opens it.
        </FieldDescription>
      </Field>
    </div>
  );
}
