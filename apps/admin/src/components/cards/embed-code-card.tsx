import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { useToast } from "@/components/ui/toaster";

type EmbedCodeCardProps = {
  code: string;
};

export function EmbedCodeCard({ code }: EmbedCodeCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast({ title: "Embed code copied to clipboard", tone: "success" });
    } catch {
      toast({
        title: "Failed to copy embed code",
        description: "Your browser blocked clipboard access — select the code and copy manually.",
        tone: "error",
      });
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Embed snippet
        </p>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-control border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:bg-card"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-xl bg-card p-3 text-[11px] leading-5 text-foreground">
        <code>{code}</code>
      </pre>
    </div>
  );
}
