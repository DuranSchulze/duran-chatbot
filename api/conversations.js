import { google } from "googleapis";
import jwt from "jsonwebtoken";

function verifyToken(req) {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) throw new Error("No token provided");
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) throw new Error("AUTH_JWT_SECRET not configured");
  return jwt.verify(token, secret);
}

function getAuthClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not configured");
  const credentials = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

function groupBySession(rows) {
  const sessionsMap = new Map();

  for (const row of rows) {
    const [timestamp, sessionId, userName, userEmail, userMessage, aiResponse, profile] = row;
    if (!userMessage) continue;

    const key = sessionId || `${userEmail}_${userName}`;
    if (!sessionsMap.has(key)) {
      sessionsMap.set(key, {
        sessionId: key,
        userName: userName || "",
        userEmail: userEmail || "",
        profile: profile || "",
        firstSeen: timestamp,
        lastActive: timestamp,
        messages: [],
      });
    }

    const session = sessionsMap.get(key);
    session.lastActive = timestamp;
    session.messages.push({ role: "user", content: userMessage, timestamp });
    if (aiResponse) {
      session.messages.push({ role: "assistant", content: aiResponse, timestamp });
    }
  }

  return Array.from(sessionsMap.values()).sort(
    (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime(),
  );
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    verifyToken(req);
  } catch {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const sheetId = process.env.GOOGLE_SHEETS_ID;
  if (!sheetId) {
    res.status(500).json({ error: "GOOGLE_SHEETS_ID is not configured" });
    return;
  }

  const urlParams = new URL(req.url, "http://localhost").searchParams;
  const profile = req.query?.profile ?? urlParams.get("profile") ?? "default";

  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${profile}!A2:G`,
    });

    const rows = response.data.values ?? [];
    const sessions = groupBySession(rows);

    res.status(200).json({ sessions });
  } catch (error) {
    console.error("Google Sheets read error:", error);
    res.status(500).json({
      error: "Failed to read conversations",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
