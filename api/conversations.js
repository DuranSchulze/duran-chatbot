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

function buildCredentials() {
  // Method A: full JSON blob
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      console.warn("[Google] GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON — falling back to split env vars");
    }
  }

  // Method B: individual env vars
  const client_email = process.env.GOOGLE_CLIENT_EMAIL;
  const private_key = process.env.GOOGLE_PRIVATE_KEY;
  const project_id = process.env.GOOGLE_PROJECT_ID;

  if (client_email && private_key) {
    return {
      type: "service_account",
      client_email,
      // Vercel stores \n as literal backslash-n — restore real newlines
      private_key: private_key.replace(/\\n/g, "\n"),
      ...(project_id ? { project_id } : {}),
    };
  }

  throw new Error(
    "Google credentials not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON " +
      "or GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY.",
  );
}

function getAuthClient() {
  const credentials = buildCredentials();
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
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
    let rows = [];
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${profile}!A2:G`,
      });
      rows = response.data.values ?? [];
    } catch (rangeErr) {
      const msg = rangeErr instanceof Error ? rangeErr.message : "";
      if (msg.toLowerCase().includes("unable to parse range") || msg.toLowerCase().includes("not found")) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: { requests: [{ addSheet: { properties: { title: profile } } }] },
        });
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `${profile}!A1:G1`,
          valueInputOption: "RAW",
          requestBody: { values: [["Timestamp", "SessionID", "Name", "Email", "UserMessage", "AIResponse", "Profile"]] },
        });
        console.log(`[Sheets] Created tab '${profile}' with headers`);
      } else {
        throw rangeErr;
      }
    }
    res.status(200).json({ sessions: groupBySession(rows) });
  } catch (error) {
    console.error("Google Sheets read error:", error);
    res.status(500).json({
      error: "Failed to read conversations",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
