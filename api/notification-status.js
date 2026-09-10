import { getNotificationStatus, retryFailedNotifications } from "@duran-chatbot/database";
import { isAdmin } from "./_lib/auth.js";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
  const profile = new URL(req.url, "http://localhost").searchParams.get("profile") || "duran-schulze";
  try { return res.status(200).json(await (req.method === "POST" ? retryFailedNotifications(profile) : getNotificationStatus(profile))); }
  catch { return res.status(500).json({ error: "Unable to read notification status" }); }
}
