import type { ChatbotConfig, WidgetEmbedConfig } from '@duran-chatbot/config'
import { interpolateTemplateVariables, mergeWithDefaults } from '@duran-chatbot/config'
import { callGeminiAPI } from './api'
import {
  copyIconMarkup,
  escapeHtml,
  formatMessage,
  getCSSVariables,
  getCtaCardHTML,
  getFocusInput,
  getLeadFormElements,
  getQuoteCardHTML,
  getWidgetHTML,
  populateLeadForm,
  setLeadCaptureVisibility,
  setLeadError,
  validateVisitorProfile,
} from './dom'
import { styles } from './styles'

interface Message {
  text: string
  sender: 'user' | 'ai' | 'error' | 'agent' | 'notice'
  timestamp: Date
  senderName?: string
}

interface VisitorProfile {
  name: string
  email: string
}

const VISITOR_PROFILE_STORAGE_KEY = 'duran-chatbot-visitor-profile'
const CHAT_HISTORY_STORAGE_KEY = (email: string) => `duran-chatbot-history:${email}`
const SESSION_ID_STORAGE_KEY = (email: string) => `duran-chatbot-session:${email}`

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function getOrCreateSessionId(email: string): string {
  try {
    const key = SESSION_ID_STORAGE_KEY(email)
    const existing = localStorage.getItem(key)
    if (existing) return existing
    const id = generateSessionId()
    localStorage.setItem(key, id)
    return id
  } catch {
    return generateSessionId()
  }
}

interface StoredMessage {
  role: 'user' | 'assistant' | 'admin'
  content: string
  timestamp: number
  senderName?: string
}

function loadChatHistory(email: string): StoredMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY(email))
    return raw ? (JSON.parse(raw) as StoredMessage[]) : []
  } catch {
    return []
  }
}

function saveChatHistory(email: string, history: StoredMessage[]): void {
  try {
    localStorage.setItem(CHAT_HISTORY_STORAGE_KEY(email), JSON.stringify(history))
  } catch { /* storage full — ignore */ }
}

const QUOTE_INTENT_KEYWORDS = [
  'quote', 'quotation', 'estimate', 'how much', 'cost', 'pricing', 'price', 'fee', 'fees',
  'rate', 'rates', 'charges', 'billing', 'invoice', 'payment', 'how much does',
]

function detectQuoteIntent(text: string): boolean {
  const lower = text.toLowerCase()
  return QUOTE_INTENT_KEYWORDS.some((kw) => lower.includes(kw))
}

function isMobile(): boolean {
  return window.innerWidth <= 420
}

export class ChatbotWidget {
  private host: HTMLElement | null = null
  private shadowRoot: ShadowRoot | null = null
  private config: ChatbotConfig
  private embedConfig: WidgetEmbedConfig
  private container: HTMLElement | null = null
  private chatWindow: HTMLElement | null = null
  private isOpen = false
  private messages: Message[] = []
  private chatHistory: StoredMessage[] = []
  private apiKey: string
  private visitorProfile: VisitorProfile | null = null
  private profileSlug: string
  private quoteCardShown = false
  private apiOrigin: string
  private sessionId: string = generateSessionId()
  private pollTimer: ReturnType<typeof setInterval> | null = null
  // Identifies admin replies already rendered, so polling never duplicates them.
  private seenAdminKeys = new Set<string>()
  // The post-answer call-to-action card; kept so only the latest answer shows one.
  private ctaEl: HTMLElement | null = null

  constructor(
    config: Partial<ChatbotConfig> = {},
    embedConfig: WidgetEmbedConfig = {},
    profileSlug = '',
    apiOrigin = '',
  ) {
    this.config = mergeWithDefaults(config)
    this.embedConfig = embedConfig
    this.apiKey = embedConfig.apiKey || this.config.ai.apiKey || ''
    this.visitorProfile = this.getInitialVisitorProfile()
    this.profileSlug = profileSlug
    this.apiOrigin = apiOrigin
    if (this.visitorProfile) {
      this.sessionId = getOrCreateSessionId(this.visitorProfile.email)
      this.chatHistory = loadChatHistory(this.visitorProfile.email)
    }
    this.init()
    if (this.visitorProfile && this.chatHistory.length > 0) {
      this.restoreChatHistory()
    }
    if (this.visitorProfile) {
      this.startPollingForAgentReplies()
    }
  }

  private adminKey(content: string, timestamp: number): string {
    return `${timestamp}:${content}`
  }

  private init() {
    this.createWidget()
    this.attachEventListeners()
    this.setupViewportListener()
  }

  private createWidget() {
    this.host = document.createElement('div')
    this.host.id = 'chatbot-widget-root'
    this.shadowRoot = this.host.attachShadow({ mode: 'open' })

    const styleEl = document.createElement('style')
    const pos = this.embedConfig.position || this.config.appearance.position
    styleEl.textContent = getCSSVariables(this.config.appearance, pos) + styles
    this.shadowRoot.appendChild(styleEl)

    this.container = document.createElement('div')
    this.container.className = 'cb-widget-container'
    this.container.dataset.position = this.embedConfig.position || this.config.appearance.position
    this.container.innerHTML = getWidgetHTML(
      this.config.appearance.companyName,
      interpolateTemplateVariables(
        this.config.appearance.welcomeMessage,
        this.config.appearance,
      ),
      this.config.quickLinks,
    )

    this.shadowRoot.appendChild(this.container)
    document.body.appendChild(this.host)

    this.chatWindow = this.container.querySelector('.cb-chat-window')
    this.syncLeadCaptureState()
  }

  private attachEventListeners() {
    const root = this.getRoot()
    if (!this.container || !root) return

    const toggleBtn = root.querySelector('.cb-toggle-btn')
    const closeBtn = root.querySelector('.cb-close-btn')
    const { leadForm, nameInput, emailInput, inputForm, messageInput } = getLeadFormElements(root)

    toggleBtn?.addEventListener('click', () => this.toggle())
    closeBtn?.addEventListener('click', () => this.close())

    leadForm?.addEventListener('submit', (e) => {
      e.preventDefault()

      const visitorProfile = validateVisitorProfile(nameInput?.value ?? '', emailInput?.value ?? '')

      if (!visitorProfile) {
        setLeadError(root, 'Please enter a valid name and email address.')
        return
      }

      this.visitorProfile = visitorProfile
      this.saveVisitorProfile(visitorProfile)
      this.sessionId = getOrCreateSessionId(visitorProfile.email)
      this.chatHistory = loadChatHistory(visitorProfile.email)
      this.restoreChatHistory()
      this.startPollingForAgentReplies()
      setLeadError(root, '')
      setLeadCaptureVisibility(root, visitorProfile)
      getFocusInput(root)?.focus()
    })

    inputForm?.addEventListener('submit', (e) => {
      e.preventDefault()
      const text = messageInput?.value.trim()
      if (text) {
        this.sendMessage(text)
        if (messageInput) {
          messageInput.value = ''
        }
      }
    })

    // Action menu (configurable task buttons)
    const menuBtn = root.querySelector<HTMLButtonElement>('.cb-menu-btn')
    const actionMenu = root.querySelector<HTMLElement>('.cb-action-menu')

    menuBtn?.addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggleActionMenu()
    })

    actionMenu?.addEventListener('click', (e) => {
      const item = (e.target as HTMLElement).closest<HTMLElement>('.cb-action-item')
      if (!item) return
      const id = item.dataset.actionId
      const link = this.config.quickLinks.find((l) => l.id === id)
      this.closeActionMenu()
      if (link) this.handleActionClick(link)
    })

    // Close the popup when clicking elsewhere inside the widget.
    root.addEventListener('click', (e) => {
      if (!actionMenu || actionMenu.classList.contains('cb-hidden')) return
      const target = e.target as HTMLElement
      if (target.closest('.cb-action-menu') || target.closest('.cb-menu-btn')) return
      this.closeActionMenu()
    })

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        if (actionMenu && !actionMenu.classList.contains('cb-hidden')) {
          this.closeActionMenu()
          return
        }
        this.close()
      }
    })

    // Click anywhere outside the widget (page background) to close the chat.
    // composedPath() includes the shadow host for any click inside the widget,
    // so clicks on the toggle, chat window, menu, etc. never trigger this.
    document.addEventListener('click', (e) => {
      if (!this.isOpen || isMobile()) return
      if (this.host && !e.composedPath().includes(this.host)) {
        this.close()
      }
    })

    const openByDefault = this.embedConfig.openByDefault ?? this.config.behavior.openByDefault
    if (openByDefault) {
      // Defer until the current mount work is complete so hosts such as
      // WordPress render the expanded state reliably after async config loading.
      queueMicrotask(() => this.open())
    } else if (this.config.behavior.autoOpenDelay > 0) {
      setTimeout(() => this.open(), this.config.behavior.autoOpenDelay * 1000)
    }
  }

  private toggle() {
    if (this.isOpen) this.close()
    else this.open()
  }

  /** Open the chat window (also used by hosts to start with the chat visible). */
  open() {
    const root = this.getRoot()

    // Re-warm the backend the moment the user opens the chat — they're about to send a
    // message, so this hides any remaining cold-start latency on chat-log / quote-request.
    this.warmUpBackend()

    this.isOpen = true
    this.container?.classList.add('cb-open')
    this.chatWindow?.setAttribute('aria-hidden', 'false')
    root?.querySelector('.cb-toggle-btn')?.setAttribute('aria-label', 'Close chat')

    if (isMobile()) {
      document.body.style.overflow = 'hidden'
    }

    const input = this.visitorProfile
      ? (root ? getFocusInput(root) : null)
      : root?.querySelector<HTMLInputElement>('.cb-lead-name')

    setTimeout(() => input?.focus(), 100)
  }

  /** Close the chat window back to the floating launcher. */
  close() {
    this.isOpen = false
    this.container?.classList.remove('cb-open')
    this.chatWindow?.setAttribute('aria-hidden', 'true')
    this.getRoot()?.querySelector('.cb-toggle-btn')?.setAttribute('aria-label', 'Open chat')
    document.body.style.overflow = ''
  }

  /**
   * Pull human contact details (email / phone) from a Dataset entry the admin
   * tagged as contact info — used as a graceful fallback when the AI is unavailable.
   * Matches on category, keywords, or title containing "contact".
   */
  private getContactInfo(): string | null {
    const dataset = this.config.dataset ?? []
    const entry = dataset.find((e) => {
      const category = (e.category ?? '').toLowerCase()
      const title = (e.title ?? '').toLowerCase()
      const keywords = (e.keywords ?? []).map((k) => k.toLowerCase())
      return (
        category.includes('contact') ||
        title.includes('contact') ||
        keywords.some((k) => k.includes('contact'))
      )
    })
    const content = entry?.content?.trim()
    return content ? content : null
  }

  /**
   * Friendly, non-technical message shown instead of raw errors (failed API, missing
   * key, bad model, network issues). Includes contact details when configured.
   */
  private buildProblemMessage(): string {
    const base =
      "Sorry — I'm having trouble responding right now. We're on it!"
    const contact = this.getContactInfo()
    if (contact) {
      return `${base}\n\nIn the meantime, please reach us directly and we'll be glad to help:\n\n${contact}`
    }
    return `${base} Please try again in a few moments.`
  }

  private async sendMessage(text: string) {
    if (!this.apiKey) {
      // Never surface "API key not configured" to a visitor — show a friendly notice.
      console.error('Chatbot: API key not configured')
      this.addMessage(text, 'user')
      this.addMessage(this.buildProblemMessage(), 'notice')
      return
    }

    const hasQuoteIntent =
      this.config.behavior.enableQuoteRequest &&
      !this.quoteCardShown &&
      detectQuoteIntent(text)

    // Capture prior turns BEFORE adding the current message so the model gets context.
    const history = this.messages
      .filter((m) => m.sender === 'user' || m.sender === 'ai')
      .map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }))

    // Drop the previous answer's CTA — it should only sit under the latest reply.
    this.ctaEl?.remove()
    this.ctaEl = null

    this.addMessage(text, 'user')
    this.setLoading(true)

    const inquiryId = crypto.randomUUID()
    this.logToServer(text, '', inquiryId)
    const bubble = this.createStreamingBubble()

    try {
      const response = await callGeminiAPI({
        message: text,
        ai: this.config.ai,
        persona: this.config.persona,
        apiKey: this.apiKey,
        services: this.config.services,
        dataset: this.config.dataset,
        appearance: this.config.appearance,
        quickLinks: this.config.quickLinks,
        history,
        visitorProfile: this.visitorProfile ?? undefined,
        onChunk: (fullText) => bubble.update(fullText),
      })

      bubble.finalize(response)

      this.persistExchange(text, response)
      this.logToServer(text, response, inquiryId)

      if (hasQuoteIntent) {
        this.showQuoteCard()
      }

      this.renderAfterAnswerCta()
    } catch (error) {
      console.error('Chatbot API error:', error)
      bubble.remove()
      this.addMessage(this.buildProblemMessage(), 'notice')
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * Create an AI message bubble that shows a typing indicator, then streams text into
   * itself as chunks arrive and renders the final formatted markdown on completion.
   */
  private createStreamingBubble() {
    const messagesContainer = this.getRoot()?.querySelector('.cb-messages')
    const msgEl = document.createElement('div')
    msgEl.className = 'cb-message cb-ai-message'
    msgEl.innerHTML = '<div class="cb-spinner"></div>'
    messagesContainer?.appendChild(msgEl)

    const scrollToBottom = () => {
      if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight
    }
    scrollToBottom()

    return {
      update: (fullText: string) => {
        // Plain, escaped text while streaming — avoids re-parsing partial markdown per chunk.
        msgEl.innerHTML = `<p>${escapeHtml(fullText)}</p>`
        scrollToBottom()
      },
      finalize: (fullText: string) => {
        const copyBtn = `<button class="cb-copy-btn" aria-label="Copy message">${copyIconMarkup}</button>`
        msgEl.innerHTML = formatMessage(fullText) + copyBtn

        const msg: Message = { text: fullText, sender: 'ai', timestamp: new Date() }
        this.messages.push(msg)

        if (this.config.behavior.showTimestamps) {
          const time = document.createElement('time')
          time.className = 'cb-timestamp'
          time.textContent = msg.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
          msgEl.appendChild(time)
        }

        msgEl.querySelector('.cb-copy-btn')?.addEventListener('click', () => this.copyToClipboard(fullText))
        scrollToBottom()
      },
      remove: () => {
        msgEl.remove()
      },
    }
  }

  private persistExchange(userMessage: string, aiResponse: string): void {
    if (!this.visitorProfile) return
    const now = Date.now()
    this.chatHistory.push(
      { role: 'user', content: userMessage, timestamp: now },
      { role: 'assistant', content: aiResponse, timestamp: now },
    )
    saveChatHistory(this.visitorProfile.email, this.chatHistory)
  }

  /**
   * Poll the server for admin/sales ("middleman") replies and render any new ones
   * inline so the visitor sees a human response live, alongside the AI messages.
   */
  private startPollingForAgentReplies(): void {
    if (this.pollTimer || !this.visitorProfile) return

    // Seed the seen-set from already-rendered admin replies so we never duplicate.
    for (const m of this.chatHistory) {
      if (m.role === 'admin') this.seenAdminKeys.add(this.adminKey(m.content, m.timestamp))
    }

    void this.pollForAgentReplies()
    this.pollTimer = setInterval(() => void this.pollForAgentReplies(), 12_000)
  }

  private async pollForAgentReplies(): Promise<void> {
    if (!this.visitorProfile) return
    const origin = this.apiOrigin || window.location.origin
    const profile = this.profileSlug || 'duran-schulze'
    try {
      const res = await fetch(
        `${origin}/api/messages?profile=${encodeURIComponent(profile)}&sessionId=${encodeURIComponent(this.sessionId)}`,
      )
      if (!res.ok) return
      const data = (await res.json()) as {
        messages?: Array<{ role: string; content: string; senderName?: string | null; timestamp: string }>
      }
      const messages = data.messages ?? []
      for (const m of messages) {
        if (m.role !== 'admin') continue
        const ts = new Date(m.timestamp).getTime()
        const key = this.adminKey(m.content, ts)
        if (this.seenAdminKeys.has(key)) continue
        this.seenAdminKeys.add(key)
        this.addMessage(m.content, 'agent', m.senderName ?? undefined)
        if (this.visitorProfile) {
          this.chatHistory.push({
            role: 'admin',
            content: m.content,
            timestamp: ts,
            senderName: m.senderName ?? undefined,
          })
          saveChatHistory(this.visitorProfile.email, this.chatHistory)
        }
      }
    } catch {
      /* polling is best-effort — network blips are fine */
    }
  }

  private warmUpBackend(): void {
    const origin = this.apiOrigin || window.location.origin
    try {
      void fetch(`${origin}/api/warmup`, { method: 'GET', keepalive: true }).catch(() => {})
    } catch {
      /* warmup is best-effort */
    }
  }

  private logToServer(userMessage: string, aiResponse: string, requestId: string): void {
    const origin = this.apiOrigin || window.location.origin
    // Reuse the same id/body on transport retries to prevent duplicate alerts.
    const body = JSON.stringify({
      profile: this.profileSlug || 'duran-schulze',
      requestId,
      sessionId: this.sessionId,
      userName: this.visitorProfile?.name ?? '',
      userEmail: this.visitorProfile?.email ?? '',
      userMessage,
      aiResponse,
    })
    const submit = async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const response = await fetch(`${origin}/api/chat-log`, {
            method: 'POST',
            // Browsers cap outstanding keepalive bodies at roughly 64 KiB.
            keepalive: new TextEncoder().encode(body).byteLength < 60000,
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(30000),
            body,
          })
          if (response.ok) return
          if (response.status < 500) { console.warn('Chat log rejected:', response.status); return }
        } catch { /* Transient transport failure: retry the same inquiry id. */ }
        if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** attempt))
      }
      console.warn('Chat log unavailable after retries')
    }
    void submit()
  }

  private restoreChatHistory(): void {
    if (this.chatHistory.length === 0) return
    const messagesContainer = this.getRoot()?.querySelector('.cb-messages')
    if (!messagesContainer) return
    for (const msg of this.chatHistory) {
      const sender: Message['sender'] =
        msg.role === 'user' ? 'user' : msg.role === 'admin' ? 'agent' : 'ai'
      const existing: Message = {
        text: msg.content,
        sender,
        timestamp: new Date(msg.timestamp),
        senderName: msg.senderName,
      }
      this.messages.push(existing)
      const msgEl = document.createElement('div')
      msgEl.className = `cb-message cb-${sender}-message`
      const showCopy = sender === 'ai' || sender === 'agent'
      const copyBtn = showCopy
        ? `<button class="cb-copy-btn" aria-label="Copy message">${copyIconMarkup}</button>`
        : ''
      const label =
        sender === 'agent'
          ? `<span class="cb-agent-label">${escapeHtml(this.getAgentDisplayName(msg.senderName))}</span>`
          : ''
      const formatted = formatMessage(msg.content)
      msgEl.innerHTML = label + formatted + copyBtn
      if (showCopy) {
        msgEl.querySelector('.cb-copy-btn')?.addEventListener('click', () => this.copyToClipboard(msg.content))
      }
      messagesContainer.appendChild(msgEl)
    }
    messagesContainer.scrollTop = messagesContainer.scrollHeight

    // Re-show the CTA under the last reply if the conversation ended on an answer.
    const lastRole = this.chatHistory[this.chatHistory.length - 1]?.role
    if (lastRole === 'assistant' || lastRole === 'admin') {
      this.renderAfterAnswerCta()
    }
  }

  /**
   * Name shown on a human (admin) reply. Prefers the configured persona so the
   * conversation reads as one consistent voice — never the admin's login.
   */
  private getAgentDisplayName(stored?: string): string {
    const persona = this.config.persona
    if (persona?.enabled && persona.personaName?.trim()) {
      return persona.personaName.trim()
    }
    if (stored && stored.trim() && stored.trim().toLowerCase() !== 'admin') {
      return stored.trim()
    }
    return this.config.appearance.companyName?.trim() || 'Support'
  }

  private addMessage(text: string, sender: 'user' | 'ai' | 'error' | 'agent' | 'notice', senderName?: string) {
    const msg: Message = { text, sender, timestamp: new Date(), senderName }
    this.messages.push(msg)

    const messagesContainer = this.getRoot()?.querySelector('.cb-messages')
    if (!messagesContainer) return

    const msgEl = document.createElement('div')
    msgEl.className = `cb-message cb-${sender}-message`

    // AI and human (admin) replies both get a copy button.
    const showCopy = sender === 'ai' || sender === 'agent'
    const copyBtn = showCopy
      ? `<button class="cb-copy-btn" aria-label="Copy message">${copyIconMarkup}</button>`
      : ''

    const label =
      sender === 'agent'
        ? `<span class="cb-agent-label">${escapeHtml(this.getAgentDisplayName(senderName))}</span>`
        : ''
    // Format (linkify / line breaks) for assistant, agent, and notice bubbles.
    const useRichFormat = sender !== 'error'
    const formatted = useRichFormat ? formatMessage(text) : `<p>${escapeHtml(text)}</p>`
    msgEl.innerHTML = label + formatted + copyBtn

    if (this.config.behavior.showTimestamps) {
      const time = document.createElement('time')
      time.className = 'cb-timestamp'
      time.textContent = msg.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      msgEl.appendChild(time)
    }

    messagesContainer.appendChild(msgEl)
    messagesContainer.scrollTop = messagesContainer.scrollHeight

    if (showCopy) {
      const btn = msgEl.querySelector('.cb-copy-btn')
      btn?.addEventListener('click', () => this.copyToClipboard(text))
    }
  }

  private setLoading(loading: boolean) {
    const root = this.getRoot()
    const btn = root?.querySelector('.cb-send-btn') as HTMLButtonElement | null
    const input = root?.querySelector('.cb-input') as HTMLInputElement | null
    const leadButton = root?.querySelector('.cb-lead-submit') as HTMLButtonElement | null
    const nameInput = root?.querySelector('.cb-lead-name') as HTMLInputElement | null
    const emailInput = root?.querySelector('.cb-lead-email') as HTMLInputElement | null

    if (btn) {
      btn.disabled = loading
      btn.innerHTML = loading
        ? `<div class="cb-spinner"></div>`
        : `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`
    }

    if (input) {
      input.disabled = loading
    }

    if (leadButton) {
      leadButton.disabled = loading
    }

    if (nameInput) {
      nameInput.disabled = loading
    }

    if (emailInput) {
      emailInput.disabled = loading
    }
  }

  private async copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  private getInitialVisitorProfile(): VisitorProfile | null {
    const embeddedUser = this.embedConfig.user

    if (embeddedUser?.name && embeddedUser?.email) {
      const visitorProfile = { name: embeddedUser.name, email: embeddedUser.email }
      this.saveVisitorProfile(visitorProfile)
      return visitorProfile
    }

    try {
      const rawValue = window.localStorage.getItem(VISITOR_PROFILE_STORAGE_KEY)

      if (!rawValue) {
        return null
      }

      const parsedValue = JSON.parse(rawValue) as Partial<VisitorProfile>

      if (typeof parsedValue.name === 'string' && typeof parsedValue.email === 'string') {
        return {
          name: parsedValue.name,
          email: parsedValue.email,
        }
      }
    } catch (error) {
      console.error('Failed to load visitor profile:', error)
    }

    return null
  }

  private saveVisitorProfile(visitorProfile: VisitorProfile) {
    try {
      window.localStorage.setItem(VISITOR_PROFILE_STORAGE_KEY, JSON.stringify(visitorProfile))
    } catch (error) {
      console.error('Failed to save visitor profile:', error)
    }
  }

  private syncLeadCaptureState() {
    const root = this.getRoot()
    if (!root) return

    if (this.visitorProfile) {
      populateLeadForm(this.visitorProfile, root)
    }

    setLeadCaptureVisibility(root, this.visitorProfile)
    setLeadError(root, '')
  }

  private setupViewportListener() {
    if (typeof window === 'undefined' || !window.visualViewport) return

    const onResize = () => {
      if (!this.isOpen || !isMobile()) return
      const vv = window.visualViewport!
      const keyboardHeight = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      const host = this.host
      if (host) {
        host.style.setProperty('--cb-keyboard-offset', `${keyboardHeight}px`)
      }

      if (keyboardHeight > 0) {
        const messagesEl = this.getRoot()?.querySelector<HTMLElement>('.cb-messages')
        if (messagesEl) {
          setTimeout(() => {
            messagesEl.scrollTop = messagesEl.scrollHeight
          }, 50)
        }
      }
    }

    window.visualViewport.addEventListener('resize', onResize)
    window.visualViewport.addEventListener('scroll', onResize)
  }

  // ── Action menu ───────────────────────────────────────────────
  private toggleActionMenu() {
    const menu = this.getRoot()?.querySelector<HTMLElement>('.cb-action-menu')
    if (!menu) return
    if (menu.classList.contains('cb-hidden')) this.openActionMenu()
    else this.closeActionMenu()
  }

  private openActionMenu() {
    const root = this.getRoot()
    root?.querySelector('.cb-action-menu')?.classList.remove('cb-hidden')
    root?.querySelector('.cb-menu-btn')?.setAttribute('aria-expanded', 'true')
  }

  private closeActionMenu() {
    const root = this.getRoot()
    root?.querySelector('.cb-action-menu')?.classList.add('cb-hidden')
    root?.querySelector('.cb-menu-btn')?.setAttribute('aria-expanded', 'false')
  }

  /**
   * Render the post-answer call-to-action card (e.g. "Book a Consultation") under
   * the most recent AI reply. Only one CTA exists at a time — it follows the latest answer.
   */
  private renderAfterAnswerCta() {
    this.ctaEl?.remove()
    this.ctaEl = null

    const buttons = (this.config.quickLinks ?? []).filter((l) => l.showAfterAnswer)
    if (buttons.length === 0) return

    const messagesContainer = this.getRoot()?.querySelector('.cb-messages')
    if (!messagesContainer) return

    const heading = this.config.behavior.ctaHeading?.trim() || 'Ready to take the next step?'
    const wrap = document.createElement('div')
    wrap.innerHTML = getCtaCardHTML(buttons, heading)
    const card = wrap.firstElementChild as HTMLElement | null
    if (!card) return

    card.addEventListener('click', (e) => {
      const item = (e.target as HTMLElement).closest<HTMLElement>('.cb-cta-btn')
      if (!item) return
      const link = this.config.quickLinks.find((l) => l.id === item.dataset.actionId)
      if (link) this.handleActionClick(link)
    })

    messagesContainer.appendChild(card)
    messagesContainer.scrollTop = messagesContainer.scrollHeight
    this.ctaEl = card
  }

  /** Dispatch a configurable action button by its type. */
  private handleActionClick(link: { actionType?: string; url?: string; prompt?: string; label: string }) {
    const type = link.actionType ?? 'link'
    if (type === 'link') {
      if (link.url) window.open(link.url, '_blank', 'noopener,noreferrer')
      return
    }
    if (type === 'prompt') {
      const text = (link.prompt ?? link.label).trim()
      if (text) void this.sendMessage(text)
      return
    }
    if (type === 'quote') {
      this.showQuoteCard(true)
    }
  }

  private showQuoteCard(force = false) {
    if (this.quoteCardShown && !force) return
    this.quoteCardShown = true

    const messagesContainer = this.getRoot()?.querySelector('.cb-messages')
    if (!messagesContainer) return

    const cardEl = document.createElement('div')
    cardEl.innerHTML = getQuoteCardHTML(this.visitorProfile?.name ?? '')
    const card = cardEl.firstElementChild as HTMLElement | null
    if (!card) return

    messagesContainer.appendChild(card)
    messagesContainer.scrollTop = messagesContainer.scrollHeight

    const submitBtn = card.querySelector<HTMLButtonElement>('.cb-quote-submit')
    const textarea = card.querySelector<HTMLTextAreaElement>('.cb-quote-textarea')
    const errorEl = card.querySelector<HTMLElement>('.cb-quote-error')

    submitBtn?.addEventListener('click', async () => {
      const service = textarea?.value.trim() ?? ''
      if (!service) {
        if (errorEl) errorEl.textContent = 'Please describe what you need help with.'
        return
      }
      if (errorEl) errorEl.textContent = ''
      if (submitBtn) submitBtn.disabled = true
      if (submitBtn) submitBtn.textContent = 'Sending…'

      await this.handleQuoteSubmit(service, card)
    })
  }

  private async handleQuoteSubmit(service: string, card: HTMLElement) {
    const profile = this.visitorProfile
    const submitBtn = card.querySelector<HTMLButtonElement>('.cb-quote-submit')
    const errorEl = card.querySelector<HTMLElement>('.cb-quote-error')

    try {
      const origin = this.apiOrigin || window.location.origin
      const res = await fetch(`${origin}/api/quote-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile?.name ?? '',
          email: profile?.email ?? '',
          message: service,
          service,
          profile: this.profileSlug || undefined,
          // Every quote entry point uses the same shared email thread: the
          // visitor is addressed directly and the configured team is CC'd.
          emailVisitor: true,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(data.error || `Request failed (${res.status})`)
      }

      const successEl = document.createElement('div')
      successEl.className = 'cb-quote-success'
      successEl.textContent =
        '✓ Sent! Check your email — our team is included and will follow up shortly.'
      card.replaceWith(successEl)

      const messagesContainer = this.getRoot()?.querySelector<HTMLElement>('.cb-messages')
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight
      }
    } catch (err) {
      console.error('Quote request failed:', err)
      if (errorEl) {
        errorEl.textContent = err instanceof Error ? err.message : 'Failed to send. Please try again.'
      }
      if (submitBtn) {
        submitBtn.disabled = false
        submitBtn.textContent = 'Send request'
      }
    }
  }

  private getRoot() {
    return this.shadowRoot ?? this.container
  }

  destroy() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
    document.body.style.overflow = ''
    this.host?.remove()
    this.shadowRoot = null
    this.host = null
    this.container = null
    this.chatWindow = null
  }
}
