import { isAdmin } from "./auth.js";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  const send = (status, payload) => {
    res.statusCode = status;
    res.end(JSON.stringify(payload));
  };
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(405, { error: "Method not allowed" });
  }
  if (!isAdmin(req)) return send(401, { error: "Sign in again to test the model." });
  let body;
  try {
    body = req.body;
    if (body === undefined) {
      let raw = "";
      for await (const chunk of req) {
        raw += chunk.toString();
        if (raw.length > 4096) return send(413, { error: "Request too large" });
      }
      body = JSON.parse(raw);
    } else if (typeof body === "string") body = JSON.parse(body);
  } catch {
    return send(400, { error: "Invalid request body" });
  }
  const model = body?.model;
  if (typeof model !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(model)) {
    return send(400, { error: "Select a valid model." });
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return send(503, { error: "The server’s Gemini API key is not configured." });
  const started = Date.now();
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Reply with a short greeting to confirm you are responding." }] }],
        generationConfig: { maxOutputTokens: 1024 },
      }),
    });
    if (!response.ok) {
      const errors = {
        400: "The model rejected the test request.",
        401: "Gemini rejected the server’s API key.",
        403: "The API key does not have access to this model.",
        404: "This model is unavailable or does not support text generation.",
        429: "Gemini’s quota or rate limit was reached. Try again later.",
      };
      return send(502, { error: errors[response.status] ?? `Gemini is unavailable (HTTP ${response.status}). Try again later.` });
    }
    const payload = await response.json();
    const text = payload.candidates?.[0]?.content?.parts
      ?.filter((part) => !part.thought && typeof part.text === "string")
      .map((part) => part.text).join("").trim();
    if (!text) return send(502, { error: "Gemini responded but returned no text. Try again or select another model." });
    return send(200, { model, text, elapsedMs: Date.now() - started });
  } catch (error) {
    return send(504, { error: error?.name === "TimeoutError"
      ? "The model did not respond within 20 seconds. Try again."
      : "Could not reach Gemini. Try again." });
  }
}
