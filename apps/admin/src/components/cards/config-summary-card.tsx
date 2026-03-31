import type { ChatbotConfig } from "@duran-chatbot/config";
import { Bot, Database, Link2, Palette } from "lucide-react";

export function ConfigSummaryCard({ config }: { config: ChatbotConfig }) {
  const items = [
    { label: "Brand", value: config.appearance.companyName, icon: Palette },
    { label: "Model", value: config.ai.model, icon: Bot },
    {
      label: "Quick Links",
      value: `${config.quickLinks.length} links`,
      icon: Link2,
    },
    {
      label: "Dataset",
      value: `${config.dataset.length} entries`,
      icon: Database,
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
        Config snapshot
      </p>
      <div className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Icon className="size-3.5" />
              </div>
              <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                <span className="text-xs text-slate-500 shrink-0">
                  {item.label}
                </span>
                <span className="text-xs font-semibold text-slate-900 truncate text-right">
                  {item.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
