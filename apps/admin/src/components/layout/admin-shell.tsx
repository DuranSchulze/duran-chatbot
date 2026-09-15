import type { ReactNode } from "react";

export function AdminShell({ header, sidebar, main, aside }: {
  header: ReactNode;
  sidebar: ReactNode;
  main: ReactNode;
  aside: ReactNode;
  sidebarOpen: boolean;
  onSidebarClose: () => void;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="top-navigation sticky top-0 z-30">
        <div className="mx-auto max-w-[1200px]">{header}</div>
      </header>
      <main className="page-container space-y-[72px]">
        <div className="grid items-start gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/*
            Left column: section nav, then the snapshot/embed cards. The wrapper
            is `contents` on small screens so the cards can fall below the panel
            (order-3) instead of pushing the editor down the page.
          */}
          <div className="contents lg:sticky lg:top-24 lg:col-start-1 lg:row-start-1 lg:flex lg:max-h-[calc(100dvh_-_7rem)] lg:min-w-0 lg:flex-col lg:gap-6 lg:overflow-y-auto">
            <div className="order-1 min-w-0 lg:order-none">{sidebar}</div>
            {aside ? (
              <div className="order-3 min-w-0 space-y-6 lg:order-none">{aside}</div>
            ) : null}
          </div>
          <div className="order-2 min-w-0 lg:col-start-2 lg:row-start-1 lg:order-none">
            {main}
          </div>
        </div>
      </main>
    </div>
  );
}
