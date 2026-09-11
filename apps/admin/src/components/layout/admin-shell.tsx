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
        {sidebar}
      </header>
      <main className="page-container space-y-[72px]">
        {main}
        {aside && <div className="grid items-start gap-8 md:grid-cols-2 xl:grid-cols-3">{aside}</div>}
      </main>
    </div>
  );
}
