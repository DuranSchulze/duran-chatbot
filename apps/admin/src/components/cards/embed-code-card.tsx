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
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Embed snippet
        </p>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 text-[11px] leading-5 text-slate-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}
