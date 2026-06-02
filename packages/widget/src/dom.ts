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
    :host {
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

const menuIconMarkup = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
`

/** The "☰" trigger button shown in the composer (only when there are actions to show). */
function getMenuTriggerHTML(quickLinks: QuickLink[]): string {
  if (quickLinks.length === 0) {
    return ''
  }
  return `
    <button type="button" class="cb-menu-btn" aria-label="Open quick actions" aria-expanded="false">
      ${menuIconMarkup}
    </button>
  `
}

/** The popup list of configurable action buttons, hidden until the trigger is clicked. */
function getActionMenuHTML(quickLinks: QuickLink[]): string {
  if (quickLinks.length === 0) {
    return ''
  }

  return `
    <div class="cb-action-menu cb-hidden" role="menu" aria-label="Quick actions">
      ${quickLinks
        .map(
          (link) => `
            <button
              type="button"
              class="cb-action-item"
              role="menuitem"
              data-action-id="${escapeAttribute(link.id)}"
            >
              ${escapeHtml(link.label)}
            </button>
          `,
        )
        .join('')}
    </div>
  `
}

/** A call-to-action card rendered after an AI answer (e.g. "Book a Consultation"). */
export function getCtaCardHTML(buttons: QuickLink[], heading: string): string {
  if (buttons.length === 0) return ''
  return `
    <div class="cb-cta-card" role="group" aria-label="Next steps">
      ${heading ? `<p class="cb-cta-heading">${escapeHtml(heading)}</p>` : ''}
      <div class="cb-cta-actions">
        ${buttons
          .map(
            (b) => `
              <button
                type="button"
                class="cb-cta-btn"
                data-action-id="${escapeAttribute(b.id)}"
              >
                ${escapeHtml(b.label)}
              </button>
            `,
          )
          .join('')}
      </div>
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
          ${getActionMenuHTML(quickLinks)}

          <form class="cb-input-form">
            ${getMenuTriggerHTML(quickLinks)}
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

export function populateLeadForm(visitorProfile: VisitorProfile, root: ParentNode) {
  const nameInput = root.querySelector<HTMLInputElement>('.cb-lead-name')
  const emailInput = root.querySelector<HTMLInputElement>('.cb-lead-email')

  if (nameInput) {
    nameInput.value = visitorProfile.name
  }

  if (emailInput) {
    emailInput.value = visitorProfile.email
  }
}

export function setLeadCaptureVisibility(root: ParentNode, visitorProfile: VisitorProfile | null) {
  const leadForm = root.querySelector<HTMLElement>('.cb-lead-form')
  const chatInputs = root.querySelector<HTMLElement>('.cb-chat-inputs')

  if (!leadForm || !chatInputs) {
    return
  }

  leadForm.classList.toggle('cb-hidden', Boolean(visitorProfile))
  chatInputs.classList.toggle('cb-hidden', !visitorProfile)
}

export function setLeadError(root: ParentNode, message: string) {
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

export function getFocusInput(root: ParentNode): HTMLInputElement | null {
  return root.querySelector<HTMLInputElement>('.cb-input')
}

export function getLeadFormElements(root: ParentNode) {
  return {
    leadForm: root.querySelector<HTMLFormElement>('.cb-lead-form'),
    nameInput: root.querySelector<HTMLInputElement>('.cb-lead-name'),
    emailInput: root.querySelector<HTMLInputElement>('.cb-lead-email'),
    inputForm: root.querySelector<HTMLFormElement>('.cb-input-form'),
    messageInput: root.querySelector<HTMLInputElement>('.cb-input'),
  }
}

export function getQuoteCardHTML(visitorName: string): string {
  const greeting = visitorName ? `, ${escapeHtml(visitorName)}` : ''
  return `
    <div class="cb-quote-card" role="region" aria-label="Quote request">
      <p class="cb-quote-card-title">Request a Quote</p>
      <p class="cb-quote-card-desc">Hi${greeting}! Briefly describe what you need help with and we'll follow up with a personalised quote.</p>
      <textarea
        class="cb-quote-textarea"
        placeholder="e.g. I need help with an employment dispute and want to know the estimated cost."
        rows="3"
        aria-label="Describe what you need"
      ></textarea>
      <p class="cb-quote-error" aria-live="polite"></p>
      <button type="button" class="cb-quote-submit">Send request</button>
    </div>
  `
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function escapeStr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function processInline(raw: string): string {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = raw.split(urlRegex)
  return parts
    .map((part, i) => {
      if (i % 2 === 1) {
        const safe = escapeStr(part)
        return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${safe}</a>`
      }
      let s = escapeStr(part)
      s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      s = s.replace(/\*([^*\s][^*]*)\*/g, '<em>$1</em>')
      // Make email addresses clickable (handy for the contact fallback).
      s = s.replace(
        /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
        '<a href="mailto:$1">$1</a>',
      )
      return s
    })
    .join('')
}

export function formatMessage(text: string): string {
  const lines = text.split('\n')
  const html: string[] = []
  let inUl = false
  let inOl = false

  const closeUl = () => { if (inUl) { html.push('</ul>'); inUl = false } }
  const closeOl = () => { if (inOl) { html.push('</ol>'); inOl = false } }
  const closeLists = () => { closeUl(); closeOl() }

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      closeLists()
      continue
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/)
    if (bulletMatch) {
      closeOl()
      if (!inUl) { html.push('<ul>'); inUl = true }
      html.push(`<li>${processInline(bulletMatch[1])}</li>`)
      continue
    }

    const numberedMatch = trimmed.match(/^\d+\.\s+(.+)$/)
    if (numberedMatch) {
      closeUl()
      if (!inOl) { html.push('<ol>'); inOl = true }
      html.push(`<li>${processInline(numberedMatch[1])}</li>`)
      continue
    }

    closeLists()
    html.push(`<p>${processInline(trimmed)}</p>`)
  }

  closeLists()
  return html.join('')
}
