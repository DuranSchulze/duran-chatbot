import type { IncomingMessage, ServerResponse } from "node:http";
import fs from "fs";
import path from "path";
import type { Connect, PluginOption, ViteDevServer } from "vite";
import { createClient } from "redis";
import { createTransport } from "nodemailer";
import { mergeWithDefaults } from "@duran-chatbot/config";
import { google } from "googleapis";
import jwt from "jsonwebtoken";

const GEMINI_MODELS_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";
const CONFIG_KEY = "chatbot:config";
const PROFILES_INDEX_KEY = "chatbot:profiles";
const PROFILE_KEY = (slug: string) => `chatbot:profile:${slug}`;
const DEFAULT_SLUG = "duran-schulze";

function readConfig(configPath: string) {
  const data = fs.readFileSync(configPath, "utf-8");
  return mergeWithDefaults(JSON.parse(data));
}

async function readRequestBody(req: IncomingMessage) {
  let body = "";
  for await (const chunk of req) {
    body += chunk.toString();
  }
  return body ? JSON.parse(body) : {};
}

function normalizeModels(payload: unknown) {
  const models = Array.isArray((payload as { models?: unknown[] })?.models)
    ? (payload as { models: Array<Record<string, unknown>> }).models
    : [];

  return models
    .filter((model) => Array.isArray(model.supportedGenerationMethods))
    .filter((model) =>
      (model.supportedGenerationMethods as unknown[]).includes(
        "generateContent",
      ),
    )
    .map((model) => ({
      id:
        typeof model.name === "string"
          ? model.name.replace(/^models\//, "")
          : "",
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

let redisClient: ReturnType<typeof createClient> | null = null;
let redisConnection: Promise<unknown> | null = null;

async function getRedisClient() {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL is not configured");
  }

  if (!redisClient) {
    redisClient = createClient({ url: redisUrl });
    redisClient.on("error", (err: Error) => {
      console.warn("[Redis] connection error:", err.message);
      redisClient = null;
      redisConnection = null;
    });
    redisConnection = redisClient.connect();
  }

  if (!redisConnection) {
    throw new Error("Redis connection failed to initialize");
  }

  await redisConnection;
  return redisClient;
}

async function getStoredConfig(configPath: string) {
  const client = await getRedisClient();
  const rawConfig = await client.get(CONFIG_KEY);

  if (!rawConfig) {
    const fallbackConfig = readConfig(configPath);
    await client.set(CONFIG_KEY, JSON.stringify(fallbackConfig));
    return fallbackConfig;
  }

  return mergeWithDefaults(JSON.parse(rawConfig));
}

// ─── Profile helpers ───────────────────────────────────────────────

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

type ProfileMeta = { slug: string; name: string; status: "active" | "archived"; createdAt: string }

async function ensureProfilesBootstrapped(client: ReturnType<typeof createClient>, configPath: string) {
  const existing = await client.get(PROFILES_INDEX_KEY);
  if (existing) return;

  const legacyRaw = await client.get(CONFIG_KEY);
  const config = legacyRaw ? mergeWithDefaults(JSON.parse(legacyRaw)) : readConfig(configPath);

  const defaultProfile: ProfileMeta = {
    slug: DEFAULT_SLUG,
    name: "Duran Schulze",
    status: "active",
    createdAt: new Date().toISOString(),
  };

  await client.set(PROFILE_KEY(DEFAULT_SLUG), JSON.stringify(config));
  await client.set(PROFILES_INDEX_KEY, JSON.stringify([defaultProfile]));
}

async function getProfilesIndex(client: ReturnType<typeof createClient>, configPath: string): Promise<ProfileMeta[]> {
  await ensureProfilesBootstrapped(client, configPath);
  const raw = await client.get(PROFILES_INDEX_KEY);
  return raw ? JSON.parse(raw) as ProfileMeta[] : [];
}

async function saveProfilesIndex(client: ReturnType<typeof createClient>, profiles: ProfileMeta[]) {
  await client.set(PROFILES_INDEX_KEY, JSON.stringify(profiles));
}

// ─── Rate limiting for quote-request ──────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) ?? { count: 0, resetAt: now + 10 * 60 * 1000 };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + 10 * 60 * 1000; }
  entry.count += 1;
  rateLimitMap.set(ip, entry);
  return entry.count > 5;
}

function getClientIp(req: IncomingMessage): string {
  const fwd = req.headers["x-forwarded-for"];
  return (Array.isArray(fwd) ? fwd[0] : fwd?.split(",")[0]?.trim()) ?? req.socket?.remoteAddress ?? "unknown";
}

function jsonRes(res: ServerResponse, status: number, body: unknown) {
  res.setHeader("Content-Type", "application/json");
  res.statusCode = status;
  res.end(JSON.stringify(body));
}

// ─── Google Sheets helpers ────────────────────────────────────────

function buildGoogleCredentials(): Record<string, unknown> {
  // Method A: full JSON blob
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
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

function getGoogleAuth(scopes: string[]) {
  const credentials = buildGoogleCredentials();
  return new google.auth.GoogleAuth({ credentials, scopes });
}

function groupBySession(rows: string[][]) {
  const map = new Map<string, {
    sessionId: string; userName: string; userEmail: string; profile: string;
    firstSeen: string; lastActive: string;
    messages: Array<{ role: "user" | "assistant"; content: string; timestamp: string }>;
  }>();

  for (const row of rows) {
    const [timestamp, sessionId, userName, userEmail, userMessage, aiResponse, profile] = row;
    if (!userMessage) continue;
    const key = sessionId || `${userEmail}_${userName}`;
    if (!map.has(key)) {
      map.set(key, { sessionId: key, userName: userName || "", userEmail: userEmail || "",
        profile: profile || "", firstSeen: timestamp, lastActive: timestamp, messages: [] });
    }
    const s = map.get(key)!;
    s.lastActive = timestamp;
    s.messages.push({ role: "user", content: userMessage, timestamp });
    if (aiResponse) s.messages.push({ role: "assistant", content: aiResponse, timestamp });
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime(),
  );
}

export function apiPlugin(): PluginOption {
  return {
    name: "api-server",
    configureServer(server: ViteDevServer) {
      // ── /api/auth ─────────────────────────────────────────────────
      server.middlewares.use(
        "/api/auth",
        async (req: IncomingMessage, res: ServerResponse) => {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type");

          if (req.method === "OPTIONS") { res.statusCode = 204; res.end(); return; }
          if (req.method !== "POST") { jsonRes(res, 405, { error: "Method not allowed" }); return; }

          const body = await readRequestBody(req) as { username?: string; password?: string };
          const { username, password } = body;

          const validUsername = process.env.AUTH_USERNAME;
          const validPassword = process.env.AUTH_PASSWORD;
          const jwtSecret = process.env.AUTH_JWT_SECRET;

          if (!validUsername || !validPassword || !jwtSecret) {
            jsonRes(res, 500, { error: "Auth is not configured on the server" }); return;
          }
          if (username !== validUsername || password !== validPassword) {
            jsonRes(res, 401, { error: "Invalid username or password" }); return;
          }

          const token = jwt.sign({ username }, jwtSecret, { expiresIn: "7d" });
          jsonRes(res, 200, { token });
        },
      );

      // ── /api/chat-log ─────────────────────────────────────────────
      server.middlewares.use(
        "/api/chat-log",
        async (req: IncomingMessage, res: ServerResponse) => {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type");

          if (req.method === "OPTIONS") { res.statusCode = 204; res.end(); return; }
          if (req.method !== "POST") { jsonRes(res, 405, { error: "Method not allowed" }); return; }

          const sheetId = process.env.GOOGLE_SHEETS_ID;
          if (!sheetId) { jsonRes(res, 500, { error: "GOOGLE_SHEETS_ID is not configured" }); return; }

          let body: { profile?: string; sessionId?: string; userName?: string; userEmail?: string; userMessage?: string; aiResponse?: string };
          try { body = await readRequestBody(req) as typeof body; }
          catch { jsonRes(res, 400, { error: "Invalid request body" }); return; }

          const { profile, sessionId, userName, userEmail, userMessage, aiResponse } = body;
          if (!userMessage || !aiResponse) { jsonRes(res, 400, { error: "userMessage and aiResponse are required" }); return; }

          const timestamp = new Date().toISOString();
          const row = [timestamp, sessionId || "", userName || "", userEmail || "", userMessage, aiResponse, profile || ""];

          try {
            const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets"]);
            const sheets = google.sheets({ version: "v4", auth });
            await sheets.spreadsheets.values.append({
              spreadsheetId: sheetId,
              range: `${profile || "default"}!A:G`,
              valueInputOption: "RAW",
              insertDataOption: "INSERT_ROWS",
              requestBody: { values: [row] },
            });
            jsonRes(res, 200, { success: true });
          } catch (error) {
            jsonRes(res, 500, { error: "Failed to log to Google Sheets", details: error instanceof Error ? error.message : "Unknown" });
          }
        },
      );

      // ── /api/conversations ────────────────────────────────────────
      server.middlewares.use(
        "/api/conversations",
        async (req: IncomingMessage, res: ServerResponse) => {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

          if (req.method === "OPTIONS") { res.statusCode = 204; res.end(); return; }
          if (req.method !== "GET") { jsonRes(res, 405, { error: "Method not allowed" }); return; }

          const authHeader = (req.headers["authorization"] as string) || "";
          const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
          const jwtSecret = process.env.AUTH_JWT_SECRET;
          if (!token || !jwtSecret) { jsonRes(res, 401, { error: "Unauthorized" }); return; }
          try { jwt.verify(token, jwtSecret); } catch { jsonRes(res, 401, { error: "Unauthorized" }); return; }

          const sheetId = process.env.GOOGLE_SHEETS_ID;
          if (!sheetId) { jsonRes(res, 500, { error: "GOOGLE_SHEETS_ID is not configured" }); return; }

          const url = new URL(req.url ?? "/", "http://localhost");
          const profile = url.searchParams.get("profile") ?? "default";

          try {
            const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets"]);
            const sheets = google.sheets({ version: "v4", auth });
            let rows: string[][] = [];
            try {
              const response = await sheets.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: `${profile}!A2:G`,
              });
              rows = (response.data.values ?? []) as string[][];
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
            jsonRes(res, 200, { sessions: groupBySession(rows) });
          } catch (error) {
            jsonRes(res, 500, { error: "Failed to read conversations", details: error instanceof Error ? error.message : "Unknown" });
          }
        },
      );

      // ── /api/sheets-status ────────────────────────────────────────
      server.middlewares.use(
        "/api/sheets-status",
        async (req: IncomingMessage, res: ServerResponse) => {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

          if (req.method === "OPTIONS") { res.statusCode = 204; res.end(); return; }

          const authHeader = (req.headers["authorization"] as string) || "";
          const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
          const jwtSecret = process.env.AUTH_JWT_SECRET;
          if (!token || !jwtSecret) { jsonRes(res, 401, { error: "Unauthorized" }); return; }
          try { jwt.verify(token, jwtSecret); } catch { jsonRes(res, 401, { error: "Unauthorized" }); return; }

          const sheetId = process.env.GOOGLE_SHEETS_ID;
          if (!sheetId) { jsonRes(res, 200, { connected: false, error: "GOOGLE_SHEETS_ID is not configured" }); return; }

          let credentials: Record<string, unknown>;
          try { credentials = buildGoogleCredentials(); }
          catch (e) { jsonRes(res, 200, { connected: false, error: e instanceof Error ? e.message : "Unknown" }); return; }

          if (req.method === "GET") {
            try {
              const auth = new google.auth.GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"] });
              const sheets = google.sheets({ version: "v4", auth });
              const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId, fields: "spreadsheetId,properties/title,sheets/properties/title" });
              const tabs = (meta.data.sheets ?? []).map((s) => s.properties?.title).filter(Boolean);
              jsonRes(res, 200, { connected: true, email: (credentials.client_email as string) ?? "", sheetTitle: meta.data.properties?.title ?? "", tabs, sheetId });
            } catch (error) {
              jsonRes(res, 200, { connected: false, error: error instanceof Error ? error.message : "Unknown" });
            }
          } else if (req.method === "POST") {
            try {
              const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets"]);
              const sheets = google.sheets({ version: "v4", auth });
              const timestamp = new Date().toISOString();
              await sheets.spreadsheets.values.append({
                spreadsheetId: sheetId,
                range: "duran-schulze!A:G",
                valueInputOption: "RAW",
                insertDataOption: "INSERT_ROWS",
                requestBody: { values: [[timestamp, "_test", "Connection Test", "test@test.com", "Connection test message", "Connection test response", "_test"]] },
              });
              jsonRes(res, 200, { success: true, message: `Test row written to 'duran-schulze' tab at ${timestamp}` });
            } catch (error) {
              jsonRes(res, 500, { success: false, error: error instanceof Error ? error.message : "Unknown" });
            }
          } else {
            jsonRes(res, 405, { error: "Method not allowed" });
          }
        },
      );

      server.middlewares.use(
        "/api/models",
        async (_req: IncomingMessage, res: ServerResponse) => {
          res.setHeader("Access-Control-Allow-Origin", "*")
          res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
          res.setHeader("Access-Control-Allow-Headers", "Content-Type")
          const geminiApiKey = process.env.GEMINI_API_KEY;

          if (!geminiApiKey) {
            res.statusCode = 500;
            res.end(
              JSON.stringify({ error: "GEMINI_API_KEY is not configured" }),
            );
            return;
          }

          try {
            const response = await fetch(
              `${GEMINI_MODELS_URL}?key=${geminiApiKey}`,
            );

            if (!response.ok) {
              const details = await response.text();
              res.statusCode = response.status;
              res.end(
                JSON.stringify({
                  error: "Failed to fetch Gemini models",
                  details: details || response.statusText,
                }),
              );
              return;
            }

            const payload = (await response.json()) as unknown;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ models: normalizeModels(payload) }));
          } catch (error) {
            res.statusCode = 500;
            res.end(
              JSON.stringify({
                error: "Failed to fetch Gemini models",
                details:
                  error instanceof Error ? error.message : "Unknown error",
              }),
            );
          }
        },
      );

      server.middlewares.use(
        "/api/config",
        async (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
          res.setHeader("Access-Control-Allow-Origin", "*")
          res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
          res.setHeader("Access-Control-Allow-Headers", "Content-Type")

          if (req.method === "OPTIONS") {
            res.statusCode = 204
            res.end()
            return
          }

          const configPath = path.resolve(
            __dirname,
            "../../../../data/config.json",
          );

          const configUrl = new URL(req.url ?? "/", "http://localhost");
          const profileSlug = configUrl.searchParams.get("profile") ?? "";

          if (req.method === "GET") {
            try {
              let config;
              if (process.env.REDIS_URL) {
                if (profileSlug) {
                  const client = await getRedisClient();
                  await ensureProfilesBootstrapped(client, configPath);
                  const raw = await client.get(PROFILE_KEY(profileSlug));
                  config = raw ? mergeWithDefaults(JSON.parse(raw)) : readConfig(configPath);
                } else {
                  config = await getStoredConfig(configPath);
                }
              } else {
                config = readConfig(configPath);
              }
              const geminiApiKey = process.env.GEMINI_API_KEY ?? "";

              // Inject API key from env — never stored in the file
              const response = {
                ...config,
                ai: { ...config.ai, apiKey: geminiApiKey },
              };

              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(response));
            } catch (error) {
              res.statusCode = 500;
              res.end(
                JSON.stringify({
                  error: "Failed to read config",
                  details:
                    error instanceof Error ? error.message : "Unknown error",
                }),
              );
            }
            return;
          }

          if (req.method === "POST") {
            try {
              const client = await getRedisClient();
              const body = await readRequestBody(req);
              const normalizedConfig = mergeWithDefaults(body);

              // Strip apiKey before saving — it lives in env only
              const {
                ai: { apiKey: _dropped, ...ai },
                ...rest
              } = normalizedConfig;
              const config = { ...rest, ai };

              const saveKey = profileSlug ? PROFILE_KEY(profileSlug) : CONFIG_KEY;
              await ensureProfilesBootstrapped(client, configPath);
              await client.set(saveKey, JSON.stringify(config));

              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: true }));
            } catch (error) {
              res.statusCode = 500;
              res.end(
                JSON.stringify({
                  error: "Failed to save config",
                  details:
                    error instanceof Error ? error.message : "Unknown error",
                }),
              );
            }
            return;
          }

          next();
        },
      );

      // ── /api/profiles ─────────────────────────────────────────────
      server.middlewares.use(
        "/api/profiles",
        async (req: IncomingMessage, res: ServerResponse) => {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type");

          if (req.method === "OPTIONS") { res.statusCode = 204; res.end(); return; }

          const configPath = path.resolve(__dirname, "../../../../data/config.json");
          const url = new URL(req.url ?? "/", "http://localhost");
          const slug = url.searchParams.get("slug") ?? "";

          try {
            const client = await getRedisClient();

            if (req.method === "GET") {
              const profiles = await getProfilesIndex(client, configPath);
              if (slug) {
                const meta = profiles.find((p) => p.slug === slug);
                if (!meta) { jsonRes(res, 404, { error: "Profile not found" }); return; }
                const raw = await client.get(PROFILE_KEY(slug));
                const config = raw ? mergeWithDefaults(JSON.parse(raw)) : readConfig(configPath);
                jsonRes(res, 200, { ...meta, config });
              } else {
                jsonRes(res, 200, { profiles });
              }
              return;
            }

            if (req.method === "POST") {
              const body = await readRequestBody(req) as { name?: string; slug?: string };
              const name = (body.name ?? "").trim();
              if (!name) { jsonRes(res, 400, { error: "Profile name is required" }); return; }

              const finalSlug = (body.slug?.trim() || slugify(name));
              const profiles = await getProfilesIndex(client, configPath);
              if (profiles.find((p) => p.slug === finalSlug)) {
                jsonRes(res, 409, { error: "A profile with this slug already exists" }); return;
              }

              const newProfile: ProfileMeta = { slug: finalSlug, name, status: "active", createdAt: new Date().toISOString() };
              await client.set(PROFILE_KEY(finalSlug), JSON.stringify(readConfig(configPath)));
              await saveProfilesIndex(client, [...profiles, newProfile]);
              jsonRes(res, 201, newProfile);
              return;
            }

            if (req.method === "PUT") {
              if (!slug) { jsonRes(res, 400, { error: "slug query param required" }); return; }
              const profiles = await getProfilesIndex(client, configPath);
              const idx = profiles.findIndex((p) => p.slug === slug);
              if (idx === -1) { jsonRes(res, 404, { error: "Profile not found" }); return; }

              const body = await readRequestBody(req) as { config?: unknown; name?: string };
              if (body.config) {
                const normalized = mergeWithDefaults(body.config as Parameters<typeof mergeWithDefaults>[0]);
                const { ai: { apiKey: _dropped, ...ai }, ...rest } = normalized;
                await client.set(PROFILE_KEY(slug), JSON.stringify({ ...rest, ai }));
              }
              if (body.name) {
                profiles[idx] = { ...profiles[idx], name: body.name };
                await saveProfilesIndex(client, profiles);
              }
              jsonRes(res, 200, { success: true });
              return;
            }

            if (req.method === "DELETE") {
              if (!slug) { jsonRes(res, 400, { error: "slug query param required" }); return; }
              const profiles = await getProfilesIndex(client, configPath);
              const idx = profiles.findIndex((p) => p.slug === slug);
              if (idx === -1) { jsonRes(res, 404, { error: "Profile not found" }); return; }
              if (profiles.filter((p) => p.status === "active").length <= 1) {
                jsonRes(res, 400, { error: "Cannot archive the last active profile" }); return;
              }
              profiles[idx] = { ...profiles[idx], status: "archived" };
              await saveProfilesIndex(client, profiles);
              jsonRes(res, 200, { success: true });
              return;
            }

            res.setHeader("Allow", "GET, POST, PUT, DELETE");
            jsonRes(res, 405, { error: "Method not allowed" });
          } catch (error) {
            jsonRes(res, 500, { error: "Profiles operation failed", details: error instanceof Error ? error.message : "Unknown error" });
          }
        },
      );

      // ── /api/quote-request ────────────────────────────────────────
      server.middlewares.use(
        "/api/quote-request",
        async (req: IncomingMessage, res: ServerResponse) => {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type");

          if (req.method === "OPTIONS") { res.statusCode = 204; res.end(); return; }
          if (req.method !== "POST") { jsonRes(res, 405, { error: "Method not allowed" }); return; }

          const ip = getClientIp(req);
          if (isRateLimited(ip)) { jsonRes(res, 429, { error: "Too many requests. Please try again later." }); return; }

          let body: { name?: string; email?: string; message?: string; service?: string; profile?: string; honeypot?: string };
          try {
            body = await readRequestBody(req) as typeof body;
          } catch {
            jsonRes(res, 400, { error: "Invalid request body" }); return;
          }

          if (body.honeypot) { jsonRes(res, 200, { success: true }); return; }
          if (!body.name?.trim()) { jsonRes(res, 400, { error: "Name is required" }); return; }
          if (!body.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
            jsonRes(res, 400, { error: "A valid email address is required" }); return;
          }
          if (!body.message?.trim()) { jsonRes(res, 400, { error: "Message is required" }); return; }

          const gmailUser = process.env.GMAIL_USER;
          const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
          if (!gmailUser || !gmailAppPassword) {
            jsonRes(res, 500, { error: "Email service is not configured" }); return;
          }

          // Get recipients from profile config
          let recipients: string[] = [];
          let ccList: string[] = [];
          let subject = "New Quote Request via Chatbot";

          try {
            const client = await getRedisClient();
            const configPath = path.resolve(__dirname, "../../../../data/config.json");
            const profileSlug = body.profile || DEFAULT_SLUG;
            const raw = await client.get(PROFILE_KEY(profileSlug));
            if (raw) {
              const cfg = mergeWithDefaults(JSON.parse(raw));
              recipients = cfg.behavior.quoteNotifyTo?.filter(Boolean) ?? [];
              ccList = cfg.behavior.quoteNotifyCC?.filter(Boolean) ?? [];
              subject = cfg.behavior.quoteEmailSubject?.trim() || subject;
            }
            if (recipients.length === 0) {
              // Fallback: try default profile
              const fallback = readConfig(configPath);
              recipients = fallback.behavior.quoteNotifyTo?.filter(Boolean) ?? [];
            }
          } catch { /* Redis unavailable — recipients stay empty */ }

          if (recipients.length === 0) {
            jsonRes(res, 500, { error: "No notification recipients configured for this profile" }); return;
          }

          const timestamp = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila", dateStyle: "long", timeStyle: "short" });

          try {
            const transporter = createTransport({ service: "gmail", auth: { user: gmailUser, pass: gmailAppPassword } });
            await transporter.sendMail({
              from: `"Chatbot Notifications" <${gmailUser}>`,
              to: recipients.join(", "),
              cc: ccList.length > 0 ? ccList.join(", ") : undefined,
              subject,
              text: `New Quote Request\n\nVisitor: ${body.name} <${body.email}>\n\nMessage:\n${body.message}\n\nReceived: ${timestamp}`,
            });
            jsonRes(res, 200, { success: true });
          } catch (error) {
            jsonRes(res, 500, { error: "Failed to send notification email", details: error instanceof Error ? error.message : "Unknown error" });
          }
        },
      );
    },
  };
}
