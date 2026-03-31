import type { QuickLink } from "@duran-chatbot/config";
import { Link2, Plus, Trash2 } from "lucide-react";
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

type QuickLinksPanelProps = {
  quickLinks: QuickLink[];
  onChange: (quickLinks: QuickLink[]) => void;
};

export function QuickLinksPanel({
  quickLinks,
  onChange,
}: QuickLinksPanelProps) {
  const [draft, setDraft] = useState<Partial<QuickLink>>({
    label: "",
    url: "",
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

  const addLink = () => {
    if (!draft.label || !draft.url) {
      return;
    }

    onChange([
      ...quickLinks,
      {
        id: Date.now().toString(),
        label: draft.label,
        url: draft.url,
        icon: draft.icon ?? "link",
      },
    ]);
    setDraft({ label: "", url: "", icon: "link" });
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Conversion"
        title="Quick Links"
        description="Add shortcut actions for common visitor tasks."
        action={<Badge variant="secondary">{quickLinks.length} links</Badge>}
      />

      <div className="space-y-4">
        {quickLinks.length === 0 ? (
          <Card className="border-dashed bg-slate-50/70 shadow-none">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-blue-600">
                <Link2 className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900">
                  No quick links yet
                </h3>
                <p className="max-w-md text-sm leading-6 text-slate-500">
                  Add booking, contact, or support shortcuts here.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {quickLinks.map((link) => (
          <Card key={link.id} className="border-slate-200 bg-white shadow-none">
            <CardContent className="space-y-4 pt-5">
              <div className="flex items-center justify-between gap-3">
                <Badge>{link.icon ?? "link"}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLink(link.id)}
                >
                  <Trash2 className="size-4 text-rose-600" />
                  Remove
                </Button>
              </div>
              <FieldGrid>
                <Field>
                  <FieldLabel>Label</FieldLabel>
                  <Input
                    value={link.label}
                    onChange={(event) =>
                      updateLink(link.id, { label: event.target.value })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>Icon</FieldLabel>
                  <Select
                    value={link.icon}
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
              <Field>
                <FieldLabel>Destination URL</FieldLabel>
                <Input
                  type="url"
                  value={link.url}
                  onChange={(event) =>
                    updateLink(link.id, { url: event.target.value })
                  }
                  placeholder="https://example.com"
                />
              </Field>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed bg-slate-50/70 shadow-none">
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-blue-600">
              <Plus className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Add a quick link
              </h3>
              <FieldDescription>
                Create a new shortcut for the widget menu.
              </FieldDescription>
            </div>
          </div>
          <FieldGrid>
            <Field>
              <FieldLabel>Label</FieldLabel>
              <Input
                value={draft.label ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    label: event.target.value,
                  }))
                }
                placeholder="Book a demo"
              />
            </Field>
            <Field>
              <FieldLabel>Icon</FieldLabel>
              <Select
                value={draft.icon ?? "link"}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    icon: event.target.value,
                  }))
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
          <Field>
            <FieldLabel>Destination URL</FieldLabel>
            <Input
              type="url"
              value={draft.url ?? ""}
              onChange={(event) =>
                setDraft((current) => ({ ...current, url: event.target.value }))
              }
              placeholder="https://example.com/demo"
            />
          </Field>
          <Button onClick={addLink} disabled={!draft.label || !draft.url}>
            <Plus className="size-4" />
            Add Link
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
