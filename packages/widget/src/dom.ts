import type { AppearanceConfig } from '@duran-chatbot/config'
import { formatRichMessage, safePrivacyLinkUrl, splitPrivacyNoticeText } from '@duran-chatbot/config'
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
  // Saved appearance values are authoritative — the widget renders exactly what the
  // profile configures. Do not reintroduce a palette remap here: an earlier one
  // replaced every profile still matching the legacy shipped palette with the dark
  // theme, so a saved white background rendered black and could not be corrected
  // from the appearance editor without also changing the primary and text colors.
  const background = appearance.backgroundColor
  const foreground = appearance.textColor
  return `
    :host {
      --cb-primary: ${appearance.primaryColor};
      --cb-accent: ${appearance.accentColor};
      --cb-bg: ${background};
      --cb-text: ${foreground};
      --cb-card: ${background.toLowerCase() === '#171721' ? '#1e1e2a' : `color-mix(in srgb, ${background} 94%, ${foreground})`};
      --cb-secondary: ${background.toLowerCase() === '#171721' ? '#272735' : `color-mix(in srgb, ${background} 88%, ${foreground})`};
      --cb-muted: ${foreground.toLowerCase() === '#ededf3' ? '#c3c3cc' : foreground};
      --cb-border: ${background.toLowerCase() === '#171721' ? '#70707d' : `color-mix(in srgb, ${foreground} 45%, ${background})`};
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

/**
 * The proactive greeting bubble: a small chat-shaped bubble that appears beside
 * the launcher before the chat is opened. Clicking it opens the chat; the small
 * dismiss button hides it for the rest of the page visit.
 */
function getProactiveGreetingHTML(message: string): string {
  if (!message) return ''
  return `
    <div class="cb-teaser" role="status">
      <button type="button" class="cb-teaser-open" aria-label="Open chat">
        <span class="cb-teaser-text">${escapeHtml(message)}</span>
      </button>
      <button type="button" class="cb-teaser-dismiss" aria-label="Dismiss greeting">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
  `
}

/** Consent checkbox shown under the lead form's name and email fields. */
export interface PrivacyNoticeOptions {
  /** Consent sentence; the {{link}} token is replaced by the privacy link */
  text: string
  /** Visible text of the privacy link */
  linkLabel: string
  /** Destination of the privacy link */
  url: string
}

/** Only http(s) destinations become anchors; anything else renders as plain text. */
function getPrivacyNoticeHTML(notice: PrivacyNoticeOptions | null): string {
  if (!notice) return ''

  const label = notice.linkLabel.trim()
  const url = safePrivacyLinkUrl(notice.url)
  const link = label && url
    ? `<a href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`
    : escapeHtml(label)

  // Escape each part, then stitch the anchor in — so the sentence stays inert
  // and only our anchor markup survives.
  const text = notice.text.trim()
  const parts = splitPrivacyNoticeText(text)
  const body = text
    ? parts
        .map((part, index) =>
          index < parts.length - 1 ? `${escapeHtml(part)}${link}` : escapeHtml(part),
        )
        .join('')
    : link

  if (!body) return ''

  return `
    <label class="cb-lead-consent">
      <input type="checkbox" class="cb-lead-consent-input" />
      <span class="cb-lead-consent-text">${body}</span>
    </label>
  `
}

export interface WidgetHTMLOptions {
  companyName: string
  welcomeMessage: string
  quickLinks: QuickLink[]
  /** Proactive greeting bubble copy; empty string disables it */
  proactiveGreeting?: string
  /** Consent checkbox for the lead form; null disables it */
  privacyNotice?: PrivacyNoticeOptions | null
}

export function getWidgetHTML({
  companyName,
  welcomeMessage,
  quickLinks,
  proactiveGreeting = '',
  privacyNotice = null,
}: WidgetHTMLOptions): string {
  return `
    ${getProactiveGreetingHTML(proactiveGreeting)}

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
          ${formatRichMessage(welcomeMessage)}
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
          ${getPrivacyNoticeHTML(privacyNotice)}
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
    // Present only when the privacy notice is enabled in the config.
    consentInput: root.querySelector<HTMLInputElement>('.cb-lead-consent-input'),
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

export { formatRichMessage as formatMessage } from '@duran-chatbot/config';
