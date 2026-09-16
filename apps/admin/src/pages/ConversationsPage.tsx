import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  MessageSquare,
  Search,
  Download,
  FileText,
  RefreshCw,
  ChevronLeft,
  User,
  Clock,
  LogOut,
  Send,
  AlertCircle,
  Check,
  Copy,
  Headset,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { formatMessage } from "@/lib/format-message";
import { copyFormattedMessage } from "@/lib/copy-message";
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

/** Print a clean, chat-style transcript of one conversation → “Save as PDF”. */
function exportSessionAsPDF(session: ConversationSession) {
  const win = window.open("", "_blank", "width=860,height=1000");
  if (!win) {
    alert("Please allow pop-ups to export the PDF.");
    return;
  }

  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const roleName = (role: string, senderName?: string | null) => {
    if (role === "user") return "Visitor";
    if (role === "assistant") return "AI assistant";
    return senderName || "You";
  };

  const visitorName = session.userName || "Unknown user";
  const visitorEmail = session.userEmail || "—";
  const exportedAt = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const messagesHtml = session.messages
    .map((m) => {
      const side =
        m.role === "user"
          ? "visitor"
          : m.role === "admin"
            ? "admin"
            : "ai";
      return `
        <div class="msg ${side}">
          <div class="bubble">
            <div class="who">${esc(roleName(m.role, m.senderName))} · ${esc(formatDate(m.timestamp))}</div>
            <div class="content">${formatMessage(m.content)}</div>
          </div>
        </div>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Conversation — ${esc(visitorName)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; }
  .sheet { max-width: 760px; margin: 0 auto; padding: 40px 44px; }
  h1 { font-size: 20px; margin: 0 0 2px; }
  .sub { font-size: 13px; color: #334155; margin: 0 0 6px; }
  .meta { font-size: 11px; color: #64748b; display: flex; flex-wrap: wrap; gap: 4px 14px; margin-top: 10px; }
  hr { border: 0; border-top: 1px solid #e2e8f0; margin: 18px 0 22px; }
  .msg { display: flex; margin: 0 0 16px; }
  .msg .bubble { max-width: 82%; border: 1px solid #e2e8f0; border-radius: 14px; padding: 10px 14px; }
  .msg.visitor { justify-content: flex-start; }
  .msg.visitor .bubble { background: #eff6ff; border-color: #bfdbfe; }
  .msg.ai { justify-content: flex-end; }
  .msg.ai .bubble { background: #f8fafc; border-color: #cbd5e1; }
  .msg.admin { justify-content: flex-end; }
  .msg.admin .bubble { background: #ecfdf5; border-color: #6ee7b7; }
  .who { font-size: 10px; font-weight: 600; color: #64748b; margin-bottom: 5px; }
  .msg.visitor .who { color: #1d4ed8; }
  .msg.admin .who { color: #047857; }
  .content { font-size: 13px; line-height: 1.55; }
  .content p { margin: 0 0 8px; }
  .content p:last-child { margin-bottom: 0; }
  .content ul, .content ol { margin: 6px 0 10px; padding-left: 20px; }
  .content ul:last-child, .content ol:last-child { margin-bottom: 0; }
  .content li { margin-bottom: 4px; }
  .content a { color: #2563eb; word-break: break-all; }
  .content pre { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 10px; overflow-x: auto; }
  .content code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
  .footer { margin-top: 28px; font-size: 10px; color: #94a3b8; text-align: center; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <h1>Conversation transcript</h1>
    <p class="sub">${esc(visitorName)}${visitorEmail !== "—" ? ` · ${esc(visitorEmail)}` : ""}</p>
    <div class="meta">
      <span>Profile: ${esc(session.profile || "default")}</span>
      <span>First seen: ${esc(formatDate(session.firstSeen))}</span>
      <span>Messages: ${session.messages.length}</span>
      <span>Exported: ${esc(exportedAt)}</span>
    </div>
    <hr />
    ${messagesHtml}
    <p class="footer">Exported from the chatbot dashboard.</p>
  </div>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  win.onafterprint = () => win.close();
  win.print();
}

export function ConversationsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnToRef = useRef(location.pathname + location.search);
  returnToRef.current = location.pathname + location.search;
  const { logout } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileMeta | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedProfile = searchParams.get("profile");
  const requestedConversation = searchParams.get("conversation");
  const activeProfile = profile?.slug === requestedProfile && profile.status === "active"
    ? profile.slug : "";
  const currentProfileRef = useRef(activeProfile);
  currentProfileRef.current = activeProfile;
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const selected = activeProfile ? sessions.find(session => session.id === requestedConversation && session.profile === activeProfile) ?? null : null;
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState("");
  // Index of the message whose copy button is showing its "copied" check.
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch only the originating profile's lightweight metadata.
  useEffect(() => {
    const controller = new AbortController();
    setProfile(null);
    if (!requestedProfile) {
      setError("Open Conversations from a chatbot profile to view its inbox.");
      return;
    }
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const res = await fetch(`/api/profiles?slug=${encodeURIComponent(requestedProfile)}&metadata=1`, {
          headers: getAuthHeaders(), signal: controller.signal,
        });
        if (res.status === 401) {
          logout();
          navigate("/login", { replace: true, state: { returnTo: returnToRef.current } });
          return;
        }
        if (!res.ok) throw new Error("This chatbot profile is unavailable.");
        const data = (await res.json()) as ProfileMeta;
        if (data.status !== "active") throw new Error("This chatbot profile is inactive.");
        if (!controller.signal.aborted) setProfile(data);
      } catch {
        if (!controller.signal.aborted) {
          setError("Unable to load this chatbot profile. Return to Config and select an active profile.");
          setLoading(false);
        }
      }
    })();
    return () => controller.abort();
  }, [logout, navigate, requestedProfile]);

  const load = useCallback(
    async (showRefresh = false) => {
      if (!activeProfile) return;
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const data = await fetchConversations(activeProfile);
        if (currentProfileRef.current !== activeProfile) return;
        setSessions(data);
      } catch (err) {
        if (currentProfileRef.current !== activeProfile) return;
        if (err instanceof UnauthorizedError) {
          logout();
          navigate("/login", { replace: true, state: { returnTo: returnToRef.current } });
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (currentProfileRef.current === activeProfile) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [activeProfile, logout, navigate],
  );

  useEffect(() => {
    setSessions([]);
    setReplyText("");
    setReplyError("");
    setSearch("");
    if (!activeProfile) return;
    void load();
  }, [load, activeProfile, requestedProfile]);

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
    navigate("/login", { replace: true, state: { returnTo: returnToRef.current } });
  }

  function handleSelect(session: ConversationSession) {
    setSearchParams({ profile: activeProfile, conversation: session.id });
    setReplyText("");
    setReplyError("");
  }

  useEffect(() => {
    const session = selected;
    if (!session || !activeProfile) return;
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
          navigate("/login", { replace: true, state: { returnTo: returnToRef.current } });
        }
      });
    }
  }, [selected, activeProfile, logout, navigate]);

  useEffect(() => { setReplyText(""); setReplyError(""); setCopiedIndex(null); }, [requestedConversation]);

  /** Copy a message as rich text + plain text, matching the internal chat's export format. */
  async function handleCopy(content: string, index: number) {
    try {
      await copyFormattedMessage(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast({
        title: "Failed to copy message",
        description: "Your browser blocked clipboard access — select the text and copy manually.",
        tone: "error",
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
      setReplyText("");
      toast({ title: "Reply sent", description: "The visitor will see it next time the widget checks in.", tone: "success" });
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        logout();
        navigate("/login", { replace: true, state: { returnTo: returnToRef.current } });
        return;
      }
      setReplyError(err instanceof Error ? err.message : "Failed to send reply");
      toast({
        title: "Failed to send reply",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* ── Left Sidebar ── */}
      <aside className={cn("w-full md:w-72 flex-col border-r border-border shrink-0", selected ? "hidden md:flex" : "flex")}>
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <img
            src="/logo.webp"
            alt="Logo"
            className="h-8 w-auto shrink-0 object-contain"
          />
          <span className="text-sm font-medium text-foreground truncate">
            Conversations
          </span>
        </div>

        {/* Nav */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground text-xs"
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
            className="flex items-center justify-center size-7 rounded-control text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Refresh"
          >
            <RefreshCw
              className={cn("size-3.5", refreshing && "animate-spin")}
            />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center size-7 rounded-control text-muted-foreground hover:text-muted-foreground hover:bg-secondary transition-colors"
            title="Logout"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>

        {/* Current profile */}
        {activeProfile && (
          <div className="mx-3 my-3 min-w-0 border border-border bg-secondary px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Chatbot profile</p>
            <p className="mt-1 break-words text-sm font-medium text-foreground">{profile?.name}</p>
          </div>
        )}

        {/* Search */}
        <div className="px-3 pb-2 pt-1">
          <div className="flex items-center gap-2 rounded-control bg-secondary px-3 py-2">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <div className="size-5 animate-spin rounded-full border-2 border-border border-t-border" />
            </div>
          )}
          {!loading && error && (
            <p className="px-3 py-4 text-xs text-muted-foreground">{error}</p>
          )}
          {!loading && !error && activeProfile && requestedConversation && !selected && (
            <p role="status" className="px-3 py-4 text-sm text-muted-foreground">This conversation was not found in this profile. It may have been deleted. Choose another conversation below.</p>
          )}
          {!loading && !error && filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
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
                    ? "bg-secondary border border-border"
                    : "hover:bg-secondary border border-transparent",
                  attention && "border-l-2 border-l-border",
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative flex shrink-0 items-center justify-center size-7 rounded-full bg-secondary text-foreground">
                    <User className="size-3.5" />
                    {unread && (
                      <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-secondary ring-2 ring-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-xs",
                        unread
                          ? "font-medium text-foreground"
                          : "font-medium text-foreground",
                      )}
                    >
                      {session.userName || "Unknown"}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {session.userEmail || "—"}
                    </p>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-2 pl-9">
                  <Clock className="size-2.5 shrink-0 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground truncate">
                    {formatDate(session.lastActive)}
                  </span>
                  {attention && (
                    <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
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
      <main className={cn("flex-1 flex-col min-w-0", selected ? "flex" : "hidden md:flex")}>
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
            <MessageSquare className="size-10" />
            <p role={requestedConversation ? "status" : undefined} className="text-sm text-center px-4">{loading ? "Loading conversation…" : requestedConversation ? "This conversation was not found in this profile. It may have been deleted." : "Select a user to view their conversation"}</p>
            {sessions.length === 0 && !loading && !error && (
              <p className="text-xs text-foreground max-w-xs text-center">
                Conversations will appear here after visitors chat with the widget.
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 md:px-6 py-4 shrink-0">
              <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSearchParams({ profile: activeProfile })} aria-label="Back to conversations"><ChevronLeft className="size-4" /></Button>
              <div className="flex-1 min-w-40">
                <h2 className="font-display text-sm font-medium text-foreground">
                  {selected.userName || "Unknown user"}
                </h2>
                <p className="text-xs text-muted-foreground break-all">{selected.userEmail}</p>
              </div>
              <div className="hidden lg:flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
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
                className="h-8 gap-1.5 px-3 text-xs border-border bg-card text-foreground hover:bg-secondary hover:text-foreground"
                onClick={() => exportSessionAsPDF(selected)}
                title="Print / save this conversation as a PDF"
              >
                <FileText className="size-3.5" />
                Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 px-3 text-xs border-border bg-card text-foreground hover:bg-secondary hover:text-foreground"
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
                    "group flex items-start gap-2",
                    msg.role === "user" ? "justify-start" : "justify-end",
                  )}
                >
                  {msg.role === "user" && (
                    <span
                      className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-border bg-secondary text-muted-foreground"
                      title={selected.userName || "Client"}
                      role="img"
                      aria-label={selected.userName || "Client"}
                    >
                      <User className="size-4" aria-hidden="true" />
                    </span>
                  )}
                  <div
                    className={cn(
                      "min-w-0 max-w-[85%] sm:max-w-[70%] rounded-xl px-4 py-2.5 text-sm",
                      msg.role === "user" &&
                        "bg-secondary text-foreground ",
                      msg.role === "assistant" &&
                        "bg-card text-foreground",
                      msg.role === "admin" &&
                        "bg-secondary border border-border text-muted-foreground ",
                    )}
                  >
                    {msg.role === "admin" && (
                      <p className="mb-1 flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                        <Headset className="size-3" />
                        {msg.senderName || "You"}
                      </p>
                    )}
                    <div className="chat-rich-text min-w-0 break-words" dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <time className="text-[10px] text-muted-foreground">
                        {formatDate(msg.timestamp)}
                      </time>
                      <button
                        type="button"
                        onClick={() => void handleCopy(msg.content, i)}
                        title="Copy message"
                        aria-label={
                          msg.role === "user"
                            ? "Copy visitor message"
                            : msg.role === "admin"
                              ? "Copy your reply"
                              : "Copy assistant response"
                        }
                        className={cn(
                          "flex size-6 items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100",
                          copiedIndex === i
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {copiedIndex === i ? (
                          <Check className="size-3" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Admin reply composer — inject a human ("middleman") response */}
            <div className="border-t border-border px-6 py-3 shrink-0">
              {replyError && (
                <p className="mb-2 text-xs text-muted-foreground">{replyError}</p>
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
                  className="flex-1 resize-none rounded-control bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-foreground"
                />
                <Button
                  size="sm"
                  className="h-10 gap-1.5 px-5 text-sm"
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
