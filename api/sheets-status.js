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
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    try { return JSON.parse(raw); }
    catch { console.warn("[Google] GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON — falling back to split env vars"); }
  }
  const client_email = process.env.GOOGLE_CLIENT_EMAIL;
  const private_key = process.env.GOOGLE_PRIVATE_KEY;
  const project_id = process.env.GOOGLE_PROJECT_ID;
  if (client_email && private_key) {
    return {
      type: "service_account",
      client_email,
      private_key: private_key.replace(/\\n/g, "\n"),
      ...(project_id ? { project_id } : {}),
    };
  }
  throw new Error(
    "Google credentials not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY.",
  );
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  try { verifyToken(req); }
  catch { res.status(401).json({ error: "Unauthorized" }); return; }

  const sheetId = process.env.GOOGLE_SHEETS_ID;
  if (!sheetId) {
    res.status(200).json({ connected: false, error: "GOOGLE_SHEETS_ID is not configured" });
    return;
  }

  let credentials;
  try { credentials = buildCredentials(); }
  catch (e) { res.status(200).json({ connected: false, error: e.message }); return; }

  if (req.method === "GET") {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      });
      const sheets = google.sheets({ version: "v4", auth });
      const meta = await sheets.spreadsheets.get({
        spreadsheetId: sheetId,
        fields: "spreadsheetId,properties/title,sheets/properties/title",
      });
      const tabs = (meta.data.sheets ?? [])
        .map((s) => s.properties?.title)
        .filter(Boolean);
      res.status(200).json({
        connected: true,
        email: credentials.client_email ?? "",
        sheetTitle: meta.data.properties?.title ?? "",
        tabs,
        sheetId,
      });
    } catch (error) {
      res.status(200).json({
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else if (req.method === "POST") {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
      const sheets = google.sheets({ version: "v4", auth });
      const timestamp = new Date().toISOString();
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: "duran-schulze!A:G",
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [[
            timestamp, "_test", "Connection Test", "test@test.com",
            "Connection test message", "Connection test response", "_test",
          ]],
        },
      });
      res.status(200).json({
        success: true,
        message: `Test row written to 'duran-schulze' tab at ${timestamp}`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Method not allowed" });
  }
}
