import { CheckCircle2, ExternalLink, Menu, Save } from "lucide-react";

import { Button } from "@/components/ui/button";

type TopBarProps = {
  saving: boolean;
  dirty: boolean;
  saveStatus: string;
  onSave: () => void;
  onPreview: () => void;
  onMenuClick: () => void;
  activeLabel?: string;
};

export function TopBar({
  saving,
  dirty,
  saveStatus,
  onSave,
  onPreview,
  onMenuClick,
  activeLabel,
}: TopBarProps) {
  return (
    <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={onMenuClick}
        className="flex items-center justify-center size-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-slate-900 truncate">
          {activeLabel ?? "Chatbot Settings"}
        </h1>
        <p className="hidden sm:block text-xs text-slate-400">
          Manage appearance, behavior, and knowledge.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {saveStatus ? (
          <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <CheckCircle2 className="size-3.5" />
            Saved
          </span>
        ) : dirty ? (
          <span className="hidden sm:block text-xs font-medium text-amber-600">
            Unsaved changes
          </span>
        ) : null}

        <Button
          variant="outline"
          size="sm"
          onClick={onPreview}
          className="h-8 gap-1.5 px-3 text-xs"
        >
          <ExternalLink className="size-3.5" />
          Preview
        </Button>

        <Button
          size="sm"
          onClick={onSave}
          disabled={saving || !dirty}
          className="h-8 gap-1.5 px-3 text-xs"
        >
          <Save className="size-3.5" />
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
