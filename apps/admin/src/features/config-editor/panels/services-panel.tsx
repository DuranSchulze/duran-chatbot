import type { ServiceEntry } from "@duran-chatbot/config";
import { BriefcaseBusiness, Plus, Tag, Trash2, X } from "lucide-react";
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
import { PromptTextarea } from "@/components/ui/prompt-textarea";

type ServicesPanelProps = {
  services: ServiceEntry[];
  onChange: (services: ServiceEntry[]) => void;
};

export function ServicesPanel({ services, onChange }: ServicesPanelProps) {
  const [draft, setDraft] = useState<Partial<ServiceEntry>>({
    name: "",
    price: "",
    process: "",
    notes: "",
    cta: "",
    keywords: [],
  });
  const [keyword, setKeyword] = useState("");

  const addKeyword = () => {
    const nextKeyword = keyword.trim().toLowerCase();
    if (!nextKeyword) {
      return;
    }

    setDraft((current) => ({
      ...current,
      keywords: [...new Set([...(current.keywords ?? []), nextKeyword])],
    }));
    setKeyword("");
  };

  const removeKeyword = (value: string) => {
    setDraft((current) => ({
      ...current,
      keywords: (current.keywords ?? []).filter((item) => item !== value),
    }));
  };

  const addService = () => {
    if (
      !draft.name ||
      !draft.price ||
      !draft.process ||
      !draft.cta ||
      !(draft.keywords?.length ?? 0)
    ) {
      return;
    }

    onChange([
      ...services,
      {
        id: Date.now().toString(),
        name: draft.name,
        keywords: draft.keywords ?? [],
        price: draft.price,
        process: draft.process,
        notes: draft.notes ?? "",
        cta: draft.cta,
      },
    ]);

    setDraft({
      name: "",
      price: "",
      process: "",
      notes: "",
      cta: "",
      keywords: [],
    });
    setKeyword("");
  };

  const removeService = (id: string) => {
    onChange(services.filter((service) => service.id !== id));
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Sales"
        title="Services"
        description="Store service details and flexible pricing so the bot can answer like a helpful sales assistant."
        action={<Badge variant="secondary">{services.length} services</Badge>}
      />

      <div className="space-y-4">
        {services.length === 0 ? (
          <Card className="border-dashed bg-background shadow-none">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-card text-muted-foreground">
                <BriefcaseBusiness className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-base font-medium text-foreground">
                  No services yet — that's okay
                </h3>
                <p className="max-w-md text-sm leading-6 text-muted-foreground">
                  The chatbot still provides general legal guidance based on its
                  system prompt. Entries you add here make it more precise:
                  it quotes your pricing, process, and next steps instead of
                  staying general. It never invents prices either way.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {services.map((service) => (
          <Card key={service.id} className="bg-card shadow-none">
            <CardContent className="space-y-4 pt-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-medium text-foreground">
                      {service.name}
                    </h3>
                    <Badge variant="secondary">{service.price}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {service.keywords.map((item) => (
                      <Badge key={item}>{item}</Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeService(service.id)}
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                  Remove
                </Button>
              </div>

              <div className="space-y-3 text-sm leading-7 text-muted-foreground">
                <p className="rounded-xl border border-border bg-background p-4">
                  <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Process
                  </span>
                  <span className="mt-2 block">{service.process}</span>
                </p>
                {service.notes ? (
                  <p className="rounded-xl border border-border bg-background p-4">
                    <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Notes
                    </span>
                    <span className="mt-2 block">{service.notes}</span>
                  </p>
                ) : null}
                <p className="rounded-xl border border-border bg-background p-4">
                  <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Next step
                  </span>
                  <span className="mt-2 block">{service.cta}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed bg-background shadow-none">
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-card text-muted-foreground">
              <Plus className="size-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-medium text-foreground">
                Add service
              </h3>
              <FieldDescription>
                Add service details, pricing guidance, and the next step the bot should recommend.
              </FieldDescription>
            </div>
          </div>

          <FieldGrid>
            <Field>
              <FieldLabel>Service name</FieldLabel>
              <Input
                value={draft.name ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Annulment"
              />
            </Field>
            <Field>
              <FieldLabel>Price</FieldLabel>
              <Input
                value={draft.price ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    price: event.target.value,
                  }))
                }
                placeholder="40,000 or 40,000 - 50,000 or 50,000, price may vary"
              />
              <FieldDescription>
                Use one flexible text field for fixed, ranged, or variable pricing wording.
              </FieldDescription>
            </Field>
          </FieldGrid>

          <Field>
            <FieldLabel>Keywords</FieldLabel>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addKeyword();
                  }
                }}
                placeholder="annulment, marriage, family law"
              />
              <Button variant="outline" onClick={addKeyword}>
                <Tag className="size-4" />
                Add Keyword
              </Button>
            </div>
            {(draft.keywords ?? []).length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {(draft.keywords ?? []).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => removeKeyword(item)}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {item}
                    <X className="size-3" />
                  </button>
                ))}
              </div>
            ) : null}
          </Field>

          <Field>
            <FieldLabel>Process</FieldLabel>
            <PromptTextarea
              rows={5}
              value={draft.process ?? ""}
              onChange={(next) =>
                setDraft((current) => ({
                  ...current,
                  process: next,
                }))
              }
              placeholder="Describe how the service works and what the client can expect."
            />
            <FieldDescription>
              This is what the bot should explain when asked how the service works.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel>Notes</FieldLabel>
            <PromptTextarea
              rows={4}
              value={draft.notes ?? ""}
              onChange={(next) =>
                setDraft((current) => ({
                  ...current,
                  notes: next,
                }))
              }
              placeholder="Add caveats, inclusions, exclusions, or important sales qualifiers."
            />
            <FieldDescription>
              Use this for sales caveats, qualifications, or important pricing notes.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel>CTA / next step</FieldLabel>
            <PromptTextarea
              rows={3}
              value={draft.cta ?? ""}
              onChange={(next) =>
                setDraft((current) => ({
                  ...current,
                  cta: next,
                }))
              }
              placeholder="Invite the user to book a consultation or send details for a formal quote."
            />
            <FieldDescription>
              This is the recommended next step the bot should guide the user toward.
            </FieldDescription>
          </Field>

          <Button variant="outline"
            onClick={addService}
            disabled={
              !draft.name ||
              !draft.price ||
              !draft.process ||
              !draft.cta ||
              !(draft.keywords?.length ?? 0)
            }
          >
            <Plus className="size-4" />
            Add Service
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
