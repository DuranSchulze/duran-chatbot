import type { DatasetEntry } from "@duran-chatbot/config";
import { Database, Plus, Tag, Trash2, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

type DatasetPanelProps = {
  dataset: DatasetEntry[];
  onChange: (dataset: DatasetEntry[]) => void;
};

export function DatasetPanel({ dataset, onChange }: DatasetPanelProps) {
  const [draft, setDraft] = useState<Partial<DatasetEntry>>({
    title: "",
    content: "",
    category: "General",
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

  const addEntry = () => {
    if (!draft.title || !draft.content || !(draft.keywords?.length ?? 0)) {
      return;
    }

    onChange([
      ...dataset,
      {
        id: Date.now().toString(),
        title: draft.title,
        content: draft.content,
        category: draft.category ?? "General",
        keywords: draft.keywords ?? [],
      },
    ]);

    setDraft({ title: "", content: "", category: "General", keywords: [] });
    setKeyword("");
  };

  const removeEntry = (id: string) => {
    onChange(dataset.filter((entry) => entry.id !== id));
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Knowledge"
        title="Dataset"
        description="Store reference entries that guide answers to common questions."
        action={<Badge variant="secondary">{dataset.length} entries</Badge>}
      />

      <div className="space-y-4">
        {dataset.length === 0 ? (
          <Card className="border-dashed bg-slate-50/70 shadow-none">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-blue-600">
                <Database className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900">
                  No knowledge entries yet
                </h3>
                <p className="max-w-md text-sm leading-6 text-slate-500">
                  Add FAQs, policies, or trusted knowledge here.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {dataset.map((entry) => (
          <Card key={entry.id} className="bg-white shadow-none">
            <CardContent className="space-y-4 pt-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900">
                      {entry.title}
                    </h3>
                    <Badge variant="secondary">{entry.category}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {entry.keywords.map((item) => (
                      <Badge key={item}>{item}</Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEntry(entry.id)}
                >
                  <Trash2 className="size-4 text-rose-600" />
                  Remove
                </Button>
              </div>
              <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                {entry.content}
              </p>
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
                Add dataset entry
              </h3>
              <FieldDescription>
                Add the content and keywords that should trigger it.
              </FieldDescription>
            </div>
          </div>

          <FieldGrid>
            <Field>
              <FieldLabel>Title</FieldLabel>
              <Input
                value={draft.title ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Shipping policy"
              />
            </Field>
            <Field>
              <FieldLabel>Category</FieldLabel>
              <Input
                value={draft.category ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
                placeholder="Operations"
              />
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
                placeholder="delivery, quote, warranty"
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
                    className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                  >
                    {item}
                    <X className="size-3" />
                  </button>
                ))}
              </div>
            ) : null}
          </Field>

          <Field>
            <FieldLabel>Content</FieldLabel>
            <Textarea
              rows={6}
              value={draft.content ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  content: event.target.value,
                }))
              }
              placeholder="Detailed response, policy text, product explanation, or knowledge snippet."
            />
          </Field>

          <Button
            onClick={addEntry}
            disabled={
              !draft.title || !draft.content || !(draft.keywords?.length ?? 0)
            }
          >
            <Plus className="size-4" />
            Add Entry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
