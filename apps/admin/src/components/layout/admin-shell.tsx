import type { ReactNode } from "react"

export function AdminShell({
  header,
  sidebar,
  main,
  aside,
}: {
  header: ReactNode
  sidebar: ReactNode
  main: ReactNode
  aside: ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        {header}
        <div className="mt-6 grid flex-1 gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="xl:sticky xl:top-8 xl:self-start">{sidebar}</aside>
          <div className="min-w-0 space-y-6">
            <main>{main}</main>
            {aside ? <section className="grid gap-4 lg:grid-cols-3">{aside}</section> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
