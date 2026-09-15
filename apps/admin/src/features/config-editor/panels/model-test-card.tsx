import { useEffect, useRef, useState } from "react";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAuthHeaders } from "@/lib/auth";

type TestResult = { model: string; text?: string; elapsedMs?: number; error?: string };

export function ModelTestCard({ model }: { model: string }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => request.current?.abort(), []);

  const testModel = async () => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setRunning(true);
    setResult(null);
    const timeout = window.setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ model }),
        signal: controller.signal,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The model test failed.");
      setResult({ model, text: payload.text, elapsedMs: payload.elapsedMs });
    } catch (error) {
      setResult({ model, error: controller.signal.aborted
        ? "The test timed out. Try again."
        : error instanceof Error ? error.message : "The model test failed." });
    } finally {
      window.clearTimeout(timeout);
      request.current = null;
      setRunning(false);
    }
  };

  return (
    <section aria-labelledby="model-test-heading" className="space-y-4 rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h3 id="model-test-heading" className="text-sm font-medium">Test model</h3>
          <p className="text-xs leading-5 text-muted-foreground">
            Send a short greeting to the selected model. No save needed. Each test uses Gemini API quota.
          </p>
        </div>
        <Button type="button" variant="outline" disabled={running || !model} onClick={testModel}>
          {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
          {running ? "Testing…" : "Test model"}
        </Button>
      </div>
      <div role="status" aria-live="polite" className="min-w-0 text-sm">
        {running && <p className="text-muted-foreground">Waiting for a response…</p>}
        {result && (
          <div className="space-y-2">
            <p className="break-words text-xs text-muted-foreground">Tested: {result.model}</p>
            {result.error ? <p>{result.error}</p> : <>
              <p>Model responded in {((result.elapsedMs ?? 0) / 1000).toFixed(2)}s</p>
              <p className="whitespace-pre-wrap break-words rounded-xl bg-secondary p-3">{result.text}</p>
            </>}
          </div>
        )}
      </div>
    </section>
  );
}
