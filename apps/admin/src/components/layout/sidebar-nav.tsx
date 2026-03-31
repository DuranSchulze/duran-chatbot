import type { SidebarItem } from "@/features/config-editor/types";
import { cn } from "@/lib/utils";

type SidebarNavProps = {
  items: SidebarItem[];
  activeId: string;
  onSelect: (id: string) => void;
  dirty: boolean;
};

export function SidebarNav({
  items,
  activeId,
  onSelect,
  dirty,
}: SidebarNavProps) {
  return (
    <div className="flex flex-1 flex-col">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <img
          src="/logo.webp"
          alt="Logo"
          className="h-9 w-auto shrink-0 object-contain"
        />
      </div>

      {/* Status pill */}
      <div className="px-4 py-3">
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium",
            dirty
              ? "bg-amber-500/15 text-amber-300"
              : "bg-emerald-500/15 text-emerald-400",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              dirty ? "bg-amber-400" : "bg-emerald-400",
            )}
          />
          {dirty ? "Unsaved changes" : "All changes saved"}
        </div>
      </div>

      {/* Nav label */}
      <div className="px-5 pb-2 pt-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Settings
        </p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 px-3 pb-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeId;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all",
                isActive
                  ? "bg-blue-500/20 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100",
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  isActive
                    ? "text-blue-400"
                    : "text-slate-500 group-hover:text-slate-300",
                )}
              />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <span className="ml-auto size-1.5 rounded-full bg-blue-400" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
