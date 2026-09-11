import {
  CheckCircle2,
  ChevronLeft,
  ExternalLink,
  LogOut,
  MessageSquare,
  Megaphone,
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
  profileSlug?: string;
  onBackToProfiles?: () => void;
};

export function TopBar({
  saving,
  dirty,
  saveStatus,
  onSave,
  onPreview,
  activeLabel,
  profileName,
  profileSlug,
  onBackToProfiles,
}: TopBarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }
  return (
    <div className="flex min-h-20 flex-wrap items-center gap-4 px-4 py-4 sm:px-8">
      {/* Back to profiles + page title */}
      <div className="flex flex-1 items-center gap-2 min-w-0">
        {onBackToProfiles && (
          <button
            type="button"
            onClick={onBackToProfiles}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ChevronLeft className="size-3.5" />
            Profiles
          </button>
        )}
        {onBackToProfiles && (
          <span className="block text-foreground text-xs">/</span>
        )}
        <div className="min-w-0">
          {profileName && (
            <p className="text-xs text-muted-foreground truncate leading-none mb-0.5">
              {profileName}
            </p>
          )}
          <h1 className="font-display text-sm font-medium text-foreground truncate leading-none">
            {activeLabel ?? "Chatbot Settings"}
          </h1>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {saveStatus ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <CheckCircle2 className="size-3.5" />
            Saved
          </span>
        ) : dirty ? (
          <span className="hidden sm:block text-xs font-medium text-muted-foreground">
            Unsaved changes
          </span>
        ) : null}

        <Button
          variant="outline"
          size="sm"
          onClick={onPreview}
          aria-label="Preview"
          className="h-8 gap-1.5 px-3 text-xs"
        >
          <ExternalLink className="size-3.5" />
          <span className="hidden sm:inline">Preview</span>
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
          aria-label="Conversations"
          to={profileSlug ? `/conversations?profile=${encodeURIComponent(profileSlug)}` : "/conversations"}
          className="flex items-center gap-1.5 h-8 px-3 rounded-control border border-border text-xs font-medium text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
        >
          <MessageSquare className="size-3.5" />
          <span className="hidden sm:inline">Conversations</span>
        </Link>

        <Link
          to="/announcements"
          aria-label="What’s new"
          title="What’s new"
          className="flex size-8 rounded-control items-center justify-center border border-border text-muted-foreground outline-none transition-colors hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground"
        >
          <Megaphone className="size-3.5" aria-hidden="true" />
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center justify-center size-8 rounded-control text-muted-foreground hover:text-muted-foreground hover:bg-secondary transition-colors"
          title="Logout"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  );
}
