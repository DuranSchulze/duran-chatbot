import type { ChatbotConfig, WidgetEmbedConfig } from '@duran-chatbot/config';
import { defaultConfig } from '@duran-chatbot/config';
import { styles } from './styles';

interface Message {
  text: string;
  sender: 'user' | 'ai' | 'error';
  timestamp: Date;
}

export class ChatbotWidget {
  private config: ChatbotConfig;
  private embedConfig: WidgetEmbedConfig;
  private container: HTMLElement | null = null;
  private chatWindow: HTMLElement | null = null;
  private isOpen = false;
  private messages: Message[] = [];
  private apiKey: string;

  constructor(config: Partial<ChatbotConfig> = {}, embedConfig: WidgetEmbedConfig = {}) {
    this.config = { ...defaultConfig, ...config };
    this.embedConfig = embedConfig;
    this.apiKey = embedConfig.apiKey || this.config.ai.apiKey || '';
    this.init();
  }

  private init() {
    this.injectStyles();
    this.createWidget();
    this.attachEventListeners();
  }

  private injectStyles() {
    if (document.getElementById('chatbot-widget-styles')) return;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'chatbot-widget-styles';
    styleEl.textContent = this.getCSSVariables() + styles;
    document.head.appendChild(styleEl);
  }

  private getCSSVariables(): string {
    const { appearance } = this.config;
    const pos = this.embedConfig.position || appearance.position;
    
    return `
      :root {
        --cb-primary: ${appearance.primaryColor};
        --cb-accent: ${appearance.accentColor};
        --cb-bg: ${appearance.backgroundColor};
        --cb-text: ${appearance.textColor};
        --cb-radius: ${appearance.borderRadius}px;
        --cb-position: ${pos === 'bottom-left' ? '20px auto auto 20px' : '20px 20px auto auto'};
        --cb-chat-left: ${pos === 'bottom-left' ? '20px' : 'auto'};
        --cb-chat-right: ${pos === 'bottom-left' ? 'auto' : '20px'};
      }
    `;
  }

  private createWidget() {
    // Create container
    this.container = document.createElement('div');
    this.container.className = 'cb-widget-container';
    this.container.innerHTML = this.getWidgetHTML();
    document.body.appendChild(this.container);

    this.chatWindow = this.container.querySelector('.cb-chat-window');
  }

  private getWidgetHTML(): string {
    const { appearance } = this.config;
    const welcomeMsg = appearance.welcomeMessage;

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
          <h3>${appearance.companyName}</h3>
          <button class="cb-close-btn" aria-label="Close chat">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        
        <div class="cb-messages" role="log" aria-live="polite">
          <div class="cb-message cb-ai-message">
            <p>${welcomeMsg}</p>
          </div>
        </div>
        
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
    `;
  }

  private attachEventListeners() {
    if (!this.container) return;

    const toggleBtn = this.container.querySelector('.cb-toggle-btn');
    const closeBtn = this.container.querySelector('.cb-close-btn');
    const form = this.container.querySelector('.cb-input-form');
    const input = this.container.querySelector('.cb-input') as HTMLInputElement;

    toggleBtn?.addEventListener('click', () => this.toggle());
    closeBtn?.addEventListener('click', () => this.close());
    
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input?.value.trim();
      if (text) {
        this.sendMessage(text);
        input.value = '';
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Auto-open if configured
    if (this.config.behavior.autoOpenDelay > 0) {
      setTimeout(() => this.open(), this.config.behavior.autoOpenDelay * 1000);
    }
  }

  private toggle() {
    this.isOpen ? this.close() : this.open();
  }

  private open() {
    this.isOpen = true;
    this.container?.classList.add('cb-open');
    this.chatWindow?.setAttribute('aria-hidden', 'false');
    
    // Focus input
    const input = this.container?.querySelector('.cb-input') as HTMLInputElement;
    setTimeout(() => input?.focus(), 100);
  }

  private close() {
    this.isOpen = false;
    this.container?.classList.remove('cb-open');
    this.chatWindow?.setAttribute('aria-hidden', 'true');
  }

  private async sendMessage(text: string) {
    if (!this.apiKey) {
      this.addMessage('Error: API key not configured', 'error');
      return;
    }

    // Add user message
    this.addMessage(text, 'user');
    this.setLoading(true);

    try {
      // Call Gemini API
      const response = await this.callGeminiAPI(text);
      this.addMessage(response, 'ai');
    } catch (error) {
      console.error('Chatbot API error:', error);
      this.addMessage('Sorry, I encountered an error. Please try again.', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  private async callGeminiAPI(message: string): Promise<string> {
    const { ai } = this.config;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${ai.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: message }]
          }],
          systemInstruction: {
            parts: [{ text: ai.systemPrompt }]
          },
          generationConfig: {
            temperature: ai.temperature,
            maxOutputTokens: ai.maxTokens,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received';
  }

  private addMessage(text: string, sender: 'user' | 'ai' | 'error') {
    const msg: Message = { text, sender, timestamp: new Date() };
    this.messages.push(msg);

    const messagesContainer = this.container?.querySelector('.cb-messages');
    if (!messagesContainer) return;

    const msgEl = document.createElement('div');
    msgEl.className = `cb-message cb-${sender}-message`;
    
    // Add copy button for AI messages
    const copyBtn = sender === 'ai' ? 
      `<button class="cb-copy-btn" aria-label="Copy message">📋</button>` : '';
    
    msgEl.innerHTML = `<p>${this.escapeHtml(text)}</p>${copyBtn}`;
    
    // Add timestamp if enabled
    if (this.config.behavior.showTimestamps) {
      const time = document.createElement('time');
      time.className = 'cb-timestamp';
      time.textContent = msg.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      msgEl.appendChild(time);
    }

    messagesContainer.appendChild(msgEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Attach copy listener
    if (sender === 'ai') {
      const btn = msgEl.querySelector('.cb-copy-btn');
      btn?.addEventListener('click', () => this.copyToClipboard(text));
    }
  }

  private setLoading(loading: boolean) {
    const btn = this.container?.querySelector('.cb-send-btn') as HTMLButtonElement | null;
    const input = this.container?.querySelector('.cb-input') as HTMLInputElement;
    
    if (btn) {
      btn.disabled = loading;
      btn.innerHTML = loading ? 
        `<div class="cb-spinner"></div>` :
        `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`;
    }
    
    if (input) {
      input.disabled = loading;
    }
  }

  private async copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      // Show toast or feedback
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Public API
  destroy() {
    this.container?.remove();
    const styles = document.getElementById('chatbot-widget-styles');
    styles?.remove();
  }
}
