import { getAuthHeaders } from "@/lib/auth"
import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Bot,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
import type { AppearanceConfig, DatasetEntry } from "@duran-chatbot/config"
import { defaultConfig, interpolateTemplateVariables } from "@duran-chatbot/config"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { PromptTextarea } from "@/components/ui/prompt-textarea"
import { useToast } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { callGemini } from "@/api/gemini"
import { fetchModels, type GeminiModelOption } from "@/api/models"
import { formatMessage } from "@/lib/format-message"
import { copyFormattedMessage } from "@/lib/copy-message"
import { ThinkingSummary } from "@/components/thinking-summary"
import { ChatReferences, type ReferenceGroup } from "@/components/chat-references"
import type { GroundedSource } from "@/api/grounding"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  thinkingSummary?: string
  incomplete?: boolean
  displayContent?: string
  sources?: GroundedSource[]
  role: "user" | "assistant" | "error"
  content: string
  timestamp: Date
  sourceCount?: number
  searchSuggestions?: string
  searched?: boolean
}

interface InternalDatasetEntry {
  id: string
  title: string
  content: string
}

type ResponseLength = "short" | "normal" | "long"

const RESPONSE_LENGTHS: { value: ResponseLength; label: string; description: string }[] = [
  { value: "short", label: "Short", description: "Direct answer and key points" },
  { value: "normal", label: "Normal", description: "Balanced explanation and next steps" },
  { value: "long", label: "Long", description: "Detailed explanation and relevant examples" },
]

const RESPONSE_LENGTH_INSTRUCTIONS: Record<ResponseLength, string> = {
  short: "Keep this reply brief: give the direct answer in a short paragraph or a few bullets. Omit background, repetition, and optional sections. Include only essential reasoning and next steps.",
  normal: "Give a balanced reply: lead with the answer, then explain the key reasoning and practical next steps. Match detail to the question without unnecessary background.",
  long: "Give a thorough, well-structured reply: lead with a short summary, then explain relevant reasoning, context, alternatives, and practical next steps. Include examples when useful, without padding or repetition.",
}

interface InternalSettings {
  responseLength: ResponseLength
  webSearch: boolean
  fastResponses: boolean
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
  { id: "gemini-flash-latest", label: "Gemini Flash (latest)" },
]

// ─── Defaults & persistence ───────────────────────────────────────────────────

const LAWYER_SYSTEM_PROMPT = `You are the internal legal AI assistant of Duran & Duran-Schulze Law, used by the firm's staff. You assist with legal research, case strategy, drafting, and internal processes. Unlike the public chatbot, you may provide detailed, specific guidance and discuss case-sensitive information.

ANSWER LIKE AN EXPERIENCED LAWYER ADVISING A CLIENT. Every substantive answer should follow this structure:

1. **Short answer** — State your bottom-line conclusion first, in one to three sentences, the way counsel opens a client briefing.
2. **Legal basis** — Cite the governing Philippine statutes, rules, regulations, or jurisprudence (with case names and G.R. numbers where you are confident of them). NEVER fabricate or guess a citation — if you are not certain a case or provision exists, say so explicitly and describe the doctrine generally.
3. **Analysis** — Apply the law to the facts the user gave. Reason through the elements, tests, or procedural steps, and state your assumptions clearly when facts are missing.
4. **Recommendation & next steps** — Give practical, actionable advice: options ranked with their risks, costs, and timelines, and the concrete next step you would take.
5. **Clarifying questions** — If material facts are missing, ask targeted questions before or alongside your advice rather than guessing.

STYLE RULES:
- Professional, measured, and candid — the tone of a senior partner who respects the listener's intelligence.
- Explain legal terms in plain language on first use.
- Flag prescriptive periods, jurisdictional deadlines, and filing requirements prominently whenever relevant.
- Distinguish clearly between what is settled law, what is debatable, and what is your professional assessment.
- Never overpromise outcomes; note risks and contrary authority honestly.
- Keep answers as concise as the question allows — short questions get short answers, complex questions get full briefs.`

const DEFAULT_SETTINGS: InternalSettings = {
  responseLength: "normal",
  webSearch: true,
  fastResponses: true,
  systemPrompt: LAWYER_SYSTEM_PROMPT,
  model: "gemini-2.5-flash",
  temperature: 0.7,
  maxTokens: 4096,
  dataset: [],
  // {{tokens}} pull the live values from the profile's Contact & Location tab
  // (fetched from /api/config) so office details are edited in one place only.
  responseFooter:
    `---\n\n*This response is for **internal use only** and does not constitute legal advice. For formal guidance, consult with the appropriate attorney at {{companyName}}.*\n\n[ ⚖️ {{companyName}}]({{contactUrl}})\n\nIf a user asks about our office location, address, or how to find us, you must respond by stating that our office details are the following:\n- Address: {{address}}\n- Email: {{email}}\n- Phone Numbers: {{phone}}\n- Contact Form Link: {{contactUrl}}`,
}

const SETTINGS_STORAGE_KEY = "internal-chat-settings"
/** Bumped when the default system prompt changes so saved settings pick up the
 * new prompt while keeping custom model/temperature/dataset choices. */
const PROMPT_VERSION = 2

function loadSettings(): InternalSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<InternalSettings> & { promptVersion?: number }
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      responseLength: RESPONSE_LENGTHS.some((option) => option.value === parsed.responseLength)
        ? parsed.responseLength!
        : "normal",
      dataset: Array.isArray(parsed.dataset) ? parsed.dataset : [],
      systemPrompt:
        parsed.promptVersion === PROMPT_VERSION && parsed.systemPrompt
          ? parsed.systemPrompt
          : DEFAULT_SETTINGS.systemPrompt,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function persistSettings(s: InternalSettings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ ...s, promptVersion: PROMPT_VERSION }))
  } catch {}
}

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

function generateSessionId() {
  return `internal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** Remove the appended response footer from a stored assistant message so the
 * model doesn't learn to repeat it when the conversation is replayed as history. */
function stripFooter(content: string, footer: string | undefined): string {
  const f = footer?.trim()
  if (!f) return content
  const idx = content.lastIndexOf(f)
  if (idx !== -1 && content.slice(idx).trim() === f) {
    return content.slice(0, idx).trimEnd()
  }
  return content
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

/** Order of the paginated steps inside the Chat Settings dialog. */
const SETTINGS_PAGES = [
  { id: "behavior", label: "Behavior" },
  { id: "prompt", label: "Instructions" },
  { id: "model", label: "Model & responses" },
  { id: "knowledge", label: "Knowledge base" },
] as const

// ─── Component ────────────────────────────────────────────────────────────────

export function InternalChatPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { toast: showToast } = useToast()

  // API key — always fetched from server so it's the same key as the rest of the system.
  // The profile's Contact & Location details come along and back the {{variables}}.
  const [apiKey, setApiKey] = useState("")
  const [apiKeyLoading, setApiKeyLoading] = useState(true)
  const [appearance, setAppearance] = useState<AppearanceConfig | null>(null)

  // Models — fetched from the same API used by the public config editor
  const [models, setModels] = useState<GeminiModelOption[]>([])
  const [modelsLoading, setModelsLoading] = useState(true)

  // Settings (saved to localStorage)
  const [settings, setSettings] = useState<InternalSettings>(loadSettings)
  // Draft settings edited in the drawer, only applied on "Save"
  const [draft, setDraft] = useState<InternalSettings>(loadSettings)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [referencesOpen, setReferencesOpen] = useState(false)
  const [modelDialogOpen, setModelDialogOpen] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [settingsPage, setSettingsPage] = useState(0)

  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [pending, setPending] = useState({ text: "", summary: "", restarted: false })
  const activeRequest = useRef<AbortController | null>(null)
  const streamTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const followBottom = useRef(true)
  const cancelRequest = useCallback(() => {
    activeRequest.current?.abort()
    activeRequest.current = null
    if (streamTimer.current) clearTimeout(streamTimer.current)
  }, [])
  useEffect(() => cancelRequest, [cancelRequest])
  const [sessionId, setSessionId] = useState(generateSessionId)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const settingsBodyRef = useRef<HTMLDivElement>(null)

  // Reset scroll when paging through the settings dialog
  useEffect(() => {
    settingsBodyRef.current?.scrollTo({ top: 0 })
  }, [settingsPage])

  // ── Fetch API key and models on mount ──
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((cfg: { ai?: { apiKey?: string }; appearance?: AppearanceConfig }) => {
        setApiKey(cfg?.ai?.apiKey ?? "")
        setAppearance(cfg?.appearance ?? null)
      })
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
    if (followBottom.current) messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
  }, [messages, sending, pending])

  // ── Settings drawer ──
  const openDrawer = useCallback(() => {
    setDraft(settings)
    setSavedFlash(false)
    setSettingsPage(0)
    setDrawerOpen(true)
  }, [settings])

  const saveDrawer = useCallback(() => {
    setSettings(draft)
    persistSettings(draft)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
    showToast({ title: "Chat settings saved", tone: "success" })
  }, [draft, showToast])

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
    if (!text || sending || activeRequest.current || !apiKey) return
    const request = new AbortController()
    activeRequest.current = request
    followBottom.current = true
    let live = { text: "", summary: "", restarted: false }
    let attempts = 0
    setPending(live)

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
    setFallbackNotice(null)

    // {{variables}} in the prompt/footer/dataset resolve against the profile's
    // Contact & Location details so office info is edited in one place only.
    const footer = interpolateTemplateVariables(settings.responseFooter ?? "", appearance).trim()

    // Prior turns give the model memory of this conversation. When editing an
    // earlier message, only the turns before it still apply. The current message
    // is appended by callGemini itself.
    const baseMessages = isEditing ? messages.slice(0, editingIndex) : messages
    const history = baseMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.role === "assistant" ? stripFooter(m.content, footer) : m.content,
      }))

    try {
      const dataset: DatasetEntry[] = settings.dataset
        .filter((e) => e.title.trim() || e.content.trim())
        .map((e) => ({
          id: e.id,
          keywords: [],
          title: e.title,
          content: interpolateTemplateVariables(e.content, appearance),
          category: "internal",
        }))

      const result = await callGemini(
        text,
        {
          systemPrompt: `${interpolateTemplateVariables(settings.systemPrompt, appearance)}\n\nRESPONSE LENGTH PREFERENCE FOR THIS REPLY: ${settings.responseLength.toUpperCase()}\n${RESPONSE_LENGTH_INSTRUCTIONS[settings.responseLength]}\nThis preference overrides default formatting and detail requirements, not accuracy or safety. Preserve important caveats, deadlines, and source citations in every mode. If the latest question explicitly requests a different length or format, follow that request.`,
          model: settings.model,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          apiKey,
        },
        defaultConfig.persona,
        [],
        dataset,
        history,
        { webSearch: settings.webSearch, fast: settings.fastResponses, includeThoughts: true, signal: request.signal,
          onUpdate: (update) => {
            if (activeRequest.current !== request) return
            if (update.type === "attempt-reset") {
              if (streamTimer.current) clearTimeout(streamTimer.current)
              streamTimer.current = null
              live = { text: "", summary: "", restarted: attempts++ > 0 }
              setPending(live)
              return
            }
            live = { ...live, ...(update.type === "summary-update" ? { summary: update.text } : { text: update.text }) }
            if (!streamTimer.current) streamTimer.current = setTimeout(() => {
              streamTimer.current = null
              if (activeRequest.current === request) setPending(live)
            }, 50)
          },
        },
      )
      if (activeRequest.current !== request) return

      const finalContent = footer ? `${result.text}

${footer}` : result.text

      if (result.fallbackUsed) {
        const label = (m: string) =>
          (models.length > 0 ? models : FALLBACK_MODELS).find((x) => x.id === m)?.label ?? m
        setFallbackNotice(
          `"${label(settings.model)}" was unavailable — answered with "${label(result.model)}" instead.`,
        )
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", thinkingSummary: result.thinkingSummary, incomplete: result.incomplete, content: finalContent, displayContent: result.answerText ? `${result.answerText}${footer ? `\n\n${footer}` : ""}` : undefined, sources: result.sources, timestamp: new Date(), sourceCount: result.sourceCount, searchSuggestions: result.searchSuggestions, searched: settings.webSearch },
      ])

      // Log the original response (without footer)
      const logBody = JSON.stringify({
        profile: "internal",
        sessionId,
        userName: "Internal User",
        userEmail: "internal@admin",
        userMessage: text,
        aiResponse: result.text,
      })

      fetch("/api/chat-log", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: logBody,
      }).catch(() => {})
    } catch (err) {
      if (activeRequest.current !== request || request.signal.aborted) return
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          content: err instanceof Error ? err.message : "Failed to get a response",
          timestamp: new Date(),
        },
      ])
    } finally {
      if (activeRequest.current === request) {
        if (streamTimer.current) clearTimeout(streamTimer.current)
        streamTimer.current = null
        activeRequest.current = null
        setPending({ text: "", summary: "", restarted: false })
        setSending(false)
        inputRef.current?.focus()
      }
    }
  }, [input, sending, apiKey, settings, sessionId, models, messages, appearance, editingIndex])

  async function handleCopy(content: string, index: number) {
    try {
      await copyFormattedMessage(content)
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
    cancelRequest()
    streamTimer.current = null
    setSending(false)
    setPending({ text: "", summary: "", restarted: false })
    followBottom.current = true
    setMessages([])
    setEditingIndex(null)
    setSessionId(generateSessionId())
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleLogout() {
    cancelRequest()
    logout()
    navigate("/login", { replace: true })
  }

  const isReady = !apiKeyLoading && Boolean(apiKey)
  const activeModelLabel =
    (models.length > 0 ? models : FALLBACK_MODELS).find((m) => m.id === settings.model)
      ?.label ?? settings.model
  const connectionStatus = apiKeyLoading
    ? "Connecting…"
    : !apiKey
      ? "API key required"
      : sending
        ? "Preparing response…"
        : "AI connected"

  const referenceGroups: ReferenceGroup[] = []
  let latestQuestion = "Assistant response"
  messages.forEach((message, messageIndex) => {
    if (message.role === "user") latestQuestion = message.content
    if (message.role === "assistant" && (message.sources?.length || message.searchSuggestions)) {
      referenceGroups.push({ messageIndex, question: latestQuestion, sources: message.sources ?? [], searchSuggestions: message.searchSuggestions })
    }
  })

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] overflow-hidden bg-background text-foreground">
      {/* Settings dialog backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Chat panel ────────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="shrink-0 bg-background">
          <div className="mx-auto flex w-full max-w-[1200px] items-center gap-2.5 px-3 py-3 sm:px-6 lg:px-8">
            <div className="flex size-8 shrink-0 items-center justify-center border border-border bg-secondary">
              <Bot className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display truncate text-sm font-medium leading-none text-foreground">
                Internal Legal Chat
              </h1>
              <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
                {activeModelLabel}
              </p>
            </div>

            <button type="button" onClick={() => setReferencesOpen(true)} aria-haspopup="dialog" className="h-8 px-2 text-xs text-muted-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground xl:hidden">
              References ({referenceGroups.length})
            </button>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={startNewSession}
                title="New session"
                aria-label="Start a new session"
                className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
              >
                <RotateCcw className="size-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex h-8 items-center gap-1 px-2.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
            >
              <ChevronLeft className="size-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              aria-label="Log out"
              className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:bg-secondary hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </header>

        {/* Fallback notice — shown when the primary model failed and another answered */}
        {fallbackNotice && (
          <div className="shrink-0 border-b border-border bg-secondary" role="status">
            <div className="mx-auto flex w-full max-w-[1200px] items-center gap-2 px-4 py-2 sm:px-6 lg:px-8">
              <Shield className="size-3 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-[11px] leading-snug text-muted-foreground">
                {fallbackNotice}
              </span>
              <button
                type="button"
                onClick={() => setFallbackNotice(null)}
                title="Dismiss"
                aria-label="Dismiss model fallback notice"
                className="flex size-6 items-center justify-center text-muted-foreground transition-colors hover:bg-secondary hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
              >
                <X className="size-3" />
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <main className="min-h-0 flex-1 overflow-y-auto" onScroll={(event) => { const el = event.currentTarget; followBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100 }}>
          <div
            className="mx-auto flex min-h-full w-full max-w-[1200px] flex-col px-4 sm:px-6 lg:px-8"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-busy={sending}
          >
          {/* Empty state */}
          {messages.length === 0 && !sending && (
            <section className="my-auto w-full py-10 sm:py-16" aria-labelledby="internal-chat-intro">
              <div className="rounded-card bg-card">
                <div className="flex items-start gap-4 px-5 py-6 sm:gap-5 sm:px-7 sm:py-8">
                  <div className="flex size-11 shrink-0 items-center justify-center border border-border bg-secondary sm:size-12">
                    <Bot className="size-5 text-muted-foreground sm:size-6" />
                  </div>
                  <div className="min-w-0 max-w-xl">
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Internal legal assistant
                    </p>
                    <h2 id="internal-chat-intro" className="font-display mt-2 text-[32px] font-medium tracking-[0.015em] text-foreground sm:text-[42px]">
                      Start a legal briefing
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Research Philippine law, work through case strategy, or draft internal material. Adjust the{" "}
                      <button
                        type="button"
                        onClick={openDrawer}
                        className="text-muted-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                      >
                        chat settings
                      </button>{" "}
                      when the matter needs different instructions or reference material.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-border bg-secondary px-5 py-3 sm:px-7">
                  <Shield className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Internal use only</p>
                    <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">
                      Do not send generated responses to clients without attorney review.
                    </p>
                  </div>
                </div>
              </div>

              {apiKeyLoading && (
                <div className="flex items-center gap-2 border-x border-b border-border px-5 py-3 text-xs text-muted-foreground sm:px-7" role="status">
                  <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" />
                  Connecting to AI…
                </div>
              )}
              {!apiKeyLoading && !apiKey && (
                <p className="border-x border-b border-border bg-secondary px-5 py-3 text-xs text-muted-foreground sm:px-7" role="alert">
                  API key not configured — set GEMINI_API_KEY on the server.
                </p>
              )}
            </section>
          )}

          {/* Conversation stream */}
          <div className="flex flex-col gap-7 py-6 sm:py-8">
            {messages.map((msg, i) => {
              const isUser = msg.role === "user"
              const isError = msg.role === "error"

              if (isUser) {
                return (
                  <article key={i} className="group flex w-full justify-end">
                    <div className="min-w-0 max-w-[88%] sm:max-w-[78%]">
                      <div className="rounded-card bg-secondary px-4 py-3 text-sm leading-6 text-foreground ">
                        <div className="chat-rich-text" dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                      </div>
                      <div className="mt-2 flex items-center justify-end gap-1.5">
                        <time className="mr-1 text-[10px] text-muted-foreground">
                          {formatTime(msg.timestamp)}
                        </time>
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.content, i)}
                          title="Copy message"
                          aria-label="Copy your message"
                          className={cn(
                            "flex size-7 items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100",
                            copiedIndex === i
                              ? "bg-secondary text-muted-foreground"
                              : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
                          )}
                        >
                          {copiedIndex === i ? <Check className="size-3" /> : <Copy className="size-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(i, msg.content)}
                          title="Edit message"
                          aria-label="Edit your message"
                          className="flex size-7 items-center justify-center bg-card text-muted-foreground transition-all hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                        >
                          <Pencil className="size-3" />
                        </button>
                      </div>
                    </div>
                  </article>
                )
              }

              return (
                <article key={i} className="group grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[2.25rem_minmax(0,1fr)] sm:gap-4">
                  <div
                    className={cn(
                      "flex size-8 items-center justify-center border sm:size-9",
                      isError
                        ? "border-border bg-secondary"
                        : "border-border bg-secondary",
                    )}
                  >
                    <Bot className={cn("size-4", isError ? "text-muted-foreground" : "text-muted-foreground")} />
                  </div>
                  <div className="min-w-0">
                    <div
                      className={cn(
                        "border px-4 py-4 sm:px-5 sm:py-5",
                        isError
                          ? "border-border bg-secondary text-muted-foreground"
                          : "border-border bg-secondary text-foreground",
                      )}
                    >
                      <p className={cn("mb-3 text-[10px] font-medium uppercase tracking-[0.18em]", isError ? "text-muted-foreground" : "text-muted-foreground")}>
                        {isError ? "Response error" : "Legal assistant"}
                      </p>
                      {msg.role === "assistant" ? (
                        <>
                        <ThinkingSummary text={msg.thinkingSummary ?? ""} />
                        {msg.incomplete && <p className="mb-3 text-xs text-muted-foreground">This answer is incomplete because the response limit was reached.</p>}
                        <div
                          className="chat-rich-text min-w-0 break-words text-sm leading-7"
                          dangerouslySetInnerHTML={{ __html: formatMessage(msg.displayContent ?? msg.content) }}
                        />
                        {msg.searched && (
                          <p className="mt-4 text-xs text-muted-foreground">
                            {msg.sourceCount ? `${msg.sourceCount} web sources · numbered links identify supported passages.` : "No web sources returned for this answer."}
                          </p>
                        )}
                        </>
                      ) : (
                        <p className="whitespace-pre-wrap break-words text-sm leading-6">{msg.content}</p>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <time className="text-[10px] text-muted-foreground">
                        {formatTime(msg.timestamp)}
                      </time>
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.content, i)}
                        title="Copy message"
                        aria-label={isError ? "Copy error message" : "Copy assistant response"}
                        className={cn(
                          "flex size-7 items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100",
                          copiedIndex === i
                            ? "bg-secondary text-muted-foreground"
                            : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
                        )}
                      >
                        {copiedIndex === i ? <Check className="size-3" /> : <Copy className="size-3" />}
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}

            {/* Typing indicator */}
            {sending && (
              <div
                className="grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[2.25rem_minmax(0,1fr)] sm:gap-4"
                aria-label="Legal assistant is preparing a response"
              >
                <div className="flex size-8 items-center justify-center border border-border bg-secondary sm:size-9">
                  <Bot className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 border border-border bg-secondary px-4 py-3">
                  <p role="status" className="mb-3 text-xs text-muted-foreground">{pending.text ? "Writing response…" : pending.summary ? "Thinking summary arriving…" : pending.restarted ? "Restarting response…" : "Preparing response…"}</p>
                  <ThinkingSummary text={pending.summary} pending />
                  <div aria-live="off" className="chat-rich-text min-w-0 break-words text-sm leading-7" dangerouslySetInnerHTML={{ __html: formatMessage(pending.text) }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
          </div>
        </main>

        {/* Input area */}
        <div className="shrink-0 bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void sendMessage()
            }}
            className="mx-auto w-full max-w-3xl"
          >
            {/* Response length: sits above the input box, no container background */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 pb-2">
              <span id="response-length-label" className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">Response length</span>
              <div
                role="group"
                aria-labelledby="response-length-label"
                className="inline-flex items-center gap-1 rounded-full bg-card p-1"
              >
                {RESPONSE_LENGTHS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={settings.responseLength === option.value}
                    title={option.description}
                    disabled={sending}
                    onClick={() => {
                      const next = { ...settings, responseLength: option.value }
                      setSettings(next)
                      setDraft((previous) => ({ ...previous, responseLength: option.value }))
                      persistSettings(next)
                    }}
                    className={cn(
                      "min-h-6 rounded-full border px-3 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground disabled:cursor-not-allowed disabled:opacity-50",
                      settings.responseLength === option.value
                        ? "border-foreground bg-secondary text-foreground"
                        : "border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <span className="text-[9px] text-muted-foreground">Applies to your next reply</span>
            </div>
            <div className="rounded-[32px] bg-card transition-colors focus-within:ring-1 focus-within:ring-foreground">
              {editingIndex !== null && (
                <div className="flex items-center gap-2 bg-secondary px-3 py-2">
                  <Pencil className="size-3 shrink-0 text-muted-foreground" />
                  <span className="text-[11px] font-medium text-muted-foreground">Editing your message</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingIndex(null)
                      setInput("")
                    }}
                    className="ml-auto text-[11px] text-muted-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <div className="flex items-end gap-2 px-3 py-3 sm:gap-3">
                <button
                  type="button"
                  onClick={openDrawer}
                  title="Chat settings"
                  aria-label="Open chat settings"
                  aria-haspopup="dialog"
                  aria-expanded={drawerOpen}
                  aria-controls="internal-chat-settings"
                  className={cn(
                    "flex h-[42px] w-[42px] shrink-0 items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground",
                    drawerOpen
                      ? "bg-secondary text-muted-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Settings className="size-5" />
                </button>
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
                          ? "Revise your legal question…"
                          : "Ask a legal question…"
                  }
                  disabled={!isReady || sending}
                  rows={1}
                  aria-label={editingIndex !== null ? "Edit your legal question" : "Legal question"}
                  className="min-h-[42px] max-h-40 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent px-1 py-2 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:text-muted-foreground"
                  style={{ fieldSizing: "content" } as React.CSSProperties}
                />
                <Button
                  type="submit"
                  disabled={!isReady || sending || !input.trim()}
                  aria-label={sending ? "Preparing response" : editingIndex !== null ? "Send revised question" : "Send question"}
                  className="h-[42px] w-[42px] shrink-0 p-0 focus-visible:ring-offset-background"
                >
                  {sending ? (
                    <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2 text-[10px] text-muted-foreground">
                <span>
                  Enter to send
                  <span className="hidden sm:inline"> · Shift+Enter for a new line</span>
                </span>
                <span
                  className={cn(
                    "shrink-0 font-medium",
                    !apiKeyLoading && !apiKey
                      ? "text-muted-foreground"
                      : isReady && !sending
                        ? "text-muted-foreground"
                        : "text-muted-foreground",
                  )}
                  role="status"
                >
                  {connectionStatus}
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>

      <ChatReferences groups={referenceGroups} open={referencesOpen} onClose={() => setReferencesOpen(false)} />

      {/* ── Settings dialog ────────────────────────────────────────────────── */}
      {drawerOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
        onClick={(event) => {
          if (event.target === event.currentTarget) setDrawerOpen(false)
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && !modelDialogOpen) {
            event.stopPropagation()
            setDrawerOpen(false)
          }
        }}
      >
      <div
        id="internal-chat-settings"
        className="rounded-card flex h-[90dvh] min-h-0 w-full max-w-[1200px] flex-col overflow-hidden border border-border bg-card "
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-settings-title"
        aria-hidden={!drawerOpen}
        inert={!drawerOpen}
      >
        {/* Dialog header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
          <Settings className="size-4 text-muted-foreground" />
          <h2 id="chat-settings-title" className="font-display text-sm font-medium text-foreground flex-1">Chat Settings</h2>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            title="Close settings"
            aria-label="Close chat settings"
            className="flex items-center justify-center size-7 rounded-control text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Dialog body */}
        <div
          ref={settingsBodyRef}
          className="min-h-0 flex-1 overflow-y-auto px-5 py-5 space-y-7 sm:px-6"
        >
          <section className={cn("space-y-3 border-b border-border pb-5", settingsPage !== 0 && "hidden")}>
            <label className="flex items-center justify-between gap-4 text-sm text-foreground">
              Web search and citations
              <input type="checkbox" checked={draft.webSearch} onChange={(event) => setDraft((prev) => ({ ...prev, webSearch: event.target.checked }))} className="size-4 accent-foreground" />
            </label>
            <p className="text-xs leading-5 text-muted-foreground">Use Google Search for current information and linked sources. Search queries may incur additional Gemini usage charges.</p>
            <label className="flex items-center justify-between gap-4 text-sm text-foreground">
              Faster responses
              <input type="checkbox" checked={draft.fastResponses} onChange={(event) => setDraft((prev) => ({ ...prev, fastResponses: event.target.checked }))} className="size-4 accent-foreground" />
            </label>
            <p className="text-xs leading-5 text-muted-foreground">Limits retries and reduces reasoning time on Gemini 2.5 Flash. Turn off for more deliberate analysis.</p>
          </section>
          {/* System prompt */}
          <section className={cn("space-y-2", settingsPage !== 1 && "hidden")}>
            <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              System Prompt
            </label>
            <PromptTextarea
              label="System prompt"
              value={draft.systemPrompt}
              onChange={(next) =>
                setDraft((prev) => ({ ...prev, systemPrompt: next }))
              }
              rows={9}
              variant="dark"
              placeholder="Describe how the AI should behave…"
            />
            <p className="text-xs leading-5 text-muted-foreground">
              Set the assistant’s role, tone, and instructions. Blue variables use
              your Contact &amp; Location details; amber variables are unrecognized.
              These settings apply only to internal chat.
            </p>
          </section>

          {/* Model settings */}
          <section className={cn("space-y-5", settingsPage !== 2 && "hidden")}>
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Model Settings
            </p>

            {/* Model selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-foreground">Model</label>
                {modelsLoading && (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
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
                  "w-full flex items-center gap-3 rounded-control border px-3 py-2.5 text-left transition-colors",
                  "border-border bg-secondary hover:border-border disabled:opacity-40 disabled:cursor-not-allowed",
                )}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground">
                    {(models.length > 0 ? models : FALLBACK_MODELS).find(
                      (m) => m.id === draft.model,
                    )?.label ?? draft.model}
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {models.length === 0 && !modelsLoading
                      ? "Using fallback model list"
                      : `${(models.length > 0 ? models : FALLBACK_MODELS).length} models available`}
                  </p>
                </div>
                <ChevronDown className="size-4 text-muted-foreground shrink-0" />
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
                        "w-full flex items-center gap-3 rounded-control border px-3 py-2.5 text-left transition-colors",
                        draft.model === m.id
                          ? "border-border bg-secondary"
                          : "border-border bg-secondary hover:border-border",
                      )}
                    >
                      <div
                        className={cn(
                          "size-3.5 rounded-full border-2 shrink-0",
                          draft.model === m.id
                            ? "border-border bg-secondary"
                            : "border-border",
                        )}
                      />
                      <span className="text-sm font-medium text-foreground">{m.label}</span>
                    </button>
                  ))}
                  {models.length === 0 && !modelsLoading && (
                    <p className="text-[11px] text-muted-foreground text-center py-4">
                      Using fallback model list — server could not be reached.
                    </p>
                  )}
                </div>
              </Dialog>
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-foreground">Temperature</label>
                <span className="text-xs font-mono text-muted-foreground tabular-nums">
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
                className="w-full accent-foreground cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Precise (0)</span>
                <span>Creative (1)</span>
              </div>
            </div>

            {/* Max tokens */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-foreground">Max Output Tokens</label>
                <span className="text-xs font-mono text-muted-foreground tabular-nums">
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
                className="w-full accent-foreground cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
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
                      "rounded-control py-1 text-[11px] font-mono transition-colors",
                      draft.maxTokens === preset
                        ? "bg-secondary text-muted-foreground border border-border"
                        : "bg-secondary text-muted-foreground border border-border hover:text-foreground",
                    )}
                  >
                    {preset >= 1000 ? `${preset / 1024}k` : preset}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Gemini 2.5 Flash/Pro support up to 65,536 output tokens.
              </p>
            </div>
          </section>

          {/* Response footer */}
          <section className={cn("space-y-2", settingsPage !== 1 && "hidden")}>
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Response Footer
            </p>
            <PromptTextarea
              label="Response footer"
              value={draft.responseFooter}
              onChange={(next) =>
                setDraft((prev) => ({ ...prev, responseFooter: next }))
              }
              rows={3}
              variant="dark"
              placeholder="e.g. — This response is for internal use only and does not constitute legal advice."
            />
            <p className="text-[11px] text-muted-foreground">
              Appended to every AI response. Supports markdown formatting and
              contact variables.
            </p>
          </section>

          {/* Dataset */}
          <section className={cn("space-y-3", settingsPage !== 3 && "hidden")}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Knowledge Base
              </p>
              <button
                type="button"
                onClick={addEntry}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-muted-foreground transition-colors"
              >
                <Plus className="size-3.5" />
                Add entry
              </button>
            </div>

            {draft.dataset.length === 0 ? (
              <p className="text-xs text-muted-foreground py-1 leading-relaxed">
                Add entries to give the AI additional context — case notes,
                internal procedures, reference material, etc.
              </p>
            ) : (
              <div className="space-y-3">
                {draft.dataset.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="rounded-control border border-border bg-secondary p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        Entry {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeEntry(entry.id)}
                        title={`Remove entry ${idx + 1}`}
                        aria-label={`Remove knowledge base entry ${idx + 1}`}
                        className="flex items-center justify-center size-5 rounded text-muted-foreground hover:text-muted-foreground transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={entry.title}
                      onChange={(e) => updateEntry(entry.id, "title", e.target.value)}
                      placeholder="Title"
                      className="w-full rounded-control bg-secondary border border-border px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-foreground"
                    />
                    <PromptTextarea
                      value={entry.content}
                      onChange={(next) =>
                        updateEntry(entry.id, "content", next)
                      }
                      placeholder="Content…"
                      rows={3}
                      label="Knowledge base content"
                      variant="dark"
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Dialog footer */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-4 border-t border-border shrink-0">
          <button
            type="button"
            onClick={resetDraft}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset to defaults
          </button>

          <div className="flex-1" />

          {/* Pagination */}
          <nav aria-label="Settings pages" className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSettingsPage((page) => Math.max(0, page - 1))}
              disabled={settingsPage === 0}
              className="flex h-8 items-center gap-1 rounded-control px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground disabled:pointer-events-none disabled:opacity-40 text-foreground hover:bg-secondary"
            >
              <ChevronLeft className="size-3.5" />
              Back
            </button>
            <span className="whitespace-nowrap px-2 text-[11px] tabular-nums text-muted-foreground" aria-live="polite">
              Step {settingsPage + 1} of {SETTINGS_PAGES.length} · {SETTINGS_PAGES[settingsPage].label}
            </span>
            <button
              type="button"
              onClick={() => setSettingsPage((page) => Math.min(SETTINGS_PAGES.length - 1, page + 1))}
              disabled={settingsPage === SETTINGS_PAGES.length - 1}
              className="flex h-8 items-center gap-1 rounded-control px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground disabled:pointer-events-none disabled:opacity-40 text-foreground hover:bg-secondary"
            >
              Next
              <ChevronRight className="size-3.5" />
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {savedFlash && (
              <span className="text-xs text-muted-foreground font-medium">Saved ✓</span>
            )}
            <Button onClick={saveDrawer} size="sm" className="h-8 px-4 text-xs">
              Save settings
            </Button>
          </div>
        </div>
      </div>
      </div>
      )}
    </div>
  )
}
