import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Bot,
  Check,
  ChevronDown,
  ChevronLeft,
  Copy,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  RotateCcw,
  Send,
  Settings,
  Shield,
  Trash2,
  X,
} from "lucide-react"
import type { DatasetEntry } from "@duran-chatbot/config"
import { defaultConfig } from "@duran-chatbot/config"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { callGemini } from "@/api/gemini"
import { fetchModels, type GeminiModelOption } from "@/api/models"
import { formatMessage } from "@/lib/format-message"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant" | "error"
  content: string
  timestamp: Date
}

interface InternalDatasetEntry {
  id: string
  title: string
  content: string
}

interface InternalSettings {
  systemPrompt: string
  model: string
  temperature: number
  maxTokens: number
  dataset: InternalDatasetEntry[]
  responseFooter: string
}

// ─── Fallback models ──────────────────────────────────────────────────────
// Used when the server cannot be reached or returns no models

const FALLBACK_MODELS: GeminiModelOption[] = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
]

// ─── Defaults & persistence ───────────────────────────────────────────────────

const DEFAULT_SETTINGS: InternalSettings = {
  systemPrompt:
    "You are a helpful internal AI assistant for Duran & Duran-Schulze Law. You assist the firm's staff with legal research, case strategies, and internal processes. Unlike the public chatbot, you may provide detailed and specific guidance and discuss case-specific information. Be thorough, precise, and cite relevant Philippine laws and jurisprudence where applicable.",
  model: "gemini-2.5-flash",
  temperature: 0.7,
  maxTokens: 4096,
  dataset: [],
  responseFooter:
    `---\n\n*This response is for **internal use only** and does not constitute legal advice. For formal guidance, consult with the appropriate attorney at Duran & Duran-Schulze Law.*\n\n[ ⚖️ Duran & Duran-Schulze Law](https://duranschulze.com/contact)\n\nIf a user asks about our office location, address, or how to find us, you must respond by stating that our office details are the following:\n- Address: 1210 High Street South Corporate Plaza Tower 2, 26th Street, Bonifacio Global City, Taguig, Metro Manila, Philippines\n- Email: info@duranschulze.com\n- Phone Numbers: (+632) 8478 5826, (+63) 917 194 0482\n- Contact Form Link: https://duranschulze.com/contact/`,
}

const SETTINGS_STORAGE_KEY = "internal-chat-settings"

function loadSettings(): InternalSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<InternalSettings>
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      dataset: Array.isArray(parsed.dataset) ? parsed.dataset : [],
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function persistSettings(s: InternalSettings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(s))
  } catch {}
}

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

function generateSessionId() {
  return `internal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InternalChatPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  // API key — always fetched from server so it's the same key as the rest of the system
  const [apiKey, setApiKey] = useState("")
  const [apiKeyLoading, setApiKeyLoading] = useState(true)

  // Models — fetched from the same API used by the public config editor
  const [models, setModels] = useState<GeminiModelOption[]>([])
  const [modelsLoading, setModelsLoading] = useState(true)

  // Settings (saved to localStorage)
  const [settings, setSettings] = useState<InternalSettings>(loadSettings)
  // Draft settings edited in the drawer, only applied on "Save"
  const [draft, setDraft] = useState<InternalSettings>(loadSettings)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [modelDialogOpen, setModelDialogOpen] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [sessionId, setSessionId] = useState(generateSessionId)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ── Fetch API key and models on mount ──
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((cfg: { ai?: { apiKey?: string } }) => setApiKey(cfg?.ai?.apiKey ?? ""))
      .catch(() => {})
      .finally(() => setApiKeyLoading(false))
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadModels = async () => {
      try {
        const nextModels = await fetchModels()
        if (!cancelled) {
          setModels(nextModels)
        }
      } catch {
        // Fallback models will be used
      } finally {
        if (!cancelled) setModelsLoading(false)
      }
    }

    loadModels()

    return () => {
      cancelled = true
    }
  }, [])

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, sending])

  // ── Settings drawer ──
  const openDrawer = useCallback(() => {
    setDraft(settings)
    setSavedFlash(false)
    setDrawerOpen(true)
  }, [settings])

  const saveDrawer = useCallback(() => {
    setSettings(draft)
    persistSettings(draft)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }, [draft])

  const resetDraft = useCallback(() => setDraft(DEFAULT_SETTINGS), [])

  // ── Dataset helpers (operate on draft) ──
  const addEntry = useCallback(() => {
    setDraft((prev) => ({
      ...prev,
      dataset: [...prev.dataset, { id: generateId(), title: "", content: "" }],
    }))
  }, [])

  const updateEntry = useCallback(
    (id: string, field: "title" | "content", value: string) => {
      setDraft((prev) => ({
        ...prev,
        dataset: prev.dataset.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
      }))
    },
    [],
  )

  const removeEntry = useCallback((id: string) => {
    setDraft((prev) => ({ ...prev, dataset: prev.dataset.filter((e) => e.id !== id) }))
  }, [])

  // ── Send message ──
  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || sending || !apiKey) return

    setInput("")

    const isEditing = editingIndex !== null

    if (isEditing) {
      // Replace the edited user message and remove subsequent assistant response
      setMessages((prev) => {
        const next = [...prev]
        next[editingIndex] = { role: "user", content: text, timestamp: new Date() }
        // Remove the assistant response that followed (if any)
        if (editingIndex + 1 < next.length && next[editingIndex + 1].role === "assistant") {
          next.splice(editingIndex + 1, 1)
        }
        return next
      })
      setEditingIndex(null)
    } else {
      setMessages((prev) => [...prev, { role: "user", content: text, timestamp: new Date() }])
    }

    setSending(true)

    try {
      const dataset: DatasetEntry[] = settings.dataset
        .filter((e) => e.title.trim() || e.content.trim())
        .map((e) => ({
          id: e.id,
          keywords: [],
          title: e.title,
          content: e.content,
          category: "internal",
        }))

      const response = await callGemini(
        text,
        {
          systemPrompt: settings.systemPrompt,
          model: settings.model,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          apiKey,
        },
        defaultConfig.persona,
        [],
        dataset,
      )

      const footer = settings.responseFooter?.trim()
      const finalContent = footer ? `${response}

${footer}` : response

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: finalContent, timestamp: new Date() },
      ])

      // Log the original response (without footer)
      const logBody = JSON.stringify({
        profile: "internal",
        sessionId,
        userName: "Internal User",
        userEmail: "internal@admin",
        userMessage: text,
        aiResponse: response,
      })

      fetch("/api/chat-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: logBody,
      }).catch(() => {})
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          content: err instanceof Error ? err.message : "Failed to get a response",
          timestamp: new Date(),
        },
      ])
    } finally {
      setSending(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [input, sending, apiKey, settings, sessionId])

  async function handleCopy(content: string, index: number) {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch {}
  }

  function handleEdit(index: number, content: string) {
    setInput(content)
    setEditingIndex(index)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

  function startNewSession() {
    setMessages([])
    setEditingIndex(null)
    setSessionId(generateSessionId())
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

  const isReady = !apiKeyLoading && Boolean(apiKey)

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* Backdrop for drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px]"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Chat panel ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-2.5 border-b border-slate-800 px-4 py-3 shrink-0">
          <div className="flex items-center justify-center size-8 rounded-full bg-blue-500/15 shrink-0">
            <Bot className="size-4 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-white leading-none">
              Internal Legal Chat
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                {(models.length > 0 ? models : FALLBACK_MODELS).find((m) => m.id === settings.model)?.label ?? settings.model}
              </p>
          </div>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={startNewSession}
              title="New session"
              className="flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="size-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={openDrawer}
            title="Settings"
            className={cn(
              "flex items-center justify-center size-8 rounded-lg transition-colors",
              drawerOpen
                ? "bg-blue-500/20 text-blue-400"
                : "text-slate-500 hover:text-slate-200 hover:bg-slate-800",
            )}
          >
            <Settings className="size-3.5" />
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="size-3.5" />
            <span className="hidden sm:inline">Admin</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            className="flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="size-3.5" />
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {/* Empty state */}
          {messages.length === 0 && !sending && (
            <div className="flex flex-col items-center justify-center h-full gap-5 text-center py-16 max-w-md mx-auto">
              <div className="flex items-center justify-center size-16 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <Bot className="size-8 text-blue-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white mb-1.5">
                  Ask our Legal Chatbot
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Your internal AI assistant. Use the{" "}
                  <button
                    type="button"
                    onClick={openDrawer}
                    className="text-blue-400 hover:text-blue-300 underline transition-colors"
                  >
                    settings panel
                  </button>{" "}
                  to customize the system prompt, temperature, and knowledge base.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1.5">
                <Shield className="size-3 text-amber-400 shrink-0" />
                <span className="text-xs text-amber-400">
                  Not for client responses — internal use only
                </span>
              </div>
              {apiKeyLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="size-3.5 animate-spin" />
                  Connecting to AI…
                </div>
              )}
              {!apiKeyLoading && !apiKey && (
                <p className="text-xs text-red-400">
                  API key not configured — set GEMINI_API_KEY on the server.
                </p>
              )}
            </div>
          )}

          {/* Message bubbles */}
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-2.5",
                  msg.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {msg.role !== "user" && (
                  <div
                    className={cn(
                      "flex shrink-0 items-center justify-center size-7 rounded-full mt-0.5",
                      msg.role === "error" ? "bg-red-500/20" : "bg-blue-500/15",
                    )}
                  >
                    <Bot
                      className={cn(
                        "size-3.5",
                        msg.role === "error" ? "text-red-400" : "text-blue-400",
                      )}
                    />
                  </div>
                )}
                <div className="group relative">
                  <div
                    className={cn(
                      "max-w-[72%] rounded-2xl px-4 py-2.5 text-sm",
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-md"
                        : msg.role === "error"
                          ? "bg-red-950/60 border border-red-800/40 text-red-300 rounded-bl-md"
                          : "bg-slate-800 text-slate-100 rounded-bl-md",
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <div
                        className="[&_a]:underline [&_a]:text-blue-400 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-1 [&_p]:mb-1 [&_p:last-child]:mb-0 [&_pre]:my-2 [&_code]:text-sm [&_blockquote]:my-2 [&_hr]:my-4 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
                    <time
                      className={cn(
                        "mt-1.5 block text-[10px]",
                        msg.role === "user" ? "text-blue-200" : "text-slate-500",
                      )}
                    >
                      {formatTime(msg.timestamp)}
                    </time>
                  </div>

                  {/* Hover toolbar */}
                  <div className="absolute -top-2 right-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.content, i)}
                      title="Copy message"
                      className={cn(
                        "flex items-center justify-center size-6 rounded-md text-[10px] transition-colors",
                        copiedIndex === i
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-slate-800 text-slate-500 hover:text-slate-200 hover:bg-slate-700",
                      )}
                    >
                      {copiedIndex === i ? (
                        <Check className="size-3" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                    {msg.role === "user" && (
                      <button
                        type="button"
                        onClick={() => handleEdit(i, msg.content)}
                        title="Edit message"
                        className="flex items-center justify-center size-6 rounded-md bg-slate-800 text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                      >
                        <Pencil className="size-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {sending && (
              <div className="flex gap-2.5 justify-start">
                <div className="flex shrink-0 items-center justify-center size-7 rounded-full bg-blue-500/15 mt-0.5">
                  <Bot className="size-3.5 text-blue-400" />
                </div>
                <div className="rounded-2xl rounded-bl-md bg-slate-800 px-4 py-3">
                  <div className="flex gap-1 items-center h-4">
                    <span className="size-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:0ms]" />
                    <span className="size-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:150ms]" />
                    <span className="size-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-slate-800 px-4 py-4 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void sendMessage()
            }}
            className="max-w-3xl mx-auto"
          >
            {editingIndex !== null && (
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-1 rounded-full bg-amber-400" />
                <span className="text-[11px] text-amber-400">Editing message</span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingIndex(null)
                    setInput("")
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-300 underline transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
            <div className="flex items-end gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  apiKeyLoading
                    ? "Connecting…"
                    : !apiKey
                      ? "API key not configured"
                      : editingIndex !== null
                        ? "Edit your message…"
                        : "Ask anything… (Enter to send, Shift+Enter for new line)"
                }
                disabled={!isReady || sending}
                rows={1}
                className="flex-1 resize-none rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed min-h-[42px] max-h-40 overflow-y-auto leading-relaxed"
                style={{ fieldSizing: "content" } as React.CSSProperties}
              />
              <Button
                type="submit"
                disabled={!isReady || sending || !input.trim()}
                className="h-[42px] w-[42px] rounded-xl p-0 shrink-0"
              >
                {sending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Settings drawer ────────────────────────────────────────────────── */}
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 z-50 flex flex-col w-full sm:w-[420px] bg-slate-900 border-l border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out",
          drawerOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Drawer header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 shrink-0">
          <Settings className="size-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-white flex-1">Chat Settings</h2>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="flex items-center justify-center size-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">
          {/* System prompt */}
          <section className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              System Prompt
            </label>
            <textarea
              value={draft.systemPrompt}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, systemPrompt: e.target.value }))
              }
              rows={9}
              placeholder="Describe how the AI should behave…"
              className="w-full resize-none rounded-lg bg-slate-800 border border-slate-700 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
            />
            <p className="text-[11px] text-slate-600">
              Saved separately from the public chatbot config.
            </p>
          </section>

          {/* Model settings */}
          <section className="space-y-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Model Settings
            </p>

            {/* Model selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300">Model</label>
                {modelsLoading && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Loader2 className="size-3 animate-spin" />
                    Loading…
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setModelDialogOpen(true)}
                disabled={modelsLoading}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                  "border-slate-700 bg-slate-800/50 hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed",
                )}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-white">
                    {(models.length > 0 ? models : FALLBACK_MODELS).find(
                      (m) => m.id === draft.model,
                    )?.label ?? draft.model}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {models.length === 0 && !modelsLoading
                      ? "Using fallback model list"
                      : `${(models.length > 0 ? models : FALLBACK_MODELS).length} models available`}
                  </p>
                </div>
                <ChevronDown className="size-4 text-slate-500 shrink-0" />
              </button>

              <Dialog
                open={modelDialogOpen}
                onClose={() => setModelDialogOpen(false)}
                title="Select Model"
              >
                <div className="space-y-2">
                  {(models.length > 0 ? models : FALLBACK_MODELS).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setDraft((prev) => ({ ...prev, model: m.id }))
                        setModelDialogOpen(false)
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                        draft.model === m.id
                          ? "border-blue-500/50 bg-blue-500/10"
                          : "border-slate-700 bg-slate-800/50 hover:border-slate-600",
                      )}
                    >
                      <div
                        className={cn(
                          "size-3.5 rounded-full border-2 shrink-0",
                          draft.model === m.id
                            ? "border-blue-400 bg-blue-400"
                            : "border-slate-600",
                        )}
                      />
                      <span className="text-sm font-medium text-white">{m.label}</span>
                    </button>
                  ))}
                  {models.length === 0 && !modelsLoading && (
                    <p className="text-[11px] text-slate-600 text-center py-4">
                      Using fallback model list — server could not be reached.
                    </p>
                  )}
                </div>
              </Dialog>
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300">Temperature</label>
                <span className="text-xs font-mono text-slate-400 tabular-nums">
                  {draft.temperature.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={draft.temperature}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    temperature: parseFloat(e.target.value),
                  }))
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>Precise (0)</span>
                <span>Creative (1)</span>
              </div>
            </div>

            {/* Max tokens */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300">Max Output Tokens</label>
                <span className="text-xs font-mono text-slate-400 tabular-nums">
                  {draft.maxTokens.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={256}
                max={65536}
                step={256}
                value={draft.maxTokens}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    maxTokens: parseInt(e.target.value),
                  }))
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>256 — Short</span>
                <span>65,536 — Max</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[1024, 2048, 4096, 8192].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, maxTokens: preset }))}
                    className={cn(
                      "rounded-md py-1 text-[11px] font-mono transition-colors",
                      draft.maxTokens === preset
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300",
                    )}
                  >
                    {preset >= 1000 ? `${preset / 1024}k` : preset}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-600">
                Gemini 2.5 Flash/Pro support up to 65,536 output tokens.
              </p>
            </div>
          </section>

          {/* Response footer */}
          <section className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Response Footer
            </p>
            <textarea
              value={draft.responseFooter}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, responseFooter: e.target.value }))
              }
              rows={3}
              placeholder="e.g. — This response is for internal use only and does not constitute legal advice."
              className="w-full resize-none rounded-lg bg-slate-800 border border-slate-700 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
            />
            <p className="text-[11px] text-slate-600">
              Appended to every AI response. Supports markdown formatting.
            </p>
          </section>

          {/* Dataset */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Knowledge Base
              </p>
              <button
                type="button"
                onClick={addEntry}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Plus className="size-3.5" />
                Add entry
              </button>
            </div>

            {draft.dataset.length === 0 ? (
              <p className="text-xs text-slate-600 py-1 leading-relaxed">
                Add entries to give the AI additional context — case notes,
                internal procedures, reference material, etc.
              </p>
            ) : (
              <div className="space-y-3">
                {draft.dataset.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-slate-700/60 bg-slate-800/40 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                        Entry {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeEntry(entry.id)}
                        className="flex items-center justify-center size-5 rounded text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={entry.title}
                      onChange={(e) => updateEntry(entry.id, "title", e.target.value)}
                      placeholder="Title"
                      className="w-full rounded-md bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <textarea
                      value={entry.content}
                      onChange={(e) =>
                        updateEntry(entry.id, "content", e.target.value)
                      }
                      placeholder="Content…"
                      rows={3}
                      className="w-full resize-none rounded-md bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Drawer footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={resetDraft}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Reset to defaults
          </button>
          <div className="flex-1" />
          {savedFlash && (
            <span className="text-xs text-emerald-400 font-medium">Saved ✓</span>
          )}
          <Button onClick={saveDrawer} size="sm" className="h-8 px-4 text-xs">
            Save settings
          </Button>
        </div>
      </div>
    </div>
  )
}
