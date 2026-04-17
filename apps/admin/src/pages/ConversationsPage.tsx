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
  Sheet,
  CheckCircle2,
  XCircle,
  Loader2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchConversations,
  checkSheetsStatus,
  testSheetWrite,
  UnauthorizedError,
  type ConversationSession,
  type SheetsStatus,
} from "@/api/conversations";

const PROFILES = [
  { slug: "duran-schulze", label: "Duran Schulze" },
  { slug: "filepino", label: "FilePino" },
];

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
  const [activeProfile, setActiveProfile] = useState(PROFILES[0].slug);
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [selected, setSelected] = useState<ConversationSession | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [sheetsStatus, setSheetsStatus] = useState<SheetsStatus | null>(null);
  const [statusChecking, setStatusChecking] = useState(false);
  const [testWriting, setTestWriting] = useState(false);
  const [testWriteResult, setTestWriteResult] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkStatus = useCallback(async () => {
    setStatusChecking(true);
    try {
      const status = await checkSheetsStatus();
      setSheetsStatus(status);
    } catch {
      setSheetsStatus({ connected: false, error: "Failed to reach server" });
    } finally {
      setStatusChecking(false);
    }
  }, []);

  const handleTestWrite = useCallback(async () => {
    setTestWriting(true);
    setTestWriteResult(null);
    try {
      const result = await testSheetWrite();
      setTestWriteResult(
        result.success
          ? { ok: true, msg: result.message ?? "Row written successfully" }
          : { ok: false, msg: result.error ?? "Write failed" },
      );
    } catch {
      setTestWriteResult({ ok: false, msg: "Request failed" });
    } finally {
      setTestWriting(false);
      setTimeout(() => setTestWriteResult(null), 6000);
    }
  }, []);

  const load = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const data = await fetchConversations(activeProfile);
        setSessions(data);
        setSelected(null);
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
    void checkStatus();
  }, [load, checkStatus]);

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
        <div className="flex gap-1 px-3 pt-3 pb-1">
          {PROFILES.map((p) => (
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
              {p.label}
            </button>
          ))}
        </div>

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
          {filtered.map((session) => (
            <button
              key={session.sessionId}
              type="button"
              onClick={() => setSelected(session)}
              className={cn(
                "w-full rounded-xl px-3 py-2.5 text-left transition-colors",
                selected?.sessionId === session.sessionId
                  ? "bg-blue-500/15 border border-blue-500/20"
                  : "hover:bg-slate-800/70 border border-transparent",
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex shrink-0 items-center justify-center size-7 rounded-full bg-slate-700 text-slate-300">
                  <User className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-white">
                    {session.userName || "Unknown"}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {session.userEmail || "—"}
                  </p>
                </div>
              </div>
              <div className="mt-1.5 flex items-center gap-1 pl-9">
                <Clock className="size-2.5 shrink-0 text-slate-600" />
                <span className="text-[10px] text-slate-600 truncate">
                  {formatDate(session.lastActive)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Right Panel ── */}
      <main className="flex flex-1 flex-col min-w-0">
        {/* ── Google Sheets Status Banner ── */}
        <div
          className={cn(
            "flex items-center gap-2.5 px-4 py-2.5 text-xs border-b shrink-0",
            sheetsStatus === null
              ? "border-slate-800 bg-slate-900 text-slate-500"
              : sheetsStatus.connected
                ? "border-green-900/50 bg-green-950/30 text-green-400"
                : "border-red-900/50 bg-red-950/30 text-red-400",
          )}
        >
          {sheetsStatus === null || statusChecking ? (
            <Loader2 className="size-3.5 shrink-0 animate-spin" />
          ) : sheetsStatus.connected ? (
            <CheckCircle2 className="size-3.5 shrink-0" />
          ) : (
            <XCircle className="size-3.5 shrink-0" />
          )}

          <Sheet className="size-3.5 shrink-0 opacity-70" />

          <span className="flex-1 truncate">
            {sheetsStatus === null
              ? "Checking Google Sheets connection…"
              : sheetsStatus.connected
                ? `Connected · ${sheetsStatus.sheetTitle ?? "Google Sheet"} · ${sheetsStatus.email ?? ""}`
                : `Not connected · ${sheetsStatus.error ?? "Unknown error"}`}
          </span>

          {sheetsStatus?.connected &&
            sheetsStatus.tabs &&
            sheetsStatus.tabs.length > 0 && (
              <span className="hidden lg:flex items-center gap-1 shrink-0 text-green-600">
                {sheetsStatus.tabs.map((t) => (
                  <span
                    key={t}
                    className="rounded px-1.5 py-0.5 bg-green-900/40 text-green-400 font-mono text-[10px]"
                  >
                    {t}
                  </span>
                ))}
              </span>
            )}

          <button
            type="button"
            onClick={() => void checkStatus()}
            disabled={statusChecking}
            className="shrink-0 text-[11px] underline underline-offset-2 opacity-60 hover:opacity-100"
          >
            Re-check
          </button>

          <Button
            size="sm"
            variant="outline"
            disabled={testWriting || !sheetsStatus?.connected}
            onClick={() => void handleTestWrite()}
            className="h-6 gap-1.5 px-2 text-[11px] shrink-0 border-current/30 hover:bg-current/10"
          >
            {testWriting ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Pencil className="size-3" />
            )}
            Test Write
          </Button>

          {testWriteResult && (
            <span
              className={cn(
                "shrink-0 text-[11px] font-medium",
                testWriteResult.ok ? "text-green-400" : "text-red-400",
              )}
            >
              {testWriteResult.ok ? "✓" : "✗"} {testWriteResult.msg}
            </span>
          )}
        </div>

        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-600">
            <MessageSquare className="size-10" />
            <p className="text-sm">Select a user to view their conversation</p>
            {sessions.length === 0 && !loading && !error && (
              <p className="text-xs text-slate-700 max-w-xs text-center">
                Conversations will appear here after visitors chat with the
                widget. Make sure the sheet tabs are created and shared.
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
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-slate-800 text-slate-100 rounded-bl-md",
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {msg.content}
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
          </>
        )}
      </main>
    </div>
  );
}
