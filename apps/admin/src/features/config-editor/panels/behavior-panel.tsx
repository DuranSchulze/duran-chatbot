import { defaultConfig, type AppearanceConfig, type BehaviorConfig } from "@duran-chatbot/config";

import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldDescription,
  FieldGrid,
  FieldLabel,
  FieldRow,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

import { PrivacyNoticePreview } from "./privacy-notice-preview";

type BehaviorPanelProps = {
  behavior: BehaviorConfig;
  /** Read-only, so the privacy notice preview can show the real link color and contact tokens. */
  appearance: AppearanceConfig;
  onChange: (behavior: BehaviorConfig) => void;
};

export function BehaviorPanel({ behavior, appearance, onChange }: BehaviorPanelProps) {
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
        <Field className="rounded-xl border border-border bg-background p-4">
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

        <Field className="rounded-xl border border-border bg-background p-4">
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

        <Field className="rounded-xl border border-border bg-background p-4">
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

        <Field className="rounded-xl border border-border bg-background p-4">
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

        <Field className="rounded-xl border border-border bg-background p-4">
          <FieldRow>
            <div>
              <div className="flex items-center gap-2">
                <FieldLabel>Privacy notice</FieldLabel>
                <Badge
                  variant={
                    behavior.privacyNoticeEnabled ? "success" : "secondary"
                  }
                >
                  {behavior.privacyNoticeEnabled ? "Required" : "Off"}
                </Badge>
              </div>
              <FieldDescription>
                Add a data-privacy consent checkbox under the name and email
                fields. Visitors must tick it before the chat starts.
              </FieldDescription>
            </div>
            <Switch
              checked={behavior.privacyNoticeEnabled}
              onCheckedChange={(checked) =>
                update("privacyNoticeEnabled", checked)
              }
              aria-label="Show privacy notice checkbox"
            />
          </FieldRow>

          {behavior.privacyNoticeEnabled ? (
            <div className="space-y-4 pt-1">
              <Field>
                <FieldLabel htmlFor="privacyNoticeText">Sentence</FieldLabel>
                <Input
                  id="privacyNoticeText"
                  type="text"
                  value={behavior.privacyNoticeText ?? ""}
                  onChange={(event) =>
                    update("privacyNoticeText", event.target.value)
                  }
                  placeholder={defaultConfig.behavior.privacyNoticeText}
                />
                <FieldDescription>
                  Shown next to the checkbox. Use {"{{link}}"} where the privacy
                  link should appear.
                </FieldDescription>
              </Field>

              <FieldGrid>
                <Field>
                  <FieldLabel htmlFor="privacyNoticeLinkLabel">
                    Link text
                  </FieldLabel>
                  <Input
                    id="privacyNoticeLinkLabel"
                    type="text"
                    value={behavior.privacyNoticeLinkLabel ?? ""}
                    onChange={(event) =>
                      update("privacyNoticeLinkLabel", event.target.value)
                    }
                    placeholder={defaultConfig.behavior.privacyNoticeLinkLabel}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="privacyNoticeUrl">Link URL</FieldLabel>
                  <Input
                    id="privacyNoticeUrl"
                    type="url"
                    value={behavior.privacyNoticeUrl ?? ""}
                    onChange={(event) =>
                      update("privacyNoticeUrl", event.target.value)
                    }
                    placeholder="https://example.com/privacy"
                  />
                </Field>
              </FieldGrid>

              <Field>
                <FieldLabel>Preview</FieldLabel>
                <PrivacyNoticePreview
                  appearance={appearance}
                  text={behavior.privacyNoticeText ?? ""}
                  linkLabel={behavior.privacyNoticeLinkLabel ?? ""}
                  url={behavior.privacyNoticeUrl ?? ""}
                />
                <FieldDescription>
                  How it appears to visitors. The link uses your primary color and
                  opens in a new tab; without an http(s) URL the link text is
                  shown as plain text.
                </FieldDescription>
              </Field>
            </div>
          ) : null}
        </Field>
      </div>

      <Field className="rounded-xl border border-border bg-secondary p-4">
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
              WordPress embeds. Visitors can still minimize it. Turn this off to
              use the proactive greeting instead.
            </FieldDescription>
          </div>
          <Switch
            checked={behavior.openByDefault}
            disabled={behavior.enableProactiveGreeting}
            onCheckedChange={(checked) => update("openByDefault", checked)}
            aria-label="Start chatbot expanded"
          />
        </FieldRow>
      </Field>

      <Field className="rounded-xl border border-border bg-secondary p-4">
        <FieldRow>
          <div>
            <div className="flex items-center gap-2">
              <FieldLabel>Proactive greeting</FieldLabel>
              <Badge
                variant={
                  behavior.enableProactiveGreeting ? "success" : "secondary"
                }
              >
                {behavior.enableProactiveGreeting
                  ? "Invites visitors"
                  : "Off"}
              </Badge>
            </div>
            <FieldDescription>
              Show a small chat-style bubble beside the launcher that invites
              visitors to start the chat. It hides as soon as the chat opens.
              Mutually exclusive with “Start expanded” — only one can be on.
            </FieldDescription>
          </div>
          <Switch
            checked={behavior.enableProactiveGreeting}
            disabled={behavior.openByDefault}
            onCheckedChange={(checked) =>
              update("enableProactiveGreeting", checked)
            }
            aria-label="Show proactive greeting bubble"
          />
        </FieldRow>

        <Field className="pt-1">
          <FieldLabel htmlFor="proactiveGreetingMessage">
            Greeting message
          </FieldLabel>
          <Input
            id="proactiveGreetingMessage"
            type="text"
            value={behavior.proactiveGreetingMessage ?? ""}
            disabled={!behavior.enableProactiveGreeting}
            onChange={(event) =>
              update("proactiveGreetingMessage", event.target.value)
            }
            placeholder={defaultConfig.behavior.proactiveGreetingMessage}
          />
          <FieldDescription>
            Use {"{{companyName}}"} to insert the chatbot name. The bubble is
            dismissible and reappears on the next page visit.
          </FieldDescription>
        </Field>
      </Field>

      <Field>
        <div className="flex items-center justify-between gap-4">
          <FieldLabel htmlFor="autoOpenDelay">Auto-open delay</FieldLabel>
          <span className="text-sm font-medium text-muted-foreground">
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
