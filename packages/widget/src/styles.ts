export const styles = `
/* Chatbot Widget Styles */
:host {
  all: initial;
}

.cb-widget-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  font-family: 'arcadia', 'Inter', ui-sans-serif, system-ui, sans-serif;
  color: var(--cb-text);
}

.cb-widget-container,
.cb-widget-container *,
.cb-widget-container *::before,
.cb-widget-container *::after {
  box-sizing: border-box;
}

.cb-widget-container button,
.cb-widget-container input,
.cb-widget-container textarea,
.cb-widget-container select {
  font: inherit;
}

.cb-widget-container.cb-open {
  /* Container styles when open */
}

/* Toggle Button */
.cb-toggle-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--cb-primary);
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: none;
  display: grid;
  place-items: center;
  transition: transform 0.24s ease, box-shadow 0.24s ease, background 0.24s ease;
  z-index: 10000;
  
}

/* Stay visible while open — the icon morphs to a close (X) instead of hiding. */
.cb-widget-container.cb-open .cb-toggle-btn {
  background: var(--cb-secondary);
  color: var(--cb-text);
  animation: none;
}

.cb-toggle-btn:hover {
  transform: scale(1.08);
  box-shadow: none;
}

.cb-widget-container.cb-open .cb-toggle-btn:hover {
  transform: rotate(90deg) scale(1.08);
}

/* Both icons share the same cell and cross-fade / rotate between states. */
.cb-toggle-btn svg {
  grid-area: 1 / 1;
  width: 28px;
  height: 28px;
  transition: opacity 0.24s ease, transform 0.28s ease;
}

.cb-icon-message {
  opacity: 1;
  transform: rotate(0) scale(1);
}

.cb-icon-close {
  opacity: 0;
  transform: rotate(-90deg) scale(0.5);
}

.cb-widget-container.cb-open .cb-icon-message {
  opacity: 0;
  transform: rotate(90deg) scale(0.5);
}

.cb-widget-container.cb-open .cb-icon-close {
  opacity: 1;
  transform: rotate(0) scale(1);
}

/* Proactive greeting bubble */
.cb-teaser {
  position: fixed;
  bottom: 92px;
  right: 20px;
  max-width: min(260px, calc(100vw - 40px));
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  background: var(--cb-card);
  color: var(--cb-text);
  border: 1px solid var(--cb-border);
  border-radius: var(--cb-radius);
  box-shadow: none;
  z-index: 10000;
  opacity: 0;
  visibility: hidden;
  transform: translateY(8px) scale(0.96);
  transform-origin: bottom right;
  transition: opacity 0.28s ease, transform 0.28s ease, visibility 0.28s;
  pointer-events: none;
}

.cb-teaser.cb-visible {
  opacity: 1;
  visibility: visible;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

/* Tail pointing down at the launcher */
.cb-teaser::after {
  content: '';
  position: absolute;
  bottom: -6px;
  right: 24px;
  width: 12px;
  height: 12px;
  background: var(--cb-card);
  border-right: 1px solid var(--cb-border);
  border-bottom: 1px solid var(--cb-border);
  transform: rotate(45deg);
}

.cb-teaser-open {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.cb-teaser-text {
  display: block;
  white-space: pre-line;
  line-height: 1.45;
}

.cb-teaser-dismiss {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--cb-muted);
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
}

.cb-teaser-dismiss:hover {
  color: var(--cb-text);
  background: var(--cb-secondary);
}

.cb-teaser-dismiss svg {
  width: 12px;
  height: 12px;
}

/* The greeting has done its job once the chat is open. */
.cb-widget-container.cb-open .cb-teaser {
  display: none;
}

/* Chat Window */
.cb-chat-window {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 440px;
  max-width: calc(100vw - 40px);
  height: 600px;
  max-height: calc(100dvh - 120px);
  background: var(--cb-bg);
  border-radius: var(--cb-radius);
  box-shadow: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  opacity: 0;
  transform: scale(0.94) translateY(14px);
  pointer-events: none;
  transform-origin: bottom right;
  transition: opacity 0.28s ease, transform 0.28s ease;
  left: auto;
}

.cb-widget-container.cb-open .cb-chat-window {
  opacity: 1;
  transform: scale(1) translateY(0);
  pointer-events: auto;
}

/* Position override for left side */
@media (min-width: 420px) {
  .cb-widget-container[data-position="bottom-left"] .cb-toggle-btn,
  .cb-widget-container[data-position="bottom-left"] .cb-chat-window {
    right: auto;
    left: 20px;
  }

  .cb-widget-container[data-position="bottom-left"] .cb-teaser {
    right: auto;
    left: 20px;
    transform-origin: bottom left;
  }

  .cb-widget-container[data-position="bottom-left"] .cb-teaser::after {
    right: auto;
    left: 24px;
  }
}

/* Mobile — fullscreen chat */
@media (max-width: 420px) {
  .cb-chat-window {
    position: fixed;
    inset: 0;
    width: 100%;
    max-width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
    bottom: 0;
    right: 0;
    left: 0;
    top: 0;
    transform-origin: bottom center;
  }

  .cb-widget-container.cb-open .cb-chat-window {
    transform: scale(1) translateY(0);
  }

  .cb-composer {
    position: sticky;
    bottom: var(--cb-keyboard-offset, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .cb-header {
    padding-top: max(16px, env(safe-area-inset-top, 0px));
  }
}

/* Header */
.cb-header {
  background: var(--cb-primary);
  color: white;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.cb-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 480;
}

.cb-close-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 32px;
  transition: background 0.2s;
}

.cb-close-btn:hover {
  background: rgba(255,255,255,0.2);
}

.cb-close-btn svg {
  width: 20px;
  height: 20px;
}

/* Messages Area */
.cb-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cb-message {
  max-width: 86%;
  padding: 9px 13px;
  border-radius: 12px;
  font-size: 16px;
  line-height: 1.5;
  word-wrap: break-word;
  position: relative;
  animation: cb-message-enter 0.28s ease both;
}

.cb-message p {
  margin: 0 0 6px 0;
}

.cb-message p:last-child {
  margin-bottom: 0;
}

.cb-message ul,
.cb-message ol {
  margin: 4px 0 8px 0;
  padding-left: 20px;
}

.cb-message ul:last-child,
.cb-message ol:last-child {
  margin-bottom: 0;
}

.cb-message li {
  margin-bottom: 4px;
  line-height: 1.5;
}

.cb-message li:last-child {
  margin-bottom: 0;
}

.cb-message a {
  color: var(--cb-text);
  text-decoration: underline;
  word-break: break-all;
}

.cb-ai-message a {
  color: var(--cb-muted);
}

.cb-message a:hover {
  opacity: 0.8;
}

.cb-message strong {
  font-weight: 480;
}

.cb-message { min-width: 0; overflow-wrap: anywhere; }
.cb-message u { text-decoration: underline; }
.cb-message del { text-decoration: line-through; }
.cb-message h1, .cb-message h2, .cb-message h3,
.cb-message h4, .cb-message h5, .cb-message h6 {
  font-weight: 480; line-height: 1.5; margin: 12px 0 6px;
}
.cb-message h1 { font-size: 18px; }
.cb-message h2 { font-size: 16px; }
.cb-message h3 { font-size: 16px; }
.cb-message blockquote { border-left: 2px solid currentColor; padding-left: 10px; margin: 10px 0; }
.cb-message pre { max-width: 100%; overflow-x: auto; padding: 10px; background: #0000000a; }
.cb-message code { font-family: monospace; }
.cb-message hr { margin: 12px 0; border: 0; border-top: 1px solid currentColor; opacity: .3; }
.cb-message table { display: block; max-width: 100%; overflow-x: auto; border-collapse: collapse; }
.cb-message th, .cb-message td { border: 1px solid currentColor; padding: 5px; }

.cb-message em {
  font-style: italic;
}

.cb-user-message {
  align-self: flex-end;
  background: var(--cb-secondary);
  color: var(--cb-text);
  
}

.cb-ai-message {
  align-self: flex-start;
  background: var(--cb-card);
  color: var(--cb-text);
  
}

.cb-error-message {
  align-self: flex-start;
  background: var(--cb-card);
  color: var(--cb-muted);
  
}

/* Friendly "we're having a problem" notice (shown instead of raw errors) */
.cb-notice-message {
  align-self: flex-start;
  background: var(--cb-card);
  color: var(--cb-muted);
  border: 1px solid var(--cb-border);
  
}

.cb-notice-message a {
  color: var(--cb-muted);
  font-weight: 480;
}

/* Admin ("middleman") reply — styled exactly like an AI message for a seamless feel */
.cb-agent-message {
  align-self: flex-start;
  background: var(--cb-card);
  color: var(--cb-text);
  
}

.cb-agent-label {
  display: block;
  font-size: 11px;
  font-weight: 480;
  color: var(--cb-text);
  margin-bottom: 4px;
}

.cb-timestamp {
  display: block;
  font-size: 11px;
  opacity: 0.6;
  margin-top: 4px;
}

/* Copy button */
.cb-copy-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0,0,0,0.1);
  border: none;
  border-radius: 32px;
  padding: 4px 6px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: inherit;
}

.cb-copy-btn svg {
  width: 14px;
  height: 14px;
}

.cb-message:hover .cb-copy-btn {
  opacity: 1;
}

.cb-hidden {
  display: none !important;
}

.cb-composer {
  background: var(--cb-card);
  border-top: 1px solid var(--cb-border);
  flex-shrink: 0;
}

/* Lead form */
.cb-lead-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  animation: cb-section-enter 0.3s ease both;
}

.cb-lead-title {
  margin: 0;
  color: var(--cb-text);
  font-size: 12px;
  font-weight: 480;
  line-height: 1.5;
}

.cb-lead-fields {
  display: grid;
  gap: 8px;
}

.cb-lead-input {
  border-radius: 32px;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--cb-border);
  background: var(--cb-card);
  color: var(--cb-text);
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.cb-lead-input:focus {
  border-color: var(--cb-text);
  transform: translateY(-1px);
  box-shadow: none;
}

/* Privacy consent checkbox */
.cb-lead-consent {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--cb-muted);
  font-size: 11px;
  line-height: 1.45;
  cursor: pointer;
}

.cb-lead-consent-input {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  margin: 1px 0 0;
  accent-color: var(--cb-primary);
  cursor: pointer;
}

.cb-lead-consent-text {
  min-width: 0;
}

.cb-lead-consent-text a {
  color: var(--cb-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.cb-lead-consent-text a:hover {
  opacity: 0.85;
}

.cb-lead-error {
  min-height: 18px;
  margin: 0;
  color: var(--cb-muted);
  font-size: 11px;
  line-height: 1.4;
}

.cb-lead-submit {
  min-height: 38px;
  padding: 10px 12px;
  background: var(--cb-primary);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 480;
  letter-spacing: 0.01em;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.cb-lead-submit:hover {
  background: var(--cb-secondary);
  transform: translateY(-1px);
  box-shadow: none;
}

/* Action menu (configurable task buttons) */
.cb-chat-inputs {
  position: relative;
}

.cb-menu-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--cb-card);
  color: var(--cb-text);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s ease, color 0.2s ease;
}

.cb-menu-btn:hover,
.cb-menu-btn[aria-expanded="true"] {
  background: var(--cb-secondary);
  color: var(--cb-text);
}

.cb-menu-btn svg {
  width: 20px;
  height: 20px;
}

.cb-action-menu {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 70px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: var(--cb-card);
  border: 1px solid var(--cb-border);
  border-radius: 12px;
  box-shadow: none;
  max-height: 300px;
  overflow-y: auto;
  animation: cb-section-enter 0.18s ease both;
}

.cb-action-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 48px;
  padding: 13px 16px;
  background: var(--cb-card);
  border: 1px solid var(--cb-border);
  border-radius: 32px;
  color: var(--cb-text);
  font-size: clamp(13px, 3.6vw, 15px);
  font-weight: 480;
  line-height: 1.35;
  text-align: left;
  white-space: normal;
  word-break: break-word;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease, border-color 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease;
}

.cb-action-item::before {
  content: "";
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cb-muted);
  opacity: 0.55;
  transition: background 0.16s ease, opacity 0.16s ease;
}

.cb-action-item:hover {
  background: var(--cb-secondary);
  border-color: var(--cb-text);
  color: var(--cb-text);
  transform: translateY(-1px);
  box-shadow: none;
}

.cb-action-item:hover::before {
  background: var(--cb-card);
  opacity: 1;
}

/* Post-answer call-to-action card — tinted with the brand primary color */
.cb-cta-card {
  align-self: stretch;
  margin-top: 2px;
  padding: 9px 10px;
  /* Fallback for browsers without color-mix, then the primary tint over it. */
  background: var(--cb-card);
  border: none;
  border-radius: 12px;
  animation: cb-message-enter 0.28s ease both;
}

.cb-cta-heading {
  margin: 0 0 7px 0;
  font-size: 12px;
  font-weight: 400;
  font-style: italic;
  color: var(--cb-text);
}

.cb-cta-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cb-cta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 5px 11px;
  background: var(--cb-secondary);
  color: var(--cb-text);
  border: none;
  border-radius: 32px;
  font-size: 12px;
  font-weight: 480;
  line-height: 1.3;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.cb-cta-btn:hover {
  background: var(--cb-secondary);
  transform: translateY(-1px);
  box-shadow: none;
}

/* Input Form */
.cb-input-form {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: var(--cb-card);
  flex-shrink: 0;
  animation: cb-section-enter 0.36s ease both;
}

.cb-input {
  min-width: 0;
  background: transparent;
  color: var(--cb-text);
  flex: 1;
  padding: 10px 16px;
  border: 1px solid var(--cb-border);
  border-radius: 32px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.cb-input:focus {
  border-color: var(--cb-text);
  transform: translateY(-1px);
  box-shadow: none;
}

.cb-input:disabled {
  background: var(--cb-card);
  cursor: not-allowed;
}

.cb-send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--cb-primary);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  flex-shrink: 0;
}

.cb-send-btn:hover:not(:disabled) {
  background: var(--cb-secondary);
  transform: translateY(-1px);
  box-shadow: none;
}

.cb-send-btn:disabled {
  background: #adb5bd;
  cursor: not-allowed;
}

.cb-send-btn svg {
  width: 20px;
  height: 20px;
}

/* Loading spinner */
.cb-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: cb-spin 0.8s linear infinite;
}

@keyframes cb-spin {
  to { transform: rotate(360deg); }
}

@keyframes cb-float {
  0%, 100% { transform: translateY(0); box-shadow: none; }
  50% { transform: translateY(-4px); box-shadow: none; }
}

@keyframes cb-message-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cb-section-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cb-toggle-btn,
  .cb-chat-window,
  .cb-teaser,
  .cb-message,
  .cb-lead-form,
  .cb-action-menu,
  .cb-input-form {
    animation: none !important;
    transition: none !important;
  }
}

.cb-widget-container button:focus-visible, .cb-widget-container input:focus-visible,
.cb-widget-container textarea:focus-visible { outline: 2px solid var(--cb-text); outline-offset: 3px; }
.cb-widget-container input::placeholder, .cb-widget-container textarea::placeholder { color: var(--cb-muted); }
.cb-send-btn:hover:not(:disabled), .cb-lead-submit:hover { background: var(--cb-primary); opacity: .9; }
.cb-copy-btn:focus-visible { opacity: 1; }
.cb-header h3 { font-family: 'arcadiaDisplay', 'Söhne Breit', ui-sans-serif, system-ui, sans-serif; font-weight: 480; letter-spacing: .015em; }
@media (max-width: 420px) {
  .cb-widget-container.cb-open .cb-toggle-btn { display: none; }
  .cb-messages { padding: 20px 16px; }
}
/* Scrollbar styling */
.cb-messages::-webkit-scrollbar {
  width: 6px;
}

.cb-messages::-webkit-scrollbar-track {
  background: var(--cb-bg);
}

.cb-messages::-webkit-scrollbar-thumb {
  background: var(--cb-border);
  border-radius: 3px;
}

.cb-messages::-webkit-scrollbar-thumb:hover {
  background: var(--cb-muted);
}

/* Quote request card */
.cb-quote-card {
  align-self: flex-start;
  width: 100%;
  max-width: 100%;
  background: var(--cb-card);
  border: 1px solid var(--cb-border);
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 16px;
  animation: cb-message-enter 0.28s ease both;
}

.cb-quote-card-title {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 480;
  color: var(--cb-muted);
}

.cb-quote-card-desc {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--cb-muted);
  line-height: 1.5;
}

.cb-quote-textarea {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--cb-border);
  border-radius: 32px;
  font-size: 16px;
  font-family: inherit;
  color: var(--cb-muted);
  background: var(--cb-card);
  resize: vertical;
  min-height: 72px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.cb-quote-textarea:focus {
  border-color: var(--cb-text);
  box-shadow: none;
}

.cb-quote-submit {
  margin-top: 8px;
  width: 100%;
  padding: 9px 12px;
  background: var(--cb-secondary);
  color: var(--cb-text);
  border: none;
  border-radius: 32px;
  font-size: 16px;
  font-weight: 480;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}

.cb-quote-submit:hover:not(:disabled) {
  background: var(--cb-secondary);
  transform: translateY(-1px);
}

.cb-quote-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cb-quote-error {
  margin: 6px 0 0;
  font-size: 11px;
  color: var(--cb-muted);
  min-height: 16px;
}

.cb-quote-success {
  align-self: flex-start;
  background: var(--cb-card);
  border: 1px solid var(--cb-border);
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 16px;
  color: var(--cb-muted);
  font-weight: 500;
  animation: cb-message-enter 0.28s ease both;
}
`;
