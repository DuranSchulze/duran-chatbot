import { isAdmin } from "./_lib/auth.js";
import { logChat, ChatLogError } from "@duran-chatbot/database";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Method not allowed" }); }
  let body = req.body;
  try {
    if (!body || typeof body !== "object") {
      let raw = "";
      if (typeof body === "string") raw = body;
      else for await (const chunk of req) {
        raw += chunk.toString();
        if (Buffer.byteLength(raw) > 150000) return res.status(413).json({ error: "Request too large" });
      }
      body = JSON.parse(raw);
    }
  } catch { return res.status(400).json({ error: "Invalid request body" }); }
  try { return res.status(200).json(await logChat(body, { allowInternal: isAdmin(req) })); }
  catch (error) {
    const status = error instanceof ChatLogError ? error.status : 500;
    if (status === 429) res.setHeader("Retry-After", "60");
    return res.status(status).json({ error: status === 500 ? "Failed to log conversation" : error.message });
  }
}
