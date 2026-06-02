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

  const getProfileSlug = (): string => {
    const container = document.getElementById('chatbot-widget')
    return container?.dataset.profile ?? ''
  }

  // Cold-start "starter": ping the warmup endpoint so the serverless functions and the
  // DB connection are already warm before the visitor's first interaction. Fire-and-forget.
  const warmUp = () => {
    try {
      void fetch(`${scriptOrigin}/api/warmup`, { method: 'GET', keepalive: true }).catch(() => {})
    } catch {
      /* warmup is best-effort */
    }
  }

  // Fetch config with a timeout and a couple of retries. A single cold-start hiccup must
  // never leave the very first visitor with a key-less (broken) widget.
  const fetchConfigWithRetry = async (
    url: string,
    attempts = 3,
  ): Promise<Partial<ChatbotConfig> | null> => {
    for (let i = 0; i < attempts; i++) {
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 8000)
        const res = await fetch(url, { signal: controller.signal })
        clearTimeout(timer)
        if (res.ok) {
          return (await res.json()) as Partial<ChatbotConfig>
        }
      } catch {
        /* network error / timeout — retry below */
      }
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 400 * (i + 1)))
      }
    }
    return null
  }

  const mountWidget = (config?: Partial<ChatbotConfig>, embedConfig?: WidgetEmbedConfig, profileSlug = '') => {
    window.__chatbotWidgetInstance?.destroy()
    const instance = new ChatbotWidget(config, embedConfig, profileSlug, scriptOrigin)
    window.__chatbotWidgetInstance = instance
    return instance
  }

  window.initChatbot = (config, embedConfig) => {
    return mountWidget(config, embedConfig, getProfileSlug())
  };

  const boot = async () => {
    // Kick off the cold-start warmup immediately, in parallel with the config fetch.
    warmUp()

    const profileSlug = getProfileSlug()
    const configUrl = profileSlug
      ? `${scriptOrigin}/api/config?profile=${encodeURIComponent(profileSlug)}`
      : `${scriptOrigin}/api/config`

    // Always fetch config from the server that hosts widget.js — this delivers
    // the API key (injected server-side) regardless of which site embeds the widget.
    // Retried with a timeout so a cold start doesn't break the first visitor.
    const serverConfig = (await fetchConfigWithRetry(configUrl)) ?? {}

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

    mountWidget(merged, collectEmbedConfig(), profileSlug)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => boot(), { once: true })
  } else {
    boot()
  }
}
