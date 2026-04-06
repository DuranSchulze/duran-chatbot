import type { ChatbotConfig } from "@duran-chatbot/config"

declare const __WIDGET_VERSION__: string

export function getEmbedCode(_config: ChatbotConfig): string {
  const widgetBaseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"

  return `<!-- Chatbot Widget -->
<div id="chatbot-widget"></div>
<script src="${widgetBaseUrl}/widget.js?v=${__WIDGET_VERSION__}" defer></script>`
}
