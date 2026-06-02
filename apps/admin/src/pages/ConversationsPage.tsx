import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Search,
  Download,
  RefreshCw,
  ChevronLeft,
  User,
  Clock,
  LogOut,
  Send,
  AlertCircle,
  Headset,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthHeaders } from "@/lib/auth";
import {
  fetchConversations,
  sendAdminReply,
  markConversationRead,
  UnauthorizedError,
  type ConversationSession,
} from "@/api/conversations";

/** A conversation needs a reply when the visitor sent the last message. */
function needsReply(session: ConversationSession): boolean {
  const last = session.messages[session.messages.length - 1];
  return last?.role === "user";
}

/** Unread = visitor activity since the admin last opened the conversation. */
function isUnread(session: ConversationSession): boolean {
  if (!session.adminReadAt) return session.messages.length > 0;
  return new Date(session.lastActive) > new Date(session.adminReadAt);
}

/** Render message text with clickable links (so pasted URLs are tappable). */
function renderWithLinks(text: string) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="underline break-all"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

interface ProfileMeta {
  slug: string;
  name: string;
  status: string;
  createdAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function exportSessionAsCSV(session: ConversationSession) {
  const rows = [
    ["Timestamp", "Role", "Message"],
    ...session.messages.map((m) => [
      m.timestamp,
      m.role,
      `"${m.content.replace(/"/g, '""')}"`,
    ]),
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${session.userEmail || session.sessionId}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ConversationsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profiles, setProfiles] = useState<ProfileMeta[]>([]);
  const [activeProfile, setActiveProfile] = useState("");
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [selected, setSelected] = useState<ConversationSession | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState("");
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load active profiles once on mount
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/profiles", { headers: getAuthHeaders() });
        if (res.status === 401) {
          logout();
          navigate("/login", { replace: true });
          return;
        }
        if (res.ok) {
          const data = (await res.json()) as { profiles: ProfileMeta[] };
          const active = data.profiles.filter((p) => p.status === "active");
          setProfiles(active);
          if (active.length > 0) setActiveProfile(active[0].slug);
        }
      } catch {
        // silently fail — conversations will just be empty
      }
    })();
  }, [logout, navigate]);

  const load = useCallback(
    async (showRefresh = false) => {
      if (!activeProfile) return;
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const data = await fetchConversations(activeProfile);
        setSessions(data);
        // Keep the open conversation open across auto-refreshes, picking up any
        // new messages, instead of closing it every cycle.
        setSelected((prev) =>
          prev ? (data.find((s) => s.sessionId === prev.sessionId) ?? null) : null,
        );
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          logout();
          navigate("/login", { replace: true });
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeProfile, logout, navigate],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    autoRefreshRef.current = setInterval(() => void load(true), 60_000);
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, [load]);

  const filtered = sessions.filter(
    (s) =>
      s.userName.toLowerCase().includes(search.toLowerCase()) ||
      s.userEmail.toLowerCase().includes(search.toLowerCase()),
  );

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function handleSelect(session: ConversationSession) {
    setSelected(session);
    setReplyText("");
    setReplyError("");
    // Mark as read locally + on the server so the unread badge clears.
    if (isUnread(session)) {
      const readAt = new Date().toISOString();
      setSessions((prev) =>
        prev.map((s) =>
          s.sessionId === session.sessionId ? { ...s, adminReadAt: readAt } : s,
        ),
      );
      void markConversationRead(activeProfile, session.sessionId).catch((err) => {
        if (err instanceof UnauthorizedError) {
          logout();
          navigate("/login", { replace: true });
        }
      });
    }
  }

  async function handleSendReply() {
    if (!selected) return;
    const content = replyText.trim();
    if (!content || sending) return;
    setSending(true);
    setReplyError("");
    try {
      const message = await sendAdminReply(activeProfile, selected.sessionId, content);
      const nowIso = message.timestamp;
      // Append optimistically to the open conversation and the list.
      setSessions((prev) =>
        prev.map((s) =>
          s.sessionId === selected.sessionId
            ? {
                ...s,
                messages: [...s.messages, message],
                lastActive: nowIso,
                adminReadAt: nowIso,
              }
            : s,
        ),
      );
      setSelected((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, message],
              lastActive: nowIso,
              adminReadAt: nowIso,
            }
          : prev,
      );
      setReplyText("");
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        logout();
        navigate("/login", { replace: true });
        return;
      }
      setReplyError(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* ── Left Sidebar ── */}
      <aside className="flex w-72 flex-col border-r border-slate-800 shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
          <img
            src="/logo.webp"
            alt="Logo"
            className="h-8 w-auto shrink-0 object-contain"
          />
          <span className="text-sm font-semibold text-white truncate">
            Conversations
          </span>
        </div>

        {/* Nav */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2 text-slate-400 hover:text-white text-xs"
            onClick={() => navigate("/")}
          >
            <ChevronLeft className="size-3.5" />
            Config
          </Button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing}
            className="flex items-center justify-center size-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw
              className={cn("size-3.5", refreshing && "animate-spin")}
            />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center size-7 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
            title="Logout"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>

        {/* Profile tabs */}
        {profiles.length > 0 && (
          <div className="flex gap-1 px-3 pt-3 pb-1 flex-wrap">
            {profiles.map((p) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => {
                  setActiveProfile(p.slug);
                  setSelected(null);
                }}
                className={cn(
                  "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                  activeProfile === p.slug
                    ? "bg-blue-500/20 text-blue-400"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="px-3 pb-2 pt-1">
          <div className="flex items-center gap-2 rounded-lg bg-slate-800/60 px-3 py-2">
            <Search className="size-3.5 shrink-0 text-slate-500" />
            <input
              type="text"
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-600 outline-none"
            />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <div className="size-5 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />
            </div>
          )}
          {!loading && error && (
            <p className="px-3 py-4 text-xs text-red-400">{error}</p>
          )}
          {!loading && !error && filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-slate-600">
              {sessions.length === 0
                ? "No conversations yet"
                : "No users match your search"}
            </p>
          )}
          {filtered.map((session) => {
            const unread = isUnread(session);
            const attention = needsReply(session);
            return (
              <button
                key={session.sessionId}
                type="button"
                onClick={() => handleSelect(session)}
                className={cn(
                  "relative w-full rounded-xl px-3 py-2.5 text-left transition-colors",
                  selected?.sessionId === session.sessionId
                    ? "bg-blue-500/15 border border-blue-500/20"
                    : "hover:bg-slate-800/70 border border-transparent",
                  attention && "border-l-2 border-l-amber-400",
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative flex shrink-0 items-center justify-center size-7 rounded-full bg-slate-700 text-slate-300">
                    <User className="size-3.5" />
                    {unread && (
                      <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-blue-500 ring-2 ring-slate-950" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-xs",
                        unread
                          ? "font-semibold text-white"
                          : "font-medium text-white",
                      )}
                    >
                      {session.userName || "Unknown"}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {session.userEmail || "—"}
                    </p>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-2 pl-9">
                  <Clock className="size-2.5 shrink-0 text-slate-600" />
                  <span className="text-[10px] text-slate-600 truncate">
                    {formatDate(session.lastActive)}
                  </span>
                  {attention && (
                    <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-medium text-amber-400">
                      <AlertCircle className="size-2.5" />
                      Needs reply
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Right Panel ── */}
      <main className="flex flex-1 flex-col min-w-0">
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-600">
            <MessageSquare className="size-10" />
            <p className="text-sm">Select a user to view their conversation</p>
            {sessions.length === 0 && !loading && !error && (
              <p className="text-xs text-slate-700 max-w-xs text-center">
                Conversations will appear here after visitors chat with the widget.
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-800 px-6 py-4 shrink-0">
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-white">
                  {selected.userName || "Unknown user"}
                </h2>
                <p className="text-xs text-slate-400">{selected.userEmail}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 text-xs text-slate-500">
                <span>First seen: {formatDate(selected.firstSeen)}</span>
                <span>·</span>
                <span>
                  {selected.messages.filter((m) => m.role === "user").length}{" "}
                  messages
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 px-3 text-xs border-slate-700 text-slate-300 hover:text-white"
                onClick={() => exportSessionAsCSV(selected)}
              >
                <Download className="size-3.5" />
                Export CSV
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {selected.messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
                      msg.role === "user" &&
                        "bg-blue-600 text-white rounded-br-md",
                      msg.role === "assistant" &&
                        "bg-slate-800 text-slate-100 rounded-bl-md",
                      msg.role === "admin" &&
                        "bg-emerald-600/20 border border-emerald-500/30 text-emerald-50 rounded-bl-md",
                    )}
                  >
                    {msg.role === "admin" && (
                      <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-300">
                        <Headset className="size-3" />
                        {msg.senderName || "You"}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words">
                      {renderWithLinks(msg.content)}
                    </p>
                    <time
                      className={cn(
                        "mt-1 block text-[10px]",
                        msg.role === "user"
                          ? "text-blue-200"
                          : "text-slate-500",
                      )}
                    >
                      {formatDate(msg.timestamp)}
                    </time>
                  </div>
                </div>
              ))}
            </div>

            {/* Admin reply composer — inject a human ("middleman") response */}
            <div className="border-t border-slate-800 px-6 py-3 shrink-0">
              {replyError && (
                <p className="mb-2 text-xs text-red-400">{replyError}</p>
              )}
              <div className="flex items-end gap-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      void handleSendReply();
                    }
                  }}
                  rows={2}
                  placeholder="Reply as sales… paste a link (https://…) to share. ⌘/Ctrl+Enter to send"
                  className="flex-1 resize-none rounded-lg bg-slate-800/60 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-emerald-500/40"
                />
                <Button
                  size="sm"
                  className="h-9 gap-1.5 bg-emerald-600 px-3 text-xs text-white hover:bg-emerald-500"
                  disabled={sending || !replyText.trim()}
                  onClick={() => void handleSendReply()}
                >
                  <Send className="size-3.5" />
                  {sending ? "Sending…" : "Send"}
                </Button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
