export const styles = `
/* Chatbot Widget Styles */
.cb-widget-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.24s ease, box-shadow 0.24s ease, background 0.24s ease;
  z-index: 10000;
  animation: cb-float 3.2s ease-in-out infinite;
}

.cb-widget-container.cb-open .cb-toggle-btn {
  transform: scale(0);
  opacity: 0;
  pointer-events: none;
  animation: none;
}

.cb-toggle-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0,0,0,0.2);
}

.cb-toggle-btn svg {
  width: 28px;
  height: 28px;
}

.cb-icon-close {
  display: none;
}

.cb-widget-container.cb-open .cb-icon-message {
  display: none;
}

.cb-widget-container.cb-open .cb-icon-close {
  display: block;
}

/* Chat Window */
.cb-chat-window {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 380px;
  height: 500px;
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

/* Mobile responsive */
@media (max-width: 420px) {
  .cb-chat-window {
    width: calc(100vw - 40px);
    height: calc(100vh - 100px);
    max-height: none;
    right: 20px;
    left: 20px;
    bottom: 80px;
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
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cb-message {
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
  position: relative;
  animation: cb-message-enter 0.28s ease both;
}

.cb-message p {
  margin: 0;
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

/* Quick links */
.cb-quick-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px 0;
  background: white;
  animation: cb-section-enter 0.32s ease both;
}

.cb-quick-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 6px 10px;
  background: #f8fafc;
  border: 1px solid #dee2e6;
  color: var(--cb-text);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
  text-align: center;
  text-decoration: none;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.cb-quick-link:hover {
  background: var(--cb-primary);
  border-color: var(--cb-primary);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
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
  .cb-quick-links,
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
`;
