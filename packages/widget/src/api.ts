import type {
  AIConfig,
  DatasetEntry,
  PersonaConfig,
  QuickLink,
  ServiceEntry,
} from '@duran-chatbot/config'

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
    return ''
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

function buildSystemInstruction(
  ai: AIConfig,
  persona: PersonaConfig,
  services: ServiceEntry[],
  dataset: DatasetEntry[],
  quickLinks: QuickLink[],
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

  return ai.systemPrompt + personaContext + servicesContext + datasetContext + actionsContext + visitorContext
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

function extractText(payload: unknown): string {
  const parts = (payload as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  })?.candidates?.[0]?.content?.parts
  if (!Array.isArray(parts)) return ''
  return parts.map((p) => p.text ?? '').join('')
}

/** Stream a response via Gemini SSE, invoking onChunk with the running total. */
async function streamGemini(
  url: string,
  body: unknown,
  signal: AbortSignal,
  onChunk: (fullText: string) => void,
): Promise<string> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok || !response.body) {
    throw new Error(`API error: ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''

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
        const delta = extractText(JSON.parse(payload))
        if (delta) {
          full += delta
          onChunk(full)
        }
      } catch {
        // Partial JSON across chunk boundaries — ignore; next read completes it.
      }
    }
  }

  return full
}

/** Non-streaming fallback used when SSE is unavailable. */
async function generateGemini(url: string, body: unknown, signal: AbortSignal): Promise<string> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return extractText(await response.json()) || 'No response received'
}

/**
 * Call Gemini with streaming, conversation memory, a request timeout and a single
 * automatic retry on transient failures. When `onChunk` is provided the reply streams
 * token-by-token; otherwise a single final string is returned.
 */
export async function callGeminiAPI(opts: GeminiCallOptions): Promise<string> {
  const systemText = buildSystemInstruction(
    opts.ai,
    opts.persona,
    opts.services,
    opts.dataset,
    opts.quickLinks ?? [],
    opts.visitorProfile,
  )
  const body = {
    contents: buildContents(opts.history ?? [], opts.message),
    systemInstruction: { parts: [{ text: systemText }] },
    generationConfig: {
      temperature: opts.ai.temperature,
      maxOutputTokens: opts.ai.maxTokens,
    },
  }

  const base = `https://generativelanguage.googleapis.com/v1beta/models/${opts.ai.model}`
  const streamUrl = `${base}:streamGenerateContent?alt=sse&key=${opts.apiKey}`
  const generateUrl = `${base}:generateContent?key=${opts.apiKey}`

  const attempt = async (): Promise<string> => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    const onExternalAbort = () => controller.abort()
    opts.signal?.addEventListener('abort', onExternalAbort, { once: true })

    try {
      if (opts.onChunk) {
        try {
          const streamed = await streamGemini(streamUrl, body, controller.signal, opts.onChunk)
          if (streamed) return streamed
          // Empty stream — fall through to the non-streaming call below.
        } catch (err) {
          // If the caller cancelled, propagate. Otherwise fall back to non-streaming.
          if (opts.signal?.aborted) throw err
        }
      }
      return await generateGemini(generateUrl, body, controller.signal)
    } finally {
      clearTimeout(timer)
      opts.signal?.removeEventListener('abort', onExternalAbort)
    }
  }

  try {
    return await attempt()
  } catch (err) {
    // Don't retry if the caller intentionally aborted.
    if (opts.signal?.aborted) throw err
    // One retry. onChunk receives the full running total each time, so re-streaming
    // simply overwrites the bubble content — no risk of duplicated text.
    return await attempt()
  }
}
