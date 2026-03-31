import { useEffect, useMemo, useState } from "react";
import type { AIConfig } from "@duran-chatbot/config";

import { fetchModels, type GeminiModelOption } from "@/api/models";
import {
  Field,
  FieldDescription,
  FieldGrid,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

type AIPanelProps = {
  ai: AIConfig;
  onChange: (ai: AIConfig) => void;
};

export function AIPanel({ ai, onChange }: AIPanelProps) {
  const [models, setModels] = useState<GeminiModelOption[]>([]);
  const [modelsError, setModelsError] = useState("");

  const update = <K extends keyof AIConfig>(key: K, value: AIConfig[K]) => {
    onChange({ ...ai, [key]: value });
  };

  useEffect(() => {
    let cancelled = false;

    const loadModels = async () => {
      try {
        const nextModels = await fetchModels();
        if (!cancelled) {
          setModels(nextModels);
          setModelsError("");
        }
      } catch (error) {
        if (!cancelled) {
          setModelsError(
            error instanceof Error ? error.message : "Failed to load models",
          );
        }
      }
    };

    loadModels();

    return () => {
      cancelled = true;
    };
  }, []);

  const modelOptions = useMemo(() => {
    const fallbackOptions: GeminiModelOption[] = [
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    ];

    const options = models.length > 0 ? models : fallbackOptions;

    if (!options.some((option) => option.id === ai.model)) {
      return [{ id: ai.model, label: ai.model }, ...options];
    }

    return options;
  }, [ai.model, models]);

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Reasoning"
        title="AI Settings"
        description="Adjust the model, response settings, and prompt instructions."
      />

      <FieldGrid>
        <Field>
          <FieldLabel htmlFor="model">Model</FieldLabel>
          <Select
            id="model"
            value={ai.model}
            onChange={(event) => update("model", event.target.value)}
          >
            {modelOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
          <FieldDescription>
            {modelsError
              ? `Using fallback model list. ${modelsError}`
              : "Loaded from the Gemini models API."}
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="maxTokens">Max tokens</FieldLabel>
          <Input
            id="maxTokens"
            type="number"
            min={256}
            max={8192}
            step={256}
            value={ai.maxTokens}
            onChange={(event) =>
              update("maxTokens", Number(event.target.value))
            }
          />
        </Field>
      </FieldGrid>

      <Field>
        <div className="flex items-center justify-between gap-4">
          <FieldLabel htmlFor="temperature">Temperature</FieldLabel>
          <span className="text-sm font-semibold text-blue-600">
            {ai.temperature.toFixed(1)}
          </span>
        </div>
        <Slider
          id="temperature"
          min={0}
          max={1}
          step={0.1}
          value={ai.temperature}
          onChange={(event) =>
            update("temperature", Number(event.target.value))
          }
        />
        <FieldDescription>
          Lower values keep answers stable. Higher values allow more variation.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="systemPrompt">System prompt</FieldLabel>
        <Textarea
          id="systemPrompt"
          rows={12}
          value={ai.systemPrompt}
          onChange={(event) => update("systemPrompt", event.target.value)}
          className="font-mono text-[13px] leading-6"
        />
        <FieldDescription>
          Use this as the single source of truth for personality, guardrails,
          and domain expertise.
        </FieldDescription>
      </Field>
    </div>
  );
}
