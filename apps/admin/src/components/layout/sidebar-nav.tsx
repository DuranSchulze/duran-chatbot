import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Workspace</CardTitle>
            <CardDescription>Choose a settings section.</CardDescription>
          </div>
          <Badge variant={dirty ? "warning" : "success"}>
            {dirty ? "Draft" : "Saved"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isActive = item.id === activeId;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                "group flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition",
                isActive
                  ? "border-primary/15 bg-slate-50 text-foreground"
                  : "border-transparent bg-transparent hover:border-border/80 hover:bg-slate-50",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border",
                  isActive
                    ? "border-primary/10 bg-white text-primary"
                    : "border-border/80 bg-white text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{item.label}</span>
                  <span className="text-[11px] text-muted-foreground">
                    0{index + 1}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
