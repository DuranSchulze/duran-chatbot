import type { ChatbotConfig } from '@duran-chatbot/config';

const CONFIG_PATH = '/api/config';

export async function fetchConfig(): Promise<ChatbotConfig> {
  const response = await fetch(CONFIG_PATH);
  if (!response.ok) {
    throw new Error(`Failed to fetch config: ${response.statusText}`);
  }
  return response.json();
}

export async function saveConfig(config: ChatbotConfig): Promise<void> {
  const response = await fetch(CONFIG_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!response.ok) {
    throw new Error(`Failed to save config: ${response.statusText}`);
  }
}
