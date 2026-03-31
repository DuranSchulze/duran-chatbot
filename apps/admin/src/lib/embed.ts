import type { ChatbotConfig } from "@duran-chatbot/config"

export function getEmbedCode(config: ChatbotConfig): string {
  const widgetBaseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"

  return `<!-- Chatbot Widget -->
<div id="chatbot-widget"></div>
<script>
  window.ChatbotConfig = {
    appearance: {
      position: '${config.appearance.position}',
      companyName: '${config.appearance.companyName}',
      primaryColor: '${config.appearance.primaryColor}'
    }
  };
</script>
<script src="${widgetBaseUrl}/widget.js" async></script>`
}
