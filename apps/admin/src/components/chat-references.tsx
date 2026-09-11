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
        <div className="border-l-2 border-border pl-3 text-sm leading-6 text-muted-foreground">
          Sources will appear here when a reply uses web search. Each group belongs to a question in this conversation.
        </div>
      )}
      <div className="space-y-6">
        {groups.map((group, index) => (
          <section key={group.messageIndex} className="min-w-0 border-b border-border pb-5">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Research {index + 1}</p>
            <h3 className="font-display mb-3 line-clamp-3 break-words text-sm font-medium leading-5 text-foreground" title={group.question}>{group.question}</h3>
            <ol className="space-y-2">
              {group.sources.map((source) => (
                <li key={`${source.number}-${source.url}`}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="group flex min-w-0 items-start gap-2 border border-border bg-card px-3 py-3 hover:border-border hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground">
                    <span className="shrink-0 text-xs font-medium text-muted-foreground">[{source.number}]</span>
                    <span className="min-w-0 flex-1 break-words text-xs leading-5 text-foreground">{source.title}</span>
                    <ExternalLink className="mt-0.5 size-3 shrink-0 text-muted-foreground group-hover:text-muted-foreground" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ol>
            {!group.sources.length && <p className="text-xs text-muted-foreground">No source links returned.</p>}
            {group.searchSuggestions && (
              <div className="mt-3">
                <p className="mb-2 text-[11px] text-muted-foreground">Related Google searches</p>
                <iframe title={`Google Search suggestions for research ${index + 1}`} srcDoc={group.searchSuggestions} sandbox="allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" loading="lazy" className="h-44 w-full border-0 bg-card" />
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
    <div className="flex items-center gap-2 border-b border-border px-4 py-4">
      <BookOpen className="size-4 text-muted-foreground" aria-hidden="true" />
      <h2 className="font-display text-sm font-medium text-foreground">References</h2>
      <span className="ml-auto text-xs text-muted-foreground">{groups.reduce((count, group) => count + group.sources.length, 0)} sources</span>
    </div>
  )
  return <>
    <aside aria-label="Conversation references" className="hidden h-full w-80 shrink-0 flex-col border-l border-border bg-background xl:flex 2xl:w-96">
      {heading}
      <ReferenceList groups={groups} />
    </aside>
    <dialog ref={dialogRef} aria-label="Conversation references" onCancel={onClose} onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose() }} className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-lg border border-border bg-background p-0 text-foreground backdrop:bg-black/70">
      {open && <div className="flex max-h-[85dvh] flex-col">
        <button type="button" onClick={onClose} autoFocus className="flex shrink-0 items-center justify-end gap-2 px-4 py-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground"><X className="size-4" />Close references</button>
        {heading}
        <ReferenceList groups={groups} />
      </div>}
    </dialog>
  </>
}
