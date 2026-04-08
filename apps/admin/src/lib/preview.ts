import { mergeWithDefaults, type ChatbotConfig } from "@duran-chatbot/config";

const PREVIEW_CONFIG_KEY = "duran-chatbot-preview-config";

export function savePreviewConfig(config: ChatbotConfig) {
  window.localStorage.setItem(PREVIEW_CONFIG_KEY, JSON.stringify(config));
}

export function loadPreviewConfig(): ChatbotConfig | null {
  const rawValue = window.localStorage.getItem(PREVIEW_CONFIG_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return mergeWithDefaults(JSON.parse(rawValue) as Partial<ChatbotConfig>);
  } catch {
    window.localStorage.removeItem(PREVIEW_CONFIG_KEY);
    return null;
  }
}
