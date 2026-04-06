const GEMINI_MODELS_URL = "https://generativelanguage.googleapis.com/v1beta/models";

function normalizeModels(payload) {
  const models = Array.isArray(payload?.models) ? payload.models : [];

  return models
    .filter((model) => Array.isArray(model.supportedGenerationMethods))
    .filter((model) => model.supportedGenerationMethods.includes("generateContent"))
    .map((model) => ({
      id: typeof model.name === "string" ? model.name.replace(/^models\//, "") : "",
      label:
        typeof model.displayName === "string" && model.displayName.length > 0
          ? model.displayName
          : typeof model.name === "string"
            ? model.name.replace(/^models\//, "")
            : "Unknown model",
    }))
    .filter((model) => model.id.length > 0)
    .sort((a, b) => a.label.localeCompare(b.label));
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    return;
  }

  try {
    const response = await fetch(`${GEMINI_MODELS_URL}?key=${apiKey}`);

    if (!response.ok) {
      const text = await response.text();
      res.status(response.status).json({
        error: "Failed to fetch Gemini models",
        details: text || response.statusText,
      });
      return;
    }

    const payload = await response.json();
    res.status(200).json({ models: normalizeModels(payload) });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch Gemini models",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

