import type { ChatbotConfig } from "@duran-chatbot/config"

export function getEmbedCode(config: ChatbotConfig): string {
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
<script src="https://your-domain.com/widget.js" async></script>`
}
