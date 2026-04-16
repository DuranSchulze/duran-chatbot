import { google } from "googleapis";

async function readRequestBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function getAuthClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not configured");
  const credentials = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const sheetId = process.env.GOOGLE_SHEETS_ID;
  if (!sheetId) {
    res.status(500).json({ error: "GOOGLE_SHEETS_ID is not configured" });
    return;
  }

  let body;
  try {
    body = await readRequestBody(req);
  } catch {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { profile, sessionId, userName, userEmail, userMessage, aiResponse } = body;

  if (!userMessage || !aiResponse) {
    res.status(400).json({ error: "userMessage and aiResponse are required" });
    return;
  }

  const timestamp = new Date().toISOString();
  const sheetTabName = profile || "default";

  const row = [
    timestamp,
    sessionId || "",
    userName || "",
    userEmail || "",
    userMessage,
    aiResponse,
    profile || "",
  ];

  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${sheetTabName}!A:G`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Google Sheets append error:", error);
    res.status(500).json({
      error: "Failed to log to Google Sheets",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
