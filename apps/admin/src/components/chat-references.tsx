import { useEffect, useRef } from "react"
import { BookOpen, ExternalLink, X } from "lucide-react"
import type { GroundedSource } from "@/api/grounding"

export interface ReferenceGroup {
  messageIndex: number
  question: string
  sources: GroundedSource[]
  searchSuggestions?: string
}

function ReferenceList({ groups }: { groups: ReferenceGroup[] }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
      {!groups.length && (
        <div className="border-l-2 border-blue-500/40 pl-3 text-sm leading-6 text-slate-400">
          Sources will appear here when a reply uses web search. Each group belongs to a question in this conversation.
        </div>
      )}
      <div className="space-y-6">
        {groups.map((group, index) => (
          <section key={group.messageIndex} className="min-w-0 border-b border-slate-800 pb-5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-blue-400">Research {index + 1}</p>
            <h3 className="mb-3 line-clamp-3 break-words text-sm font-medium leading-5 text-slate-100" title={group.question}>{group.question}</h3>
            <ol className="space-y-2">
              {group.sources.map((source) => (
                <li key={`${source.number}-${source.url}`}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="group flex min-w-0 items-start gap-2 border border-slate-800 bg-slate-900 px-3 py-3 hover:border-blue-500/50 hover:bg-blue-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                    <span className="shrink-0 text-xs font-semibold text-blue-400">[{source.number}]</span>
                    <span className="min-w-0 flex-1 break-words text-xs leading-5 text-slate-200">{source.title}</span>
                    <ExternalLink className="mt-0.5 size-3 shrink-0 text-slate-500 group-hover:text-blue-400" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ol>
            {!group.sources.length && <p className="text-xs text-slate-400">No source links returned.</p>}
            {group.searchSuggestions && (
              <div className="mt-3">
                <p className="mb-2 text-[11px] text-slate-400">Related Google searches</p>
                <iframe title={`Google Search suggestions for research ${index + 1}`} srcDoc={group.searchSuggestions} sandbox="allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" loading="lazy" className="h-44 w-full border-0 bg-white" />
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}

export function ChatReferences({ groups, open, onClose }: { groups: ReferenceGroup[]; open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (open) dialogRef.current?.showModal()
    else dialogRef.current?.close()
  }, [open])
  const heading = (
    <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-4">
      <BookOpen className="size-4 text-blue-400" aria-hidden="true" />
      <h2 className="text-sm font-semibold text-white">References</h2>
      <span className="ml-auto text-xs text-slate-400">{groups.reduce((count, group) => count + group.sources.length, 0)} sources</span>
    </div>
  )
  return <>
    <aside aria-label="Conversation references" className="hidden h-full w-80 shrink-0 flex-col border-l border-slate-800 bg-slate-950 xl:flex 2xl:w-96">
      {heading}
      <ReferenceList groups={groups} />
    </aside>
    <dialog ref={dialogRef} aria-label="Conversation references" onCancel={onClose} onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose() }} className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-lg border border-slate-700 bg-slate-950 p-0 text-white backdrop:bg-black/70">
      {open && <div className="flex max-h-[85dvh] flex-col">
        <button type="button" onClick={onClose} autoFocus className="flex shrink-0 items-center justify-end gap-2 px-4 py-3 text-xs text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400"><X className="size-4" />Close references</button>
        {heading}
        <ReferenceList groups={groups} />
      </div>}
    </dialog>
  </>
}
