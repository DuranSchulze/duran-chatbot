import { useEffect, useId, useState } from "react"
import { BrainCircuit, ChevronDown } from "lucide-react"
import { formatMessage } from "@/lib/format-message"
import { cn } from "@/lib/utils"

export function ThinkingSummary({ text, pending = false }: { text: string; pending?: boolean }) {
  const [open, setOpen] = useState(pending)
  const id = useId()
  useEffect(() => { setOpen(pending) }, [pending])
  if (!text) return null
  return (
    <div className="mb-3 min-w-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="group flex w-full items-center gap-2.5 px-0.5 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
      >
        <BrainCircuit
          className={cn("size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-muted-foreground", pending && "animate-pulse")}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
          Thinking summary
        </span>
        {pending && (
          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            generating
          </span>
        )}
        <ChevronDown
          className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:text-muted-foreground", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      <div id={id} hidden={!open} className="space-y-1.5 px-0.5 pb-1">
        <p className="text-[10px] leading-4 text-muted-foreground">
          Model summary of the reasoning behind this answer — the full chain isn’t shown.
        </p>
        <div
          className="chat-rich-text break-words text-[13px] leading-6 text-foreground"
          dangerouslySetInnerHTML={{ __html: formatMessage(text) }}
        />
      </div>
    </div>
  )
}
