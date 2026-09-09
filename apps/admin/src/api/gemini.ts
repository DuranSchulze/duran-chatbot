import type { AIConfig, DatasetEntry, PersonaConfig, ServiceEntry } from "@duran-chatbot/config"
import { citeGroundedAnswer, type GroundingMetadata } from "./grounding"
import { readGeminiStream } from "./gemini-stream"

/** A prior turn in the conversation, used to give the model context. */
export interface ChatTurn {
  role: "user" | "assistant"
  content: string
}

export interface GeminiResult {
  thinkingSummary?: string
  incomplete?: boolean
  answerText?: string
  sources?: import("./grounding").GroundedSource[]
  text: string
  /** The model that actually produced the answer (differs from ai.model when a fallback fired). */
  model: string
  fallbackUsed: boolean
  sourceCount?: number
  searchSuggestions?: string
}

export type GeminiUpdate = { type: "attempt-reset" | "summary-update" | "answer-update"; text: string }
interface RequestOptions {
  onUpdate?: (update: GeminiUpdate) => void
  signal?: AbortSignal
  includeThoughts?: boolean
  webSearch?: boolean
  fast?: boolean
}

/**
 * Ordered models tried when the configured one fails (deprecated/removed model,
 * quota or overload). `gemini-flash-latest` is Google's rolling alias and is kept
 * last as a safety net.
 */
export const MODEL_FALLBACK_CHAIN = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-pro",
  "gemini-flash-latest",
] as const

/** Abort an in-flight request after this long so a hung connection never freezes the UI. */
const REQUEST_TIMEOUT_MS = 90_000
/** Cap how much history we send to keep latency and token cost predictable. */
const MAX_HISTORY_TURNS = 20
/**
 * Ceiling for the automatic maxOutputTokens escalation after a MAX_TOKENS
 * truncation (common with thinking models whose reasoning eats the budget —
 * answers come back cut mid-sentence even at modest limits).
 */
const MAX_TOKEN_ESCALATION_LIMIT = 32_768
/** Max attempts (initial + escalations) before returning the longest partial answer. */
const MAX_TOKEN_ATTEMPTS = 3

/**
 * Error thrown for Gemini API failures. `fatal` marks errors where switching
 * models cannot help (bad API key, malformed request, safety refusal) so the
 * caller fails fast instead of burning through the fallback chain.
 */
class GeminiError extends Error {
  status?: number
  fatal: boolean

  constructor(message: string, status?: number, fatal?: boolean) {
    super(message)
    this.name = "GeminiError"
    this.status = status
    this.fatal = fatal ?? false
  }
}

function buildPersonaInstruction(persona: PersonaConfig): string {
  if (!persona.enabled) return ""
  const sections = [
    persona.personaName ? `Reference voice: ${persona.personaName}` : "",
    persona.roleOrRelationship ? `Role or relationship: ${persona.roleOrRelationship}` : "",
    persona.tone ? `Tone: ${persona.tone}` : "",
    persona.writingStyle ? `Writing style: ${persona.writingStyle}` : "",
    persona.signaturePhrases ? `Signature phrases: ${persona.signaturePhrases}` : "",
    persona.dos ? `Do: ${persona.dos}` : "",
    persona.donts ? `Don't: ${persona.donts}` : "",
    persona.audienceNotes ? `Audience notes: ${persona.audienceNotes}` : "",
  ].filter(Boolean)
  if (sections.length === 0) return ""
  return `\n\nPersona voice guidance:\nReflect this person's tone, phrasing, and communication style without claiming to literally be them. Keep all existing business, legal, and safety guardrails intact.\n${sections.join("\n")}`
}

function buildServicesInstruction(services: ServiceEntry[]): string {
  if (services.length === 0) return ""
  const entries = services
    .map((s) =>
      [
        `Service: ${s.name}`,
        `Keywords: ${s.keywords.join(", ")}`,
        `Price guidance: ${s.price}`,
        `Process: ${s.process}`,
        s.notes ? `Notes: ${s.notes}` : "",
        `Next step: ${s.cta}`,
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n")
  return `\n\nServices knowledge base:\nUse these service entries when users ask about pricing, process, what is included, or next steps.\n\n${entries}`
}

/** Map our conversation history + current message into Gemini's `contents` format. */
function buildContents(history: ChatTurn[], message: string) {
  const recent = history.slice(-MAX_HISTORY_TURNS)
  const contents = recent.map((turn) => ({
    role: turn.role === "assistant" ? "model" : "user",
    parts: [{ text: turn.content }],
  }))
  contents.push({ role: "user", parts: [{ text: message }] })
  return contents
}

/** Extract the answer text, finish reason and prompt-level blocks from a Gemini payload. */
function extractCandidate(payload: unknown): { text: string; thinkingSummary: string; finishReason?: string; blockReason?: string; grounding?: GroundingMetadata } {
  const data = payload as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> }; finishReason?: string; groundingMetadata?: GroundingMetadata }>
    promptFeedback?: { blockReason?: string }
  }
  const blockReason = data?.promptFeedback?.blockReason
  const candidate = data?.candidates?.[0]
  const parts = candidate?.content?.parts
  const text = Array.isArray(parts) ? parts.filter((p) => !p.thought).map((p) => p.text ?? "").join("") : ""
  const thinkingSummary = Array.isArray(parts) ? parts.filter((p) => p.thought).map((p) => p.text ?? "").join("") : ""
  return { text, thinkingSummary, finishReason: candidate?.finishReason, blockReason, grounding: candidate?.groundingMetadata }
}

/** Turn a non-2xx Gemini response into a GeminiError with the API's own message when present. */
async function toGeminiError(response: Response): Promise<GeminiError> {
  let details = ""
  try {
    const data = (await response.json()) as { error?: { message?: string; status?: string } }
    details = data?.error?.message ?? ""
  } catch {
    details = response.statusText
  }
  // 400/401/403 are request/key problems — another model won't fix them.
  const fatal = [400, 401, 403].includes(response.status)
  return new GeminiError(details || `Gemini API error (${response.status})`, response.status, fatal)
}

const SAFETY_FINISH_REASONS = ["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII"]

function buildSafetyError(reason: string): GeminiError {
  return new GeminiError(
    `The model declined to answer this request (blocked by safety filters: ${reason}). ` +
      "Try rephrasing the question or removing sensitive personal data.",
    undefined,
    true,
  )
}

/**
 * One attempt against a single model. Escalates maxOutputTokens once when the
 * model spent its whole budget thinking and returned no visible text (common
 * with Gemini 2.5 thinking models at low token limits).
 */
async function attemptModel(
  model: string,
  contents: unknown[],
  systemText: string,
  ai: AIConfig,
  apiKey: string,
  options: RequestOptions,
): Promise<ReturnType<typeof citeGroundedAnswer> & { thinkingSummary?: string; incomplete?: boolean }> {
  const run = async (maxOutputTokens: number, includeThoughts = !!options.includeThoughts && /^gemini-(2\.5|3)/.test(model)): Promise<{ escalated: boolean; text: string; thinkingSummary: string; grounding?: GroundingMetadata }> => {
    options.signal?.throwIfAborted()
    options.onUpdate?.({ type: "attempt-reset", text: "" })
    const controller = new AbortController()
    const abort = () => controller.abort()
    options.signal?.addEventListener("abort", abort, { once: true })
    const timer = setTimeout(() => controller.abort(), options.fast ? 35_000 : REQUEST_TIMEOUT_MS)
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:${options.onUpdate ? "streamGenerateContent?alt=sse&" : "generateContent?"}key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: systemText }] },
            ...(options.webSearch ? { tools: [{ google_search: {} }] } : {}),
            generationConfig: {
              temperature: ai.temperature,
              maxOutputTokens,
              ...((includeThoughts || (options.fast && model === "gemini-2.5-flash")) ? { thinkingConfig: { ...(includeThoughts ? { includeThoughts: true } : {}), ...(options.fast && model === "gemini-2.5-flash" ? { thinkingBudget: 512 } : {}) } } : {}),
            },
          }),
          signal: controller.signal,
        },
      )

      if (!response.ok) {
        const error = await toGeminiError(response)
        if (includeThoughts && error.status === 400 && /include.?thoughts/i.test(error.message) && /unsupported|not supported|unknown|not allowed/i.test(error.message)) return await run(maxOutputTokens, false)
        throw error
      }
      let result = { text: "", thinkingSummary: "" } as ReturnType<typeof extractCandidate>
      if (options.onUpdate) {
        if (!response.body) throw new Error("Missing response stream")
        await readGeminiStream(response.body, (payload) => {
          if (payload && typeof payload === "object" && "error" in payload) throw new Error("Gemini stream failed")
          const next = extractCandidate(payload)
          if (next.blockReason) throw buildSafetyError(next.blockReason)
          if (next.finishReason && SAFETY_FINISH_REASONS.includes(next.finishReason)) throw buildSafetyError(next.finishReason)
          result = { ...result, text: result.text + next.text, thinkingSummary: result.thinkingSummary + next.thinkingSummary, finishReason: next.finishReason ?? result.finishReason, grounding: next.grounding ? { ...result.grounding, ...next.grounding } : result.grounding }
          if (next.thinkingSummary) options.onUpdate?.({ type: "summary-update", text: result.thinkingSummary })
          if (next.text) options.onUpdate?.({ type: "answer-update", text: result.text })
        })
        if (!result.finishReason) throw new Error("Response stream ended before completion")
      } else result = extractCandidate(await response.json())
      const { text, thinkingSummary, finishReason, blockReason, grounding } = result

      if (blockReason) throw buildSafetyError(blockReason)
      if (finishReason && SAFETY_FINISH_REASONS.includes(finishReason)) {
        throw buildSafetyError(finishReason)
      }
      // MAX_TOKENS means the answer was cut off — with thinking models the
      // internal reasoning eats into the budget, so even short-looking limits
      // truncate visibly. Signal an escalation; keep the partial text so the
      // caller can still use the longest attempt if retries keep truncating.
      if (finishReason === "MAX_TOKENS") {
        return { escalated: true, text, thinkingSummary, grounding }
      }
      return { escalated: false, text, thinkingSummary, grounding }
    } finally {
      clearTimeout(timer)
      options.signal?.removeEventListener("abort", abort)
    }
  }

  let maxOutputTokens = ai.maxTokens
  let best: { text: string; thinkingSummary: string; grounding?: GroundingMetadata } | null = null
  const finalize = (result: NonNullable<typeof best>, incomplete = false) => ({ ...citeGroundedAnswer(result.text, options.webSearch ? result.grounding : undefined), thinkingSummary: result.thinkingSummary, incomplete })
  for (let attempt = 0; attempt < MAX_TOKEN_ATTEMPTS; attempt++) {
    const result = await run(maxOutputTokens)
    if (!result.escalated) {
      if (!result.text) {
        // Empty answer with no usable finish reason — treat as retryable so the
        // caller moves on to the next model in the chain.
        throw new GeminiError(`Model ${model} returned an empty response`)
      }
      return finalize(result)
    }
    if (result.text && result.text.length > (best?.text.length ?? 0)) {
      best = result
    }
    maxOutputTokens = Math.min(maxOutputTokens * 2, MAX_TOKEN_ESCALATION_LIMIT)
  }
  // Still truncated after escalation — a longer partial answer beats an error.
  if (best?.text) {
    return finalize(best, true)
  }
  throw new GeminiError(`Model ${model} exhausted its response budget`)
}

/**
 * Call Gemini with conversation memory, a request timeout, empty-answer recovery
 * and automatic fallback to other models when the configured one fails
 * (removed/deprecated model, quota exhausted, server overload, network error).
 */
export async function callGemini(
  message: string,
  ai: AIConfig,
  persona: PersonaConfig,
  services: ServiceEntry[],
  dataset: DatasetEntry[],
  history?: ChatTurn[],
  options: RequestOptions = {},
): Promise<GeminiResult> {
  if (!ai.apiKey) throw new Error("API key not configured")

  const datasetContext =
    dataset.length > 0
      ? `\n\nKnowledge base:\n${dataset.map((e) => `${e.title}: ${e.content}`).join("\n\n")}`
      : ""
  const systemText =
    ai.systemPrompt +
    buildPersonaInstruction(persona) +
    buildServicesInstruction(services) +
    datasetContext +
    (options.webSearch ? "\n\nUse Google Search for factual legal questions and current information. Prefer Philippine primary sources: Supreme Court E-Library, Lawphil, Official Gazette, statutes and government agencies. Lead with a concise answer. Ground important claims in retrieved sources; distinguish your analysis from source statements. Never invent citations or quotations. Quote only short passages you actually retrieved and identify their provision or section when available." : "")
  const contents = buildContents(history ?? [], message)

  const models = [ai.model, ...MODEL_FALLBACK_CHAIN].filter(
    (m, i, arr) => m && arr.indexOf(m) === i,
  )

  let lastError: unknown
  for (const model of (options.fast ? models.slice(0, 2) : models)) {
    try {
      const result = await attemptModel(model, contents, systemText, ai, ai.apiKey, options)
      return { ...result, model, fallbackUsed: model !== ai.model }
    } catch (err) {
      options.signal?.throwIfAborted()
      if (err instanceof GeminiError && err.fatal) throw err
      lastError = err
      // Non-fatal (rate limit, overload, unknown model, timeout, network) — try the next model.
    }
  }

  if (lastError instanceof Error) {
    throw new Error(
      `All Gemini models failed. Last error: ${lastError.message}` +
        (lastError instanceof GeminiError && lastError.status === 429
          ? " — the API quota is exhausted, please try again in a few minutes."
          : ""),
    )
  }
  throw new Error("All Gemini models failed")
}
