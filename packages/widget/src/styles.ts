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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: grid;
  place-items: center;
  transition: transform 0.24s ease, box-shadow 0.24s ease, background 0.24s ease;
  z-index: 10000;
  animation: cb-float 3.2s ease-in-out infinite;
}

/* Stay visible while open — the icon morphs to a close (X) instead of hiding. */
.cb-widget-container.cb-open .cb-toggle-btn {
  animation: none;
}

.cb-toggle-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 20px rgba(0,0,0,0.2);
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

/* Chat Window */
.cb-chat-window {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 440px;
  max-width: calc(100vw - 40px);
  height: 600px;
  max-height: calc(100vh - 120px);
  background: var(--cb-bg);
  border-radius: var(--cb-radius);
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
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
}

/* Mobile — fullscreen chat */
@media (max-width: 420px) {
  .cb-chat-window {
    position: fixed;
    inset: 0;
    width: 100%;
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
  font-weight: 600;
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
  border-radius: 4px;
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
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.cb-message {
  max-width: 86%;
  padding: 9px 13px;
  border-radius: 16px;
  font-size: 13px;
  line-height: 1.45;
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
  color: var(--cb-primary);
  text-decoration: underline;
  word-break: break-all;
}

.cb-ai-message a {
  color: #0056b3;
}

.cb-message a:hover {
  opacity: 0.8;
}

.cb-message strong {
  font-weight: 600;
}

.cb-message em {
  font-style: italic;
}

.cb-user-message {
  align-self: flex-end;
  background: var(--cb-primary);
  color: white;
  border-bottom-right-radius: 4px;
}

.cb-ai-message {
  align-self: flex-start;
  background: #f1f3f5;
  color: var(--cb-text);
  border-bottom-left-radius: 4px;
}

.cb-error-message {
  align-self: flex-start;
  background: #f8d7da;
  color: #721c24;
  border-bottom-left-radius: 4px;
}

/* Friendly "we're having a problem" notice (shown instead of raw errors) */
.cb-notice-message {
  align-self: flex-start;
  background: #fff7ed;
  color: #7c2d12;
  border: 1px solid #fed7aa;
  border-bottom-left-radius: 4px;
}

.cb-notice-message a {
  color: #9a3412;
  font-weight: 600;
}

/* Admin ("middleman") reply — styled exactly like an AI message for a seamless feel */
.cb-agent-message {
  align-self: flex-start;
  background: #f1f3f5;
  color: var(--cb-text);
  border-bottom-left-radius: 4px;
}

.cb-agent-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--cb-primary);
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
  border-radius: 4px;
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
  background: white;
  border-top: 1px solid #e9ecef;
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
  font-weight: 600;
  line-height: 1.5;
}

.cb-lead-fields {
  display: grid;
  gap: 8px;
}

.cb-lead-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dee2e6;
  background: white;
  color: var(--cb-text);
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.cb-lead-input:focus {
  border-color: var(--cb-primary);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
}

.cb-lead-error {
  min-height: 18px;
  margin: 0;
  color: #dc2626;
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
  font-weight: 700;
  letter-spacing: 0.01em;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.cb-lead-submit:hover {
  background: var(--cb-accent);
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
}

/* Action menu (configurable task buttons) */
.cb-chat-inputs {
  position: relative;
}

.cb-menu-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f1f3f5;
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
  background: var(--cb-primary);
  color: white;
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
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 18px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.2);
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
  background: #f8fafc;
  border: 1px solid #eef1f5;
  border-radius: 13px;
  color: var(--cb-text);
  font-size: clamp(13px, 3.6vw, 15px);
  font-weight: 600;
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
  background: var(--cb-primary);
  opacity: 0.55;
  transition: background 0.16s ease, opacity 0.16s ease;
}

.cb-action-item:hover {
  background: var(--cb-primary);
  border-color: var(--cb-primary);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.14);
}

.cb-action-item:hover::before {
  background: white;
  opacity: 1;
}

/* Post-answer call-to-action card — tinted with the brand primary color */
.cb-cta-card {
  align-self: stretch;
  margin-top: 2px;
  padding: 9px 10px;
  /* Fallback for browsers without color-mix, then the primary tint over it. */
  background: rgba(15, 23, 42, 0.04);
  background: color-mix(in srgb, var(--cb-primary) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--cb-primary) 20%, transparent);
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
  background: var(--cb-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.cb-cta-btn:hover {
  background: var(--cb-accent);
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.14);
}

/* Input Form */
.cb-input-form {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  flex-shrink: 0;
  animation: cb-section-enter 0.36s ease both;
}

.cb-input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #dee2e6;
  border-radius: 24px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.cb-input:focus {
  border-color: var(--cb-primary);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
}

.cb-input:disabled {
  background: #f8f9fa;
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
  background: var(--cb-accent);
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14);
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
  0%, 100% { transform: translateY(0); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
  50% { transform: translateY(-4px); box-shadow: 0 10px 24px rgba(0,0,0,0.18); }
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
  .cb-message,
  .cb-lead-form,
  .cb-action-menu,
  .cb-input-form {
    animation: none !important;
    transition: none !important;
  }
}

/* Scrollbar styling */
.cb-messages::-webkit-scrollbar {
  width: 6px;
}

.cb-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.cb-messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.cb-messages::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* Quote request card */
.cb-quote-card {
  align-self: flex-start;
  width: 100%;
  max-width: 100%;
  background: #f0f6ff;
  border: 1px solid #bfdbfe;
  border-radius: 14px;
  padding: 14px 16px;
  font-size: 13px;
  animation: cb-message-enter 0.28s ease both;
}

.cb-quote-card-title {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 700;
  color: #1e3a5f;
}

.cb-quote-card-desc {
  margin: 0 0 10px;
  font-size: 12px;
  color: #4b6a94;
  line-height: 1.5;
}

.cb-quote-textarea {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #93c5fd;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  color: #1e3a5f;
  background: #fff;
  resize: vertical;
  min-height: 72px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.cb-quote-textarea:focus {
  border-color: var(--cb-primary);
  box-shadow: 0 0 0 3px rgba(0, 74, 153, 0.12);
}

.cb-quote-submit {
  margin-top: 8px;
  width: 100%;
  padding: 9px 12px;
  background: var(--cb-primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}

.cb-quote-submit:hover:not(:disabled) {
  background: var(--cb-accent);
  transform: translateY(-1px);
}

.cb-quote-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cb-quote-error {
  margin: 6px 0 0;
  font-size: 11px;
  color: #dc2626;
  min-height: 16px;
}

.cb-quote-success {
  align-self: flex-start;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 14px;
  padding: 12px 16px;
  font-size: 13px;
  color: #166534;
  font-weight: 500;
  animation: cb-message-enter 0.28s ease both;
}
`;
