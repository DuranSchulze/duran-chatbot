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
        "flex items-start gap-3 rounded-xl border p-4",
        tone === "error"
          ? "border-border bg-secondary"
          : "border-border bg-card",
      )}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-control",
          tone === "error"
            ? "bg-secondary text-muted-foreground"
            : "bg-card text-muted-foreground",
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
