import type { AppearanceConfig } from '@duran-chatbot/config'
import type { QuickLink } from '@duran-chatbot/config'

interface VisitorProfile {
  name: string
  email: string
}

export const copyIconMarkup = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
`

export function getCSSVariables(appearance: AppearanceConfig, position: string): string {
  return `
    :root {
      --cb-primary: ${appearance.primaryColor};
      --cb-accent: ${appearance.accentColor};
      --cb-bg: ${appearance.backgroundColor};
      --cb-text: ${appearance.textColor};
      --cb-radius: ${appearance.borderRadius}px;
      --cb-position: ${position === 'bottom-left' ? '20px auto auto 20px' : '20px 20px auto auto'};
      --cb-chat-left: ${position === 'bottom-left' ? '20px' : 'auto'};
      --cb-chat-right: ${position === 'bottom-left' ? 'auto' : '20px'};
    }
  `
}

function escapeAttribute(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function getQuickLinksHTML(quickLinks: QuickLink[]): string {
  if (quickLinks.length === 0) {
    return ''
  }

  const topLinks = quickLinks.slice(0, 2)

  return `
    <div class="cb-quick-links" aria-label="Quick actions">
      ${topLinks
        .map(
          (link) => `
            <a
              class="cb-quick-link"
              href="${escapeAttribute(link.url)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              ${escapeHtml(link.label)}
            </a>
          `,
        )
        .join('')}
    </div>
  `
}

export function getWidgetHTML(companyName: string, welcomeMessage: string, quickLinks: QuickLink[]): string {
  return `
    <button class="cb-toggle-btn" aria-label="Open chat">
      <svg class="cb-icon-message" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        <path d="M7 9h10v2H7zm0-3h10v2H7z" opacity=".5"/>
      </svg>
      <svg class="cb-icon-close" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>

    <div class="cb-chat-window" role="dialog" aria-label="Chat window" aria-hidden="true">
      <div class="cb-header">
        <h3>${companyName}</h3>
        <button class="cb-close-btn" aria-label="Close chat">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <div class="cb-messages" role="log" aria-live="polite">
        <div class="cb-message cb-ai-message">
          <p>${welcomeMessage}</p>
        </div>
      </div>

      <div class="cb-composer">
        <form class="cb-lead-form" novalidate>
          <p class="cb-lead-title">Before we begin, please share your details.</p>
          <div class="cb-lead-fields">
            <input
              type="text"
              class="cb-lead-input cb-lead-name"
              placeholder="Your name"
              aria-label="Your name"
              autocomplete="name"
            />
            <input
              type="email"
              class="cb-lead-input cb-lead-email"
              placeholder="Email address"
              aria-label="Email address"
              autocomplete="email"
            />
          </div>
          <p class="cb-lead-error" aria-live="polite"></p>
          <button type="submit" class="cb-lead-submit">Start chat</button>
        </form>

        <div class="cb-chat-inputs cb-hidden">
          ${getQuickLinksHTML(quickLinks)}

          <form class="cb-input-form">
            <input
              type="text"
              class="cb-input"
              placeholder="Type your message..."
              aria-label="Your message"
              autocomplete="off"
            />
            <button type="submit" class="cb-send-btn" aria-label="Send message">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  `
}

export function populateLeadForm(visitorProfile: VisitorProfile, root: HTMLElement) {
  const nameInput = root.querySelector<HTMLInputElement>('.cb-lead-name')
  const emailInput = root.querySelector<HTMLInputElement>('.cb-lead-email')

  if (nameInput) {
    nameInput.value = visitorProfile.name
  }

  if (emailInput) {
    emailInput.value = visitorProfile.email
  }
}

export function setLeadCaptureVisibility(root: HTMLElement, visitorProfile: VisitorProfile | null) {
  const leadForm = root.querySelector<HTMLElement>('.cb-lead-form')
  const chatInputs = root.querySelector<HTMLElement>('.cb-chat-inputs')

  if (!leadForm || !chatInputs) {
    return
  }

  leadForm.classList.toggle('cb-hidden', Boolean(visitorProfile))
  chatInputs.classList.toggle('cb-hidden', !visitorProfile)
}

export function setLeadError(root: HTMLElement, message: string) {
  const errorEl = root.querySelector<HTMLElement>('.cb-lead-error')

  if (errorEl) {
    errorEl.textContent = message
  }
}

export function validateVisitorProfile(name: string, email: string): VisitorProfile | null {
  const trimmedName = name.trim()
  const trimmedEmail = email.trim()

  if (!trimmedName || !trimmedEmail) {
    return null
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailPattern.test(trimmedEmail)) {
    return null
  }

  return {
    name: trimmedName,
    email: trimmedEmail,
  }
}

export function getFocusInput(root: HTMLElement): HTMLInputElement | null {
  return root.querySelector<HTMLInputElement>('.cb-input')
}

export function getLeadFormElements(root: HTMLElement) {
  return {
    leadForm: root.querySelector<HTMLFormElement>('.cb-lead-form'),
    nameInput: root.querySelector<HTMLInputElement>('.cb-lead-name'),
    emailInput: root.querySelector<HTMLInputElement>('.cb-lead-email'),
    inputForm: root.querySelector<HTMLFormElement>('.cb-input-form'),
    messageInput: root.querySelector<HTMLInputElement>('.cb-input'),
  }
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
