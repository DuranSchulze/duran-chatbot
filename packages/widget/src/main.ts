import { ChatbotWidget } from './widget';
import { mergeWithDefaults, type ChatbotConfig, type WidgetEmbedConfig } from '@duran-chatbot/config';

// Export for module usage
export { ChatbotWidget };
export type { ChatbotConfig, WidgetEmbedConfig };

// Global initialization function for script tag usage
declare global {
  interface Window {
    ChatbotWidget: typeof ChatbotWidget;
    ChatbotConfig?: Partial<ChatbotConfig>;
    initChatbot?: (config?: Partial<ChatbotConfig>, embedConfig?: WidgetEmbedConfig) => ChatbotWidget;
    __chatbotWidgetInstance?: ChatbotWidget;
  }
}

// Capture script origin synchronously — document.currentScript is only available at load time
const scriptOrigin = (() => {
  try {
    const src = (document.currentScript as HTMLScriptElement | null)?.src
    return src ? new URL(src).origin : window.location.origin
  } catch {
    return window.location.origin
  }
})()

if (typeof window !== 'undefined') {
  window.ChatbotWidget = ChatbotWidget;

  const collectEmbedConfig = (): WidgetEmbedConfig => {
    const embedConfig: WidgetEmbedConfig = {}
    const container = document.getElementById('chatbot-widget')

    if (container) {
      const dataset = container.dataset
      if (dataset.apiKey) embedConfig.apiKey = dataset.apiKey
      if (dataset.position) embedConfig.position = dataset.position as 'bottom-right' | 'bottom-left'
      if (dataset.primaryColor) embedConfig.primaryColor = dataset.primaryColor
      if (dataset.companyName) embedConfig.companyName = dataset.companyName
    }

    return embedConfig
  }

  const mountWidget = (config?: Partial<ChatbotConfig>, embedConfig?: WidgetEmbedConfig) => {
    window.__chatbotWidgetInstance?.destroy()
    const instance = new ChatbotWidget(config, embedConfig)
    window.__chatbotWidgetInstance = instance
    return instance
  }

  window.initChatbot = (config, embedConfig) => {
    return mountWidget(config, embedConfig)
  };

  const boot = async () => {
    let serverConfig: Partial<ChatbotConfig> = {}

    // Always fetch config from the server that hosts widget.js — this delivers
    // the API key (injected server-side) regardless of which site embeds the widget.
    try {
      const res = await fetch(`${scriptOrigin}/api/config`)
      if (res.ok) {
        serverConfig = await res.json() as Partial<ChatbotConfig>
      }
    } catch {
      // Silently fall back to window.ChatbotConfig only
    }

    // window.ChatbotConfig overrides take priority — deep merge nested objects
    const overrides = window.ChatbotConfig ?? {}
    const merged = mergeWithDefaults({
      ...serverConfig,
      ...overrides,
      appearance: { ...serverConfig.appearance, ...overrides.appearance },
      ai: { ...serverConfig.ai, ...overrides.ai },
      persona: { ...serverConfig.persona, ...overrides.persona },
      behavior: { ...serverConfig.behavior, ...overrides.behavior },
      services: overrides.services ?? serverConfig.services,
      quickLinks: overrides.quickLinks ?? serverConfig.quickLinks,
      dataset: overrides.dataset ?? serverConfig.dataset,
    } as Partial<ChatbotConfig>)

    mountWidget(merged, collectEmbedConfig())
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => boot(), { once: true })
  } else {
    boot()
  }
}
