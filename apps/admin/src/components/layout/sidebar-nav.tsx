import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SidebarItem } from "@/features/config-editor/types";
import { cn } from "@/lib/utils";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Scroll affordance: only rendered while there is content to reach in that direction. */
function EdgeArrow({ direction, onScroll, label }: {
  direction: "start" | "end";
  onScroll: () => void;
  label: string;
}) {
  const Icon = direction === "start" ? ChevronLeft : ChevronRight;
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-y-0 z-10 flex items-center",
        direction === "start"
          ? "left-0 bg-linear-to-r pr-4 pl-1 from-background via-background to-transparent"
          : "right-0 bg-linear-to-l pl-4 pr-1 from-background via-background to-transparent",
      )}
    >
      <button
        type="button"
        onClick={onScroll}
        aria-label={label}
        className="pointer-events-auto grid size-8 shrink-0 place-items-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Icon className="size-4" />
      </button>
    </div>
  );
}

/** Configuration sections live in a left sidebar on large screens and a horizontal scroll strip on small ones. */
export function SidebarNav({ items, activeId, onSelect, dirty }: {
  items: SidebarItem[];
  activeId: string;
  onSelect: (id: string) => void;
  dirty: boolean;
}) {
  const scrollerRef = useRef<HTMLElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const syncEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const remaining = el.scrollWidth - el.clientWidth - el.scrollLeft;
    setEdges({ start: el.scrollLeft > 1, end: remaining > 1 });
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    syncEdges();
    el.addEventListener("scroll", syncEdges, { passive: true });
    window.addEventListener("resize", syncEdges);
    // Content width changes when labels wrap or the item list changes.
    const observer = new ResizeObserver(syncEdges);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);
    return () => {
      el.removeEventListener("scroll", syncEdges);
      window.removeEventListener("resize", syncEdges);
      observer.disconnect();
    };
  }, [syncEdges, items.length]);

  // Keep the selected section in view, clear of the edge arrows.
  useEffect(() => {
    const el = scrollerRef.current;
    const active = el?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!el || !active) return;
    const edge = el.getBoundingClientRect();
    const target = active.getBoundingClientRect();
    const left = el.scrollLeft + (target.left - edge.left);
    const right = left + target.width;
    const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
    if (left < el.scrollLeft + 48) el.scrollTo({ left: left - 48, behavior });
    else if (right > el.scrollLeft + el.clientWidth - 48) {
      el.scrollTo({ left: right - el.clientWidth + 48, behavior });
    }
  }, [activeId]);

  const scrollByStep = (direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * Math.max(160, Math.round(el.clientWidth * 0.6)),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  // Sticky/scroll behaviour lives on the AdminShell column that also holds the
  // snapshot and embed cards, so this renders as a plain block.
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pb-3 text-xs text-muted-foreground">
        <span>Profile configuration</span>
        <span role="status">{dirty ? "Unsaved changes" : "All changes saved"}</span>
      </div>
      <div className="relative">
        {edges.start && (
          <EdgeArrow direction="start" label="Scroll sections left" onScroll={() => scrollByStep(-1)} />
        )}
        <nav
          ref={scrollerRef}
          aria-label="Configuration sections"
          className="flex gap-2 overflow-x-auto scroll-px-12 pb-1 lg:flex-col lg:gap-1.5 lg:overflow-x-visible lg:pb-0"
        >
          {items.map(({ id, icon: Icon, label }) => (
            <button key={id} type="button" onClick={() => onSelect(id)} aria-current={id === activeId ? "page" : undefined}
              className={cn("nav-link shrink-0 border lg:w-full lg:justify-start", id === activeId ? "border-foreground bg-secondary" : "border-transparent text-muted-foreground")}>
              <Icon className="size-4 shrink-0" /><span>{label}</span>
            </button>
          ))}
        </nav>
        {edges.end && (
          <EdgeArrow direction="end" label="Scroll sections right" onScroll={() => scrollByStep(1)} />
        )}
      </div>
    </div>
  );
}
