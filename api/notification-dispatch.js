import { timingSafeEqual } from "node:crypto";
import { dispatchNotifications } from "@duran-chatbot/database";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const expected = Buffer.from(`Bearer ${process.env.CRON_SECRET || ""}`);
  const actual = Buffer.from(req.headers.authorization || "");
  if (!process.env.CRON_SECRET || actual.length !== expected.length || !timingSafeEqual(actual, expected)) return res.status(401).json({ error: "Unauthorized" });
  try { return res.status(200).json(await dispatchNotifications()); }
  catch { return res.status(500).json({ error: "Notification dispatch failed" }); }
}
