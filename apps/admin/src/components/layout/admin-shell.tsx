import type { ReactNode } from "react";
import { X } from "lucide-react";

export function AdminShell({
  header,
  sidebar,
  main,
  aside,
  sidebarOpen,
  onSidebarClose,
}: {
  header: ReactNode;
  sidebar: ReactNode;
  main: ReactNode;
  aside: ReactNode;
  sidebarOpen: boolean;
  onSidebarClose: () => void;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-10">
        <div className="flex flex-1 flex-col overflow-y-auto bg-slate-900">
          {sidebar}
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onSidebarClose}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-slate-900">
            <div className="flex items-center justify-end px-4 pt-4">
              <button
                type="button"
                onClick={onSidebarClose}
                className="flex items-center justify-center size-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Sticky header */}
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
          {header}
        </div>

        {/* Page content */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl space-y-6">
            {main}
            {aside ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {aside}
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
