import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusBannerProps = {
  tone?: "info" | "error";
  title: string;
  description: string;
};

export function StatusBanner({
  tone = "info",
  title,
  description,
}: StatusBannerProps) {
  const Icon = tone === "error" ? AlertTriangle : Info;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4",
        tone === "error"
          ? "border-rose-200 bg-rose-50"
          : "border-slate-200 bg-white",
      )}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          tone === "error"
            ? "bg-rose-100 text-rose-600"
            : "bg-slate-100 text-slate-500",
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  );
}
