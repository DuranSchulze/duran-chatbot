import { ChatbotWidget } from './widget';
import type { ChatbotConfig, WidgetEmbedConfig } from '@duran-chatbot/config';

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

// Auto-initialize if config is present
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

  const boot = () => {
    if (!window.ChatbotConfig) {
      return
    }

    mountWidget(window.ChatbotConfig, collectEmbedConfig())
  }

  if (window.ChatbotConfig) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot, { once: true })
    } else {
      boot()
    }
  }
}
