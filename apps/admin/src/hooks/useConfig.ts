import { useState, useEffect } from 'react';
import type { ChatbotConfig } from '@duran-chatbot/config';
import { fetchConfig, saveConfig } from '../api/config';

export function useConfig() {
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await fetchConfig();
      setConfig(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load config');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (newConfig: ChatbotConfig) => {
    try {
      setSaving(true);
      await saveConfig(newConfig);
      setConfig(newConfig);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save config');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { config, loading, error, saving, updateConfig, reload: loadConfig };
}
