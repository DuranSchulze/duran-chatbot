import type { ChatbotConfig, WidgetEmbedConfig } from '@duran-chatbot/config'
import { mergeWithDefaults } from '@duran-chatbot/config'
import { callGeminiAPI } from './api'
import {
  copyIconMarkup,
  escapeHtml,
  getCSSVariables,
  getFocusInput,
  getLeadFormElements,
  getWidgetHTML,
  populateLeadForm,
  setLeadCaptureVisibility,
  setLeadError,
  validateVisitorProfile,
} from './dom'
import { styles } from './styles'

interface Message {
  text: string
  sender: 'user' | 'ai' | 'error'
  timestamp: Date
}

interface VisitorProfile {
  name: string
  email: string
}

const VISITOR_PROFILE_STORAGE_KEY = 'duran-chatbot-visitor-profile'

export class ChatbotWidget {
  private host: HTMLElement | null = null
  private shadowRoot: ShadowRoot | null = null
  private config: ChatbotConfig
  private embedConfig: WidgetEmbedConfig
  private container: HTMLElement | null = null
  private chatWindow: HTMLElement | null = null
  private isOpen = false
  private messages: Message[] = []
  private apiKey: string
  private visitorProfile: VisitorProfile | null = null

  constructor(config: Partial<ChatbotConfig> = {}, embedConfig: WidgetEmbedConfig = {}) {
    this.config = mergeWithDefaults(config)
    this.embedConfig = embedConfig
    this.apiKey = embedConfig.apiKey || this.config.ai.apiKey || ''
    this.visitorProfile = this.getInitialVisitorProfile()
    this.init()
  }

  private init() {
    this.createWidget()
    this.attachEventListeners()
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
      this.config.appearance.welcomeMessage,
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

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close()
      }
    })

    if (this.config.behavior.autoOpenDelay > 0) {
      setTimeout(() => this.open(), this.config.behavior.autoOpenDelay * 1000)
    }
  }

  private toggle() {
    this.isOpen ? this.close() : this.open()
  }

  private open() {
    const root = this.getRoot()

    this.isOpen = true
    this.container?.classList.add('cb-open')
    this.chatWindow?.setAttribute('aria-hidden', 'false')

    const input = this.visitorProfile
      ? (root ? getFocusInput(root) : null)
      : root?.querySelector<HTMLInputElement>('.cb-lead-name')

    setTimeout(() => input?.focus(), 100)
  }

  private close() {
    this.isOpen = false
    this.container?.classList.remove('cb-open')
    this.chatWindow?.setAttribute('aria-hidden', 'true')
  }

  private async sendMessage(text: string) {
    if (!this.apiKey) {
      this.addMessage('Error: API key not configured', 'error')
      return
    }

    this.addMessage(text, 'user')
    this.setLoading(true)

    try {
      const response = await callGeminiAPI(
        text,
        this.config.ai,
        this.apiKey,
        this.config.dataset,
        this.visitorProfile ?? undefined,
      )
      this.addMessage(response, 'ai')
    } catch (error) {
      console.error('Chatbot API error:', error)
      this.addMessage('Sorry, I encountered an error. Please try again.', 'error')
    } finally {
      this.setLoading(false)
    }
  }

  private addMessage(text: string, sender: 'user' | 'ai' | 'error') {
    const msg: Message = { text, sender, timestamp: new Date() }
    this.messages.push(msg)

    const messagesContainer = this.getRoot()?.querySelector('.cb-messages')
    if (!messagesContainer) return

    const msgEl = document.createElement('div')
    msgEl.className = `cb-message cb-${sender}-message`

    const copyBtn =
      sender === 'ai'
        ? `<button class="cb-copy-btn" aria-label="Copy message">${copyIconMarkup}</button>`
        : ''

    msgEl.innerHTML = `<p>${escapeHtml(text)}</p>${copyBtn}`

    if (this.config.behavior.showTimestamps) {
      const time = document.createElement('time')
      time.className = 'cb-timestamp'
      time.textContent = msg.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      msgEl.appendChild(time)
    }

    messagesContainer.appendChild(msgEl)
    messagesContainer.scrollTop = messagesContainer.scrollHeight

    if (sender === 'ai') {
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

  private getRoot() {
    return this.shadowRoot ?? this.container
  }

  destroy() {
    this.host?.remove()
    this.shadowRoot = null
    this.host = null
    this.container = null
    this.chatWindow = null
  }
}
