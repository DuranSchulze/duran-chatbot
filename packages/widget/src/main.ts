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
  }
}

// Auto-initialize if config is present
if (typeof window !== 'undefined') {
  window.ChatbotWidget = ChatbotWidget;
  
  window.initChatbot = (config, embedConfig) => {
    return new ChatbotWidget(config, embedConfig);
  };

  // Auto-initialize if ChatbotConfig is defined
  if (window.ChatbotConfig) {
    const embedConfig: WidgetEmbedConfig = {};
    
    // Check for data attributes on the container element
    const container = document.getElementById('chatbot-widget');
    if (container) {
      const dataset = container.dataset;
      if (dataset.apiKey) embedConfig.apiKey = dataset.apiKey;
      if (dataset.position) embedConfig.position = dataset.position as 'bottom-right' | 'bottom-left';
      if (dataset.primaryColor) embedConfig.primaryColor = dataset.primaryColor;
      if (dataset.companyName) embedConfig.companyName = dataset.companyName;
    }
    
    document.addEventListener('DOMContentLoaded', () => {
      new ChatbotWidget(window.ChatbotConfig, embedConfig);
    });
  }
}
