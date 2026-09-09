import type {
  AIConfig,
  AppearanceConfig,
  DatasetEntry,
  PersonaConfig,
  QuickLink,
  ServiceEntry,
} from '@duran-chatbot/config'
import { interpolateTemplateVariables } from '@duran-chatbot/config'

interface VisitorProfile {
  name: string
  email: string
}

/** A prior turn in the conversation, used to give the model context. */
export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface GeminiCallOptions {
  message: string
  ai: AIConfig
  persona: PersonaConfig
  apiKey: string
  services: ServiceEntry[]
  dataset: DatasetEntry[]
  /** Company contact & location details — injected into the prompt so the AI can answer location questions. */
  appearance?: AppearanceConfig
  /** Configurable action buttons shown in the widget menu — surfaced so the AI can reference them. */
  quickLinks?: QuickLink[]
  /** Recent conversation turns (most recent last), excluding the current message. */
  history?: ChatTurn[]
  visitorProfile?: VisitorProfile
  /** Called with the full accumulated text as streaming chunks arrive. */
  onChunk?: (fullText: string) => void
  /** Allows the caller to cancel the request (e.g. widget closed). */
  signal?: AbortSignal
}

/** Abort an in-flight request after this long so a hung connection never freezes the UI. */
const REQUEST_TIMEOUT_MS = 30_000
/** Cap how much history we send to keep latency and token cost predictable. */
const MAX_HISTORY_TURNS = 10
/**
 * Ceiling for the automatic maxOutputTokens escalation after a MAX_TOKENS
 * truncation (common with thinking models whose reasoning eats the budget).
 * Big enough to complete a full chat answer, bounded so a runaway loop can't
 * stack many slow retries against a visitor.
 */
const MAX_TOKEN_ESCALATION_LIMIT = 16_384

/**
 * Ordered models tried when the configured one fails (deprecated/removed model,
 * quota or overload). `gemini-flash-latest` is Google's rolling alias and is kept
 * last as a safety net.
 */
const MODEL_FALLBACK_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-flash-latest',
]

/**
 * Error thrown for Gemini API failures. `fatal` marks errors where switching
 * models cannot help (bad API key, malformed request, safety refusal) so we
 * fail fast instead of burning through the fallback chain.
 */
class GeminiApiError extends Error {
  status?: number
  fatal: boolean

  constructor(message: string, status?: number, fatal?: boolean) {
    super(message)
    this.name = 'GeminiApiError'
    this.status = status
    this.fatal = fatal ?? false
  }
}

function buildPersonaInstruction(persona: PersonaConfig): string {
  if (!persona.enabled) {
    return ''
  }

  const sections = [
    persona.personaName ? `Reference voice: ${persona.personaName}` : '',
    persona.roleOrRelationship ? `Role or relationship: ${persona.roleOrRelationship}` : '',
    persona.tone ? `Tone: ${persona.tone}` : '',
    persona.writingStyle ? `Writing style: ${persona.writingStyle}` : '',
    persona.signaturePhrases ? `Signature phrases: ${persona.signaturePhrases}` : '',
    persona.dos ? `Do: ${persona.dos}` : '',
    persona.donts ? `Don't: ${persona.donts}` : '',
    persona.audienceNotes ? `Audience notes: ${persona.audienceNotes}` : '',
  ].filter(Boolean)

  if (sections.length === 0) {
    return ''
  }

  return `\n\nPersona voice guidance:\nReflect this person's tone, phrasing, and communication style without claiming to literally be them. Keep all existing business, legal, and safety guardrails intact.\n${sections.join('\n')}`
}

function buildServicesInstruction(services: ServiceEntry[]): string {
  if (services.length === 0) {
    return `\n\nServices guidance:\nNo service catalog has been configured. When a visitor asks what services are offered, about pricing, or how engagement works, still help them: draw on the practice areas and expertise described in your instructions to explain, in general terms, how the firm typically assists with the visitor's specific issue, and provide useful general legal information. Never invent specific prices, service packages, timelines, or guaranteed outcomes — when exact figures or a formal quote matter, invite the visitor to book a consultation or use the contact details provided.`
  }

  const entries = services
    .map((service) => {
      const parts = [
        `Service: ${service.name}`,
        `Keywords: ${service.keywords.join(', ')}`,
        `Price guidance: ${service.price}`,
        `Process: ${service.process}`,
        service.notes ? `Notes: ${service.notes}` : '',
        `Next step: ${service.cta}`,
      ].filter(Boolean)

      return parts.join('\n')
    })
    .join('\n\n')

  return `\n\nServices knowledge base:\nUse these service entries when users ask about pricing, process, what is included, or next steps. Answer like a helpful sales assistant: explain the process clearly, use the stored price text faithfully, treat pricing as indicative or estimated unless the service details make it clearly fixed, avoid inventing prices that are not present, and guide the user toward the recommended next step when relevant.\n\n${entries}`
}

function buildActionsInstruction(quickLinks: QuickLink[]): string {
  if (quickLinks.length === 0) {
    return ''
  }

  const entries = quickLinks
    .map((link) => {
      const type = link.actionType ?? 'link'
      if (type === 'quote') {
        return `"${link.label}" — opens a Request-a-Quote form that emails the visitor and notifies the sales team.`
      }
      if (type === 'prompt') {
        return `"${link.label}" — asks: ${link.prompt ?? link.label}`
      }
      return `"${link.label}" — opens this page: ${link.url ?? ''}`
    })
    .join('\n')

  return `\n\nAvailable action buttons:\nThe visitor can click these buttons in the chat menu. When relevant, guide them to the right one by name (e.g. invite them to click "Request a Quote"), and you may reference the linked pages in your answers.\n\n${entries}`
}

/**
 * Build a verified contact & location block from the admin-managed company details.
 * When the fields are filled, the AI is told to answer location/contact questions with
 * exactly these details instead of guessing or pointing only to a website.
 */
function buildContactInstruction(appearance: AppearanceConfig): string {
  const lines: string[] = []

  if (appearance.companyAddress?.trim()) {
    lines.push(`Address: ${appearance.companyAddress.trim()}`)
  }
  if (appearance.companyPhone?.trim()) {
    lines.push(`Phone: ${appearance.companyPhone.trim()}`)
  }
  if (appearance.companyEmail?.trim()) {
    lines.push(`Email: ${appearance.companyEmail.trim()}`)
  }
  if (appearance.officeHours?.trim()) {
    lines.push(`Office hours: ${appearance.officeHours.trim()}`)
  }
  if (appearance.contactUrl?.trim()) {
    lines.push(`Website / contact form: ${appearance.contactUrl.trim()}`)
  }
  if (appearance.mapUrl?.trim()) {
    lines.push(`Map / directions: ${appearance.mapUrl.trim()}`)
  }

  if (lines.length === 0) {
    return ''
  }

  return `\n\nCompany contact & location:\nWhen a visitor asks where the company is located, asks for the address, directions, phone number, email, office hours, or how to reach us, answer using the official details below. Never invent or change these details — if something is missing, point them to the website/contact form instead.\n\nIf any earlier instruction in your system prompt lists different or outdated contact, address, or location details, ignore them — the details below are the most current and authoritative.\n\n${lines.join('\n')}`
}

function buildSystemInstruction(
  ai: AIConfig,
  persona: PersonaConfig,
  services: ServiceEntry[],
  dataset: DatasetEntry[],
  quickLinks: QuickLink[],
  appearance: AppearanceConfig | undefined,
  visitorProfile?: VisitorProfile,
): string {
  const datasetContext =
    dataset.length > 0
      ? `\n\nKnowledge base:\n${dataset.map((e) => `${e.title}: ${e.content}`).join('\n\n')}`
      : ''
  const visitorContext = visitorProfile
    ? `\n\nVisitor details:\nName: ${visitorProfile.name}\nEmail: ${visitorProfile.email}`
    : ''
  const personaContext = buildPersonaInstruction(persona)
  const servicesContext = buildServicesInstruction(services)
  const actionsContext = buildActionsInstruction(quickLinks)
  const contactContext = appearance ? buildContactInstruction(appearance) : ''

  const instruction =
    ai.systemPrompt + personaContext + servicesContext + datasetContext + actionsContext + contactContext + visitorContext

  // Resolve {{address}}-style references against Contact & Location so those
  // details are edited in one place and flow everywhere they're mentioned.
  return interpolateTemplateVariables(instruction, appearance)
}

/** Map our conversation history + current message into Gemini's `contents` format. */
function buildContents(history: ChatTurn[], message: string) {
  const recent = history.slice(-MAX_HISTORY_TURNS)
  const contents = recent.map((turn) => ({
    role: turn.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: turn.content }],
  }))
  contents.push({ role: 'user', parts: [{ text: message }] })
  return contents
}

interface CandidateResult {
  text: string
  finishReason?: string
  blockReason?: string
}

/** Extract the answer text, finish reason and prompt-level blocks from a Gemini payload. */
function extractCandidate(payload: unknown): CandidateResult {
  const data = payload as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>
    promptFeedback?: { blockReason?: string }
  }
  const blockReason = data?.promptFeedback?.blockReason
  const candidate = data?.candidates?.[0]
  const parts = candidate?.content?.parts
  const text = Array.isArray(parts) ? parts.map((p) => p.text ?? '').join('') : ''
  return { text, finishReason: candidate?.finishReason, blockReason }
}

const SAFETY_FINISH_REASONS = ['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII']

function buildSafetyError(reason: string): GeminiApiError {
  return new GeminiApiError(
    `The assistant declined to answer this request (safety filters: ${reason}).`,
    undefined,
    true,
  )
}

function checkCandidate(result: CandidateResult): void {
  if (result.blockReason) throw buildSafetyError(result.blockReason)
  if (result.finishReason && SAFETY_FINISH_REASONS.includes(result.finishReason)) {
    throw buildSafetyError(result.finishReason)
  }
}

/** Turn a non-2xx Gemini response into a GeminiApiError with the API's own message when present. */
async function toApiError(response: Response): Promise<GeminiApiError> {
  let details = ''
  try {
    const data = (await response.json()) as { error?: { message?: string } }
    details = data?.error?.message ?? ''
  } catch {
    details = response.statusText
  }
  // 400/401/403 are request/key problems — another model won't fix them.
  const fatal = [400, 401, 403].includes(response.status)
  return new GeminiApiError(details || `API error: ${response.status}`, response.status, fatal)
}

/** Stream a response via Gemini SSE, invoking onChunk with the running total. */
async function streamGemini(
  url: string,
  body: unknown,
  signal: AbortSignal,
  onChunk: (fullText: string) => void,
): Promise<CandidateResult> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok || !response.body) {
    throw await toApiError(response)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''
  let finishReason: string | undefined
  let blockReason: string | undefined

  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (!payload || payload === '[DONE]') continue
      try {
        const delta = extractCandidate(JSON.parse(payload))
        finishReason = delta.finishReason ?? finishReason
        blockReason = delta.blockReason ?? blockReason
        if (delta.text) {
          full += delta.text
          onChunk(full)
        }
      } catch {
        // Partial JSON across chunk boundaries — ignore; next read completes it.
      }
    }
  }

  return { text: full, finishReason, blockReason }
}

/** Non-streaming call used when SSE is unavailable. */
async function generateGemini(
  url: string,
  body: unknown,
  signal: AbortSignal,
): Promise<CandidateResult> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    throw await toApiError(response)
  }

  return extractCandidate(await response.json())
}

/** True when an error is worth retrying against a different model. */
function isModelFallbackWorthy(err: unknown): boolean {
  if (err instanceof GeminiApiError) return !err.fatal
  // Network failures / timeouts arrive as plain TypeErrors / AbortErrors.
  return true
}

/**
 * Call Gemini with streaming, conversation memory, a request timeout, empty-answer
 * recovery and automatic fallback to other models when the configured one fails
 * (removed/deprecated model, quota exhausted, server overload, network error).
 * When `onChunk` is provided the reply streams token-by-token; otherwise a single
 * final string is returned.
 */
export async function callGeminiAPI(opts: GeminiCallOptions): Promise<string> {
  const systemText = buildSystemInstruction(
    opts.ai,
    opts.persona,
    opts.services,
    opts.dataset,
    opts.quickLinks ?? [],
    opts.appearance,
    opts.visitorProfile,
  )
  const contents = buildContents(opts.history ?? [], opts.message)

  /**
   * One attempt against a single model. Escalates maxOutputTokens once when the
   * model spent its whole budget thinking and returned no visible text (common
   * with Gemini 2.5 thinking models at low token limits).
   */
  const attemptModel = async (model: string): Promise<string> => {
    const run = async (maxOutputTokens: number): Promise<{ escalated: boolean; text: string }> => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
      const onExternalAbort = () => controller.abort()
      opts.signal?.addEventListener('abort', onExternalAbort, { once: true })

      const body = {
        contents,
        systemInstruction: { parts: [{ text: systemText }] },
        generationConfig: {
          temperature: opts.ai.temperature,
          maxOutputTokens,
        },
      }
      const base = `https://generativelanguage.googleapis.com/v1beta/models/${model}`
      const streamUrl = `${base}:streamGenerateContent?alt=sse&key=${opts.apiKey}`
      const generateUrl = `${base}:generateContent?key=${opts.apiKey}`

      try {
        if (opts.onChunk) {
          try {
            const streamed = await streamGemini(streamUrl, body, controller.signal, opts.onChunk)
            checkCandidate(streamed)
            // MAX_TOKENS means the answer was cut off — with thinking models the
            // internal reasoning eats into the budget, so even short-looking
            // limits truncate visibly. Retry with a bigger budget.
            if (streamed.finishReason === 'MAX_TOKENS' && maxOutputTokens < MAX_TOKEN_ESCALATION_LIMIT) {
              return { escalated: true, text: '' }
            }
            if (streamed.text) return { escalated: false, text: streamed.text }
            // Empty stream — fall through to the non-streaming call below.
          } catch (err) {
            // If the caller cancelled, propagate. Otherwise fall back to non-streaming.
            if (opts.signal?.aborted) throw err
          }
        }
        const generated = await generateGemini(generateUrl, body, controller.signal)
        checkCandidate(generated)
        if (
          generated.finishReason === 'MAX_TOKENS' &&
          maxOutputTokens < MAX_TOKEN_ESCALATION_LIMIT
        ) {
          return { escalated: true, text: '' }
        }
        return { escalated: false, text: generated.text }
      } finally {
        clearTimeout(timer)
        opts.signal?.removeEventListener('abort', onExternalAbort)
      }
    }

    let maxOutputTokens = opts.ai.maxTokens
    for (;;) {
      const result = await run(maxOutputTokens)
      if (!result.escalated) {
        if (!result.text) {
          // Empty answer with no usable finish reason — let the caller move on
          // to the next model in the chain.
          throw new GeminiApiError(`Model ${model} returned an empty response`)
        }
        return result.text
      }
      maxOutputTokens = Math.min(maxOutputTokens * 2, MAX_TOKEN_ESCALATION_LIMIT)
    }
  }

  const models = [opts.ai.model, ...MODEL_FALLBACK_CHAIN].filter(
    (m, i, arr) => m && arr.indexOf(m) === i,
  )

  let lastError: unknown
  for (const model of models) {
    try {
      return await attemptModel(model)
    } catch (err) {
      if (opts.signal?.aborted) throw err
      if (!isModelFallbackWorthy(err)) throw err
      lastError = err
      // Reset the streaming bubble so the next model starts from a clean slate.
      opts.onChunk?.('')
    }
  }

  throw lastError instanceof Error ? lastError : new Error('All Gemini models failed')
}
