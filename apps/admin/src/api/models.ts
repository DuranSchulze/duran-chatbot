export type GeminiModelOption = {
  id: string;
  label: string;
};

const MODELS_PATH = "/api/models";

export async function fetchModels(): Promise<GeminiModelOption[]> {
  const response = await fetch(MODELS_PATH);

  if (!response.ok) {
    let details = "";

    try {
      const payload = (await response.json()) as { error?: string; details?: string };
      details = payload.details ?? payload.error ?? "";
    } catch {
      details = response.statusText;
    }

    throw new Error(details || `Failed to fetch models (${response.status})`);
  }

  const payload = (await response.json()) as { models?: GeminiModelOption[] };
  return Array.isArray(payload.models) ? payload.models : [];
}

