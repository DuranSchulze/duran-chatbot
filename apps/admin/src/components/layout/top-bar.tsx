import {
  CheckCircle2,
  ChevronLeft,
  ExternalLink,
  LogOut,
  Menu,
  MessageSquare,
  Save,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

type TopBarProps = {
  saving: boolean;
  dirty: boolean;
  saveStatus: string;
  onSave: () => void;
  onPreview: () => void;
  onMenuClick: () => void;
  activeLabel?: string;
  profileName?: string;
  onBackToProfiles?: () => void;
};

export function TopBar({
  saving,
  dirty,
  saveStatus,
  onSave,
  onPreview,
  onMenuClick,
  activeLabel,
  profileName,
  onBackToProfiles,
}: TopBarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }
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

      {/* Back to profiles + page title */}
      <div className="flex flex-1 items-center gap-2 min-w-0">
        {onBackToProfiles && (
          <button
            type="button"
            onClick={onBackToProfiles}
            className="hidden sm:flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors shrink-0"
          >
            <ChevronLeft className="size-3.5" />
            Profiles
          </button>
        )}
        {onBackToProfiles && (
          <span className="hidden sm:block text-slate-300 text-xs">/</span>
        )}
        <div className="min-w-0">
          {profileName && (
            <p className="text-xs text-slate-500 truncate leading-none mb-0.5">
              {profileName}
            </p>
          )}
          <h1 className="text-sm font-semibold text-slate-900 truncate leading-none">
            {activeLabel ?? "Chatbot Settings"}
          </h1>
        </div>
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

        <Link
          to="/conversations"
          className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <MessageSquare className="size-3.5" />
          <span className="hidden sm:inline">Conversations</span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center justify-center size-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Logout"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  );
}
