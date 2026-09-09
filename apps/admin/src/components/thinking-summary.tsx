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
        className="group flex w-full items-center gap-2.5 px-0.5 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      >
        <BrainCircuit
          className={cn("size-3.5 shrink-0 text-blue-400/80 transition-colors group-hover:text-blue-300", pending && "animate-pulse")}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-400 transition-colors group-hover:text-slate-200">
          Thinking summary
        </span>
        {pending && (
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-blue-300">
            generating
          </span>
        )}
        <ChevronDown
          className={cn("size-3.5 shrink-0 text-slate-600 transition-transform duration-200 group-hover:text-slate-400", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      <div id={id} hidden={!open} className="space-y-1.5 px-0.5 pb-1">
        <p className="text-[10px] leading-4 text-slate-500">
          Model summary of the reasoning behind this answer — the full chain isn’t shown.
        </p>
        <div
          className="chat-rich-text break-words text-[13px] leading-6 text-slate-300"
          dangerouslySetInnerHTML={{ __html: formatMessage(text) }}
        />
      </div>
    </div>
  )
}
