import type { QuickLink, QuickLinkActionType } from "@duran-chatbot/config";
import { MousePointerClick, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGrid,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PromptTextarea } from "@/components/ui/prompt-textarea";

type QuickLinksPanelProps = {
  quickLinks: QuickLink[];
  onChange: (quickLinks: QuickLink[]) => void;
};

const ACTION_LABELS: Record<QuickLinkActionType, string> = {
  link: "Open a link",
  quote: "Request a quote",
  prompt: "Ask the AI",
};

function actionType(link: QuickLink): QuickLinkActionType {
  return link.actionType ?? "link";
}

export function QuickLinksPanel({ quickLinks, onChange }: QuickLinksPanelProps) {
  const [draft, setDraft] = useState<Partial<QuickLink>>({
    label: "",
    actionType: "link",
    url: "",
    prompt: "",
    icon: "link",
  });

  const updateLink = (id: string, updates: Partial<QuickLink>) => {
    onChange(
      quickLinks.map((link) =>
        link.id === id ? { ...link, ...updates } : link,
      ),
    );
  };

  const removeLink = (id: string) => {
    onChange(quickLinks.filter((link) => link.id !== id));
  };

  const draftType = (draft.actionType ?? "link") as QuickLinkActionType;
  const draftValid =
    Boolean(draft.label) &&
    (draftType === "quote" ||
      (draftType === "link" && Boolean(draft.url)) ||
      (draftType === "prompt" && Boolean(draft.prompt)));

  const addLink = () => {
    if (!draftValid) return;

    onChange([
      ...quickLinks,
      {
        id: Date.now().toString(),
        label: draft.label!,
        actionType: draftType,
        url: draftType === "link" ? draft.url : undefined,
        prompt: draftType === "prompt" ? draft.prompt : undefined,
        showAfterAnswer: Boolean(draft.showAfterAnswer),
        icon: draft.icon ?? "link",
      },
    ]);
    setDraft({
      label: "",
      actionType: "link",
      url: "",
      prompt: "",
      showAfterAnswer: false,
      icon: "link",
    });
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Engagement"
        title="Action Menu"
        description="Configurable buttons shown in the widget's ☰ menu. Each can open a link, start a quote request, or ask the AI a preset question."
        action={
          <Badge variant="secondary">{quickLinks.length} buttons</Badge>
        }
      />

      <div className="space-y-4">
        {quickLinks.length === 0 ? (
          <Card className="border-dashed bg-background shadow-none">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-card text-muted-foreground">
                <MousePointerClick className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-base font-medium text-foreground">
                  No action buttons yet
                </h3>
                <p className="max-w-md text-sm leading-6 text-muted-foreground">
                  Add buttons like “Request a quote”, “Contact us”, or “What
                  services do you offer?” to make the chat more engaging.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {quickLinks.map((link) => {
          const type = actionType(link);
          return (
            <Card key={link.id} className="border-border bg-card shadow-none">
              <CardContent className="space-y-4 pt-5">
                <div className="flex items-center justify-between gap-3">
                  <Badge>{ACTION_LABELS[type]}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLink(link.id)}
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                    Remove
                  </Button>
                </div>
                <FieldGrid>
                  <Field>
                    <FieldLabel>Button label</FieldLabel>
                    <Input
                      value={link.label}
                      onChange={(event) =>
                        updateLink(link.id, { label: event.target.value })
                      }
                      placeholder="Request a quote"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Action</FieldLabel>
                    <Select
                      value={type}
                      onChange={(event) =>
                        updateLink(link.id, {
                          actionType: event.target.value as QuickLinkActionType,
                        })
                      }
                    >
                      <option value="link">Open a link</option>
                      <option value="quote">Request a quote</option>
                      <option value="prompt">Ask the AI</option>
                    </Select>
                  </Field>
                </FieldGrid>

                {type === "link" ? (
                  <FieldGrid>
                    <Field>
                      <FieldLabel>Destination URL</FieldLabel>
                      <Input
                        type="url"
                        value={link.url ?? ""}
                        onChange={(event) =>
                          updateLink(link.id, { url: event.target.value })
                        }
                        placeholder="https://example.com/contact"
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Icon</FieldLabel>
                      <Select
                        value={link.icon ?? "link"}
                        onChange={(event) =>
                          updateLink(link.id, { icon: event.target.value })
                        }
                      >
                        <option value="link">Link</option>
                        <option value="calendar">Calendar</option>
                        <option value="globe">Globe</option>
                        <option value="mail">Mail</option>
                        <option value="phone">Phone</option>
                      </Select>
                    </Field>
                  </FieldGrid>
                ) : null}

                {type === "prompt" ? (
                  <Field>
                    <FieldLabel>Preset message sent to the AI</FieldLabel>
                    <PromptTextarea
                      value={link.prompt ?? ""}
                      onChange={(next) =>
                        updateLink(link.id, { prompt: next })
                      }
                      placeholder="What services do you offer and how does pricing work?"
                      rows={2}
                    />
                    <FieldDescription>
                      When clicked, this is sent as the visitor's message so the
                      AI answers it inline.
                    </FieldDescription>
                  </Field>
                ) : null}

                {type === "quote" ? (
                  <FieldDescription>
                    Opens the Request-a-Quote form. On submit it emails the
                    visitor and CCs your sales recipients (configured in
                    Behavior) so everyone shares one thread.
                  </FieldDescription>
                ) : null}

                <div className="flex items-center justify-between gap-3 rounded-control border border-border bg-background px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Show as CTA after answers
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Also display this button as a call-to-action card under the
                      AI's replies.
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(link.showAfterAnswer)}
                    onCheckedChange={(checked) =>
                      updateLink(link.id, { showAfterAnswer: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-dashed bg-background shadow-none">
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-card text-muted-foreground">
              <Plus className="size-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-medium text-foreground">
                Add an action button
              </h3>
              <FieldDescription>
                Create a new shortcut for the widget menu.
              </FieldDescription>
            </div>
          </div>
          <FieldGrid>
            <Field>
              <FieldLabel>Button label</FieldLabel>
              <Input
                value={draft.label ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    label: event.target.value,
                  }))
                }
                placeholder="Request a quote"
              />
            </Field>
            <Field>
              <FieldLabel>Action</FieldLabel>
              <Select
                value={draftType}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    actionType: event.target.value as QuickLinkActionType,
                  }))
                }
              >
                <option value="link">Open a link</option>
                <option value="quote">Request a quote</option>
                <option value="prompt">Ask the AI</option>
              </Select>
            </Field>
          </FieldGrid>

          {draftType === "link" ? (
            <Field>
              <FieldLabel>Destination URL</FieldLabel>
              <Input
                type="url"
                value={draft.url ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, url: event.target.value }))
                }
                placeholder="https://example.com/contact"
              />
            </Field>
          ) : null}

          {draftType === "prompt" ? (
            <Field>
              <FieldLabel>Preset message sent to the AI</FieldLabel>
              <PromptTextarea
                value={draft.prompt ?? ""}
                onChange={(next) =>
                  setDraft((current) => ({
                    ...current,
                    prompt: next,
                  }))
                }
                placeholder="What services do you offer and how does pricing work?"
                rows={2}
              />
            </Field>
          ) : null}

          <div className="flex items-center justify-between gap-3 rounded-control border border-border bg-card px-3 py-2.5">
            <p className="text-sm font-medium text-foreground">
              Show as CTA after answers
            </p>
            <Switch
              checked={Boolean(draft.showAfterAnswer)}
              onCheckedChange={(checked) =>
                setDraft((current) => ({ ...current, showAfterAnswer: checked }))
              }
            />
          </div>

          <Button variant="outline" onClick={addLink} disabled={!draftValid}>
            <Plus className="size-4" />
            Add button
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
