import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect, PluginOption, ViteDevServer } from "vite";
import { mergeWithDefaults, type ServiceEntry, type QuickLink, type DatasetEntry } from "@duran-chatbot/config";
import prisma, {
  getEmailIntegration,
  saveEmailIntegration,
  sendProfileEmail,
} from "@duran-chatbot/database";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";

const GEMINI_MODELS_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_SLUG = "duran-schulze";
const DEFAULT_PROFILE_NAME = "Duran Schulze";

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

// ─── Rate limiting for quote-request ──────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) ?? {
    count: 0,
    resetAt: now + 10 * 60 * 1000,
  };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + 10 * 60 * 1000;
  }
  entry.count += 1;
  rateLimitMap.set(ip, entry);
  return entry.count > 5;
}

function getClientIp(req: IncomingMessage): string {
  const fwd = req.headers["x-forwarded-for"];
  return (
    (Array.isArray(fwd) ? fwd[0] : fwd?.split(",")[0]?.trim()) ??
    req.socket?.remoteAddress ??
    "unknown"
  );
}

function jsonRes(res: ServerResponse, status: number, body: unknown) {
  res.setHeader("Content-Type", "application/json");
  res.statusCode = status;
  res.end(JSON.stringify(body));
}

// ─── JSON cast helper for Prisma Json fields ────────────────────

function asJson<T>(value: T): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

// ─── Profile / Config helpers ─────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function configRowToPartial(
  config: {
    appearance: unknown;
    ai: unknown;
    persona: unknown;
    services: unknown;
    quickLinks: unknown;
    dataset: unknown;
    behavior: unknown;
  } | null,
): Partial<import("@duran-chatbot/config").ChatbotConfig> {
  if (!config) return {};
  return {
    appearance: config.appearance as Partial<import("@duran-chatbot/config").ChatbotConfig>["appearance"],
    ai: config.ai as Partial<import("@duran-chatbot/config").ChatbotConfig>["ai"],
    persona: config.persona as Partial<import("@duran-chatbot/config").ChatbotConfig>["persona"],
    services: config.services as ServiceEntry[] | undefined,
    quickLinks: config.quickLinks as QuickLink[] | undefined,
    dataset: config.dataset as DatasetEntry[] | undefined,
    behavior: config.behavior as Partial<import("@duran-chatbot/config").ChatbotConfig>["behavior"],
  };
}

async function getOrBootstrapProfile(slug: string) {
  let profile = await prisma.profile.findUnique({
    where: { slug },
    include: { config: true },
  });

  if (!profile) {
    const defaults = mergeWithDefaults({});
    const { ai: { apiKey: _dropped, ...ai }, ...rest } = defaults;
    profile = await prisma.profile.create({
      data: {
        slug,
        name: slug === DEFAULT_SLUG ? DEFAULT_PROFILE_NAME : slug,
        status: "active",
        config: {
          create: {
            appearance: asJson(rest.appearance),
            ai: asJson(ai),
            persona: asJson(rest.persona),
            services: asJson(rest.services),
            quickLinks: asJson(rest.quickLinks),
            dataset: asJson(rest.dataset),
            behavior: asJson(rest.behavior),
          },
        },
      },
      include: { config: true },
    });
  }

  return profile;
}

function buildEmailHtml({
  name,
  email,
  message,
  service,
  profile,
  timestamp,
}: {
  name: string;
  email: string;
  message: string;
  service: string;
  profile: string;
  timestamp: string;
}) {
  const safe = (s: string) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:#004a99;padding:24px 32px">
            <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700">New Quote Request</p>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:13px">${safe(profile || "Chatbot")}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:20px;border-bottom:1px solid #e9ecef">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280">Visitor</p>
                  <p style="margin:0;font-size:16px;font-weight:600;color:#111827">${safe(name)}</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#4b5563"><a href="mailto:${safe(email)}" style="color:#004a99">${safe(email)}</a></p>
                </td>
              </tr>
              ${
                service
                  ? `<tr>
                <td style="padding:20px 0;border-bottom:1px solid #e9ecef">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280">Service / Topic</p>
                  <p style="margin:0;font-size:14px;color:#111827">${safe(service)}</p>
                </td>
              </tr>`
                  : ""
              }
              <tr>
                <td style="padding:20px 0;border-bottom:1px solid #e9ecef">
                  <p style="margin:0 0 8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280">Message</p>
                  <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;white-space:pre-wrap">${safe(message)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding-top:20px">
                  <p style="margin:0;font-size:12px;color:#9ca3af">Received: ${safe(timestamp)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Starter email addressed to the visitor, with the sales team CC'd so everyone
// shares one thread and can reply-all to follow up.
function buildStarterEmailHtml({
  name,
  service,
  companyName,
  timestamp,
}: {
  name: string;
  service: string;
  companyName: string;
  timestamp: string;
}) {
  const safe = (s: string) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:#004a99;padding:24px 32px">
            <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700">Thanks for your request</p>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:13px">${safe(companyName)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 16px;font-size:15px;color:#111827">Hi ${safe(name) || "there"},</p>
            <p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6">Thanks for reaching out to ${safe(companyName)}. We've received your request and a member of our team (cc'd here) will follow up shortly. Feel free to reply to this email with any extra details.</p>
            ${service ? `<p style="margin:0 0 8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280">What you asked about</p>
            <p style="margin:0 0 16px;font-size:14px;color:#111827;line-height:1.6;white-space:pre-wrap">${safe(service)}</p>` : ""}
            <p style="margin:24px 0 0;font-size:13px;color:#6b7280">Sent: ${safe(timestamp)}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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

          if (req.method === "OPTIONS") {
            res.statusCode = 204;
            res.end();
            return;
          }
          if (req.method !== "POST") {
            jsonRes(res, 405, { error: "Method not allowed" });
            return;
          }

          const body = (await readRequestBody(req)) as {
            username?: string;
            password?: string;
          };
          const { username, password } = body;

          const validUsername = process.env.AUTH_USERNAME;
          const validPassword = process.env.AUTH_PASSWORD;
          const jwtSecret = process.env.AUTH_JWT_SECRET;

          if (!validUsername || !validPassword || !jwtSecret) {
            jsonRes(res, 500, {
              error: "Auth is not configured on the server",
            });
            return;
          }
          if (username !== validUsername || password !== validPassword) {
            jsonRes(res, 401, {
              error: "Invalid username or password",
            });
            return;
          }

          const token = jwt.sign({ username }, jwtSecret, { expiresIn: "7d" });
          jsonRes(res, 200, { token });
        },
      );

      // ── /api/warmup ───────────────────────────────────────────────
      server.middlewares.use(
        "/api/warmup",
        async (req: IncomingMessage, res: ServerResponse) => {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type");
          res.setHeader("Cache-Control", "no-store");

          if (req.method === "OPTIONS") {
            res.statusCode = 204;
            res.end();
            return;
          }

          try {
            await prisma.$queryRaw`SELECT 1`;
            jsonRes(res, 200, { ok: true });
          } catch {
            jsonRes(res, 200, { ok: false });
          }
        },
      );

      // ── /api/chat-log ─────────────────────────────────────────────
      server.middlewares.use(
        "/api/chat-log",
        async (req: IncomingMessage, res: ServerResponse) => {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type");

          if (req.method === "OPTIONS") {
            res.statusCode = 204;
            res.end();
            return;
          }
          if (req.method !== "POST") {
            jsonRes(res, 405, { error: "Method not allowed" });
            return;
          }

          let body: {
            profile?: string;
            sessionId?: string;
            userName?: string;
            userEmail?: string;
            userMessage?: string;
            aiResponse?: string;
          };
          try {
            body = (await readRequestBody(req)) as typeof body;
          } catch {
            jsonRes(res, 400, { error: "Invalid request body" });
            return;
          }

          const {
            profile,
            sessionId,
            userName,
            userEmail,
            userMessage,
            aiResponse,
          } = body;
          if (!userMessage || !aiResponse) {
            jsonRes(res, 400, {
              error: "userMessage and aiResponse are required",
            });
            return;
          }

          const profileId = profile || DEFAULT_SLUG;
          const now = new Date();

          try {
            // Ensure profile exists before logging
            await prisma.profile.upsert({
              where: { slug: profileId },
              create: {
                slug: profileId,
                name: profileId,
                status: "active",
              },
              update: {},
            });

            const conversation = await prisma.conversation.upsert({
              where: {
                sessionId_profileId: {
                  sessionId: sessionId || "",
                  profileId,
                },
              },
              create: {
                sessionId: sessionId || "",
                profileId,
                userName: userName || "",
                userEmail: userEmail || "",
                firstSeen: now,
                lastActive: now,
              },
              update: {
                lastActive: now,
                userName: userName || "",
                userEmail: userEmail || "",
              },
            });

            await prisma.message.createMany({
              data: [
                {
                  conversationId: conversation.id,
                  role: "user",
                  content: userMessage,
                  timestamp: now,
                },
                {
                  conversationId: conversation.id,
                  role: "assistant",
                  content: aiResponse,
                  timestamp: now,
                },
              ],
            });

            jsonRes(res, 200, { success: true });
          } catch (error) {
            console.error("chat-log error:", error);
            jsonRes(res, 500, {
              error: "Failed to log conversation",
              details:
                error instanceof Error ? error.message : "Unknown error",
            });
          }
        },
      );

      // ── /api/conversations ────────────────────────────────────────
      server.middlewares.use(
        "/api/conversations",
        async (req: IncomingMessage, res: ServerResponse) => {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

          if (req.method === "OPTIONS") {
            res.statusCode = 204;
            res.end();
            return;
          }
          if (req.method !== "GET" && req.method !== "POST") {
            jsonRes(res, 405, { error: "Method not allowed" });
            return;
          }

          const authHeader = (req.headers["authorization"] as string) || "";
          const token = authHeader.startsWith("Bearer ")
            ? authHeader.slice(7)
            : "";
          const jwtSecret = process.env.AUTH_JWT_SECRET;
          if (!token || !jwtSecret) {
            jsonRes(res, 401, { error: "Unauthorized" });
            return;
          }
          try {
            jwt.verify(token, jwtSecret);
          } catch {
            jsonRes(res, 401, { error: "Unauthorized" });
            return;
          }

          const url = new URL(req.url ?? "/", "http://localhost");
          const profile = url.searchParams.get("profile") ?? "default";

          // ── POST: admin reply or mark-read ───────────────────────
          if (req.method === "POST") {
            let body: {
              action?: string;
              profile?: string;
              sessionId?: string;
              content?: string;
              senderName?: string;
            };
            try {
              body = (await readRequestBody(req)) as typeof body;
            } catch {
              jsonRes(res, 400, { error: "Invalid request body" });
              return;
            }

            const profileId = body.profile || profile || "default";
            const sessionId = body.sessionId;
            if (!sessionId) {
              jsonRes(res, 400, { error: "sessionId is required" });
              return;
            }

            try {
              const conversation = await prisma.conversation.findUnique({
                where: { sessionId_profileId: { sessionId, profileId } },
              });
              if (!conversation) {
                jsonRes(res, 404, { error: "Conversation not found" });
                return;
              }

              if (body.action === "markRead") {
                await prisma.conversation.update({
                  where: { id: conversation.id },
                  data: { adminReadAt: new Date() },
                });
                jsonRes(res, 200, { success: true });
                return;
              }

              if (!body.content || !body.content.trim()) {
                jsonRes(res, 400, { error: "content is required" });
                return;
              }
              const now = new Date();
              // Show the brand persona (or company name) to visitors — never the
              // admin login — so the conversation feels like one consistent voice.
              let resolvedName = "";
              try {
                const cfg = await prisma.config.findUnique({
                  where: { profileId },
                });
                const persona = cfg?.persona as
                  | { enabled?: boolean; personaName?: string }
                  | undefined;
                const appearance = cfg?.appearance as
                  | { companyName?: string }
                  | undefined;
                if (persona?.enabled && persona?.personaName?.trim()) {
                  resolvedName = persona.personaName.trim();
                } else if (appearance?.companyName?.trim()) {
                  resolvedName = appearance.companyName.trim();
                }
              } catch {
                /* config unavailable — fall through to default */
              }
              const senderName =
                (body.senderName && body.senderName.trim()) ||
                resolvedName ||
                "Support";
              const message = await prisma.message.create({
                data: {
                  conversationId: conversation.id,
                  role: "admin",
                  content: body.content.trim(),
                  senderName,
                  timestamp: now,
                },
              });
              await prisma.conversation.update({
                where: { id: conversation.id },
                data: { lastActive: now, adminReadAt: now },
              });

              jsonRes(res, 200, {
                message: {
                  role: message.role,
                  content: message.content,
                  senderName: message.senderName,
                  timestamp: message.timestamp.toISOString(),
                },
              });
            } catch (error) {
              console.error("conversations POST error:", error);
              jsonRes(res, 500, {
                error: "Failed to post reply",
                details:
                  error instanceof Error ? error.message : "Unknown error",
              });
            }
            return;
          }

          // ── GET: list conversations ──────────────────────────────
          try {
            const conversations = await prisma.conversation.findMany({
              where: { profileId: profile },
              include: {
                messages: { orderBy: { timestamp: "asc" } },
              },
              orderBy: { lastActive: "desc" },
            });

            const sessions = conversations.map((conv) => ({
              sessionId: conv.sessionId,
              userName: conv.userName,
              userEmail: conv.userEmail,
              profile: conv.profileId,
              firstSeen: conv.firstSeen.toISOString(),
              lastActive: conv.lastActive.toISOString(),
              adminReadAt: conv.adminReadAt
                ? conv.adminReadAt.toISOString()
                : null,
              messages: conv.messages.map((m) => ({
                role: m.role,
                content: m.content,
                senderName: m.senderName ?? null,
                timestamp: m.timestamp.toISOString(),
              })),
            }));

            jsonRes(res, 200, { sessions });
          } catch (error) {
            console.error("conversations error:", error);
            jsonRes(res, 500, {
              error: "Failed to read conversations",
              details:
                error instanceof Error ? error.message : "Unknown error",
            });
          }
        },
      );

      // ── /api/messages (public widget polling) ─────────────────────
      server.middlewares.use(
        "/api/messages",
        async (req: IncomingMessage, res: ServerResponse) => {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type");
          res.setHeader("Cache-Control", "no-store");

          if (req.method === "OPTIONS") {
            res.statusCode = 204;
            res.end();
            return;
          }
          if (req.method !== "GET") {
            jsonRes(res, 405, { error: "Method not allowed" });
            return;
          }

          const url = new URL(req.url ?? "/", "http://localhost");
          const profileId = url.searchParams.get("profile") ?? "default";
          const sessionId = url.searchParams.get("sessionId") ?? "";
          if (!sessionId) {
            jsonRes(res, 400, { error: "sessionId is required" });
            return;
          }

          try {
            const conversation = await prisma.conversation.findUnique({
              where: { sessionId_profileId: { sessionId, profileId } },
              include: { messages: { orderBy: { timestamp: "asc" } } },
            });
            if (!conversation) {
              jsonRes(res, 200, { messages: [] });
              return;
            }
            jsonRes(res, 200, {
              messages: conversation.messages.map((m) => ({
                role: m.role,
                content: m.content,
                senderName: m.senderName ?? null,
                timestamp: m.timestamp.toISOString(),
              })),
            });
          } catch (error) {
            console.error("messages error:", error);
            jsonRes(res, 500, {
              error: "Failed to read messages",
              details:
                error instanceof Error ? error.message : "Unknown error",
            });
          }
        },
      );

      // ── /api/email-integration ────────────────────────────────────
      server.middlewares.use(
        "/api/email-integration",
        async (req: IncomingMessage, res: ServerResponse) => {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader(
            "Access-Control-Allow-Methods",
            "GET, PUT, POST, OPTIONS",
          );
          res.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization",
          );

          if (req.method === "OPTIONS") {
            res.statusCode = 204;
            res.end();
            return;
          }

          const authHeader = (req.headers["authorization"] as string) || "";
          const token = authHeader.startsWith("Bearer ")
            ? authHeader.slice(7)
            : "";
          const jwtSecret = process.env.AUTH_JWT_SECRET;
          if (!token || !jwtSecret) {
            jsonRes(res, 401, { error: "Unauthorized" });
            return;
          }
          try {
            jwt.verify(token, jwtSecret);
          } catch {
            jsonRes(res, 401, { error: "Unauthorized" });
            return;
          }

          const url = new URL(req.url ?? "/", "http://localhost");
          const profile = url.searchParams.get("profile") ?? "default";

          const EMPTY = {
            provider: "resend",
            fromEmail: null,
            fromName: null,
            hasSecret: false,
            configured: false,
          };

          try {
            if (req.method === "GET") {
              const integration = await getEmailIntegration(profile);
              jsonRes(res, 200, { integration: integration ?? EMPTY });
              return;
            }

            if (req.method === "PUT") {
              const body = (await readRequestBody(req)) as {
                secret?: string;
                fromEmail?: string;
                fromName?: string;
              };
              const integration = await saveEmailIntegration(profile, {
                secret: body.secret ?? null,
                fromEmail: body.fromEmail ?? null,
                fromName: body.fromName ?? null,
              });
              jsonRes(res, 200, { integration });
              return;
            }

            if (req.method === "POST") {
              const body = (await readRequestBody(req)) as { to?: string };
              const to = (body.to ?? "").trim();
              if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
                jsonRes(res, 400, {
                  error: "A valid recipient email is required",
                });
                return;
              }
              await sendProfileEmail(profile, {
                to,
                subject: "Test email from your chatbot",
                text: "This is a test email confirming your email integration works.",
                html: "<p>This is a <strong>test email</strong> confirming your email integration works. 🎉</p>",
              });
              jsonRes(res, 200, { success: true });
              return;
            }

            res.setHeader("Allow", "GET, PUT, POST");
            jsonRes(res, 405, { error: "Method not allowed" });
          } catch (error) {
            console.error("email-integration error:", error);
            jsonRes(res, 500, {
              error: "Email integration operation failed",
              details:
                error instanceof Error ? error.message : "Unknown error",
            });
          }
        },
      );

      // ── /api/models ───────────────────────────────────────────────
      server.middlewares.use(
        "/api/models",
        async (_req: IncomingMessage, res: ServerResponse) => {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type");

          if (_req.method === "OPTIONS") {
            res.statusCode = 204;
            res.end();
            return;
          }

          const geminiApiKey = process.env.GEMINI_API_KEY;

          if (!geminiApiKey) {
            jsonRes(res, 500, {
              error: "GEMINI_API_KEY is not configured",
            });
            return;
          }

          try {
            const response = await fetch(
              `${GEMINI_MODELS_URL}?key=${geminiApiKey}`,
            );

            if (!response.ok) {
              const details = await response.text();
              jsonRes(res, response.status, {
                error: "Failed to fetch Gemini models",
                details: details || response.statusText,
              });
              return;
            }

            const payload = (await response.json()) as unknown;
            jsonRes(res, 200, { models: normalizeModels(payload) });
          } catch (error) {
            jsonRes(res, 500, {
              error: "Failed to fetch Gemini models",
              details:
                error instanceof Error ? error.message : "Unknown error",
            });
          }
        },
      );

      // ── /api/config ──────────────────────────────────────────────
      server.middlewares.use(
        "/api/config",
        async (
          req: IncomingMessage,
          res: ServerResponse,
          next: Connect.NextFunction,
        ) => {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type");

          if (req.method === "OPTIONS") {
            res.statusCode = 204;
            res.end();
            return;
          }

          const configUrl = new URL(req.url ?? "/", "http://localhost");
          const profileSlug =
            configUrl.searchParams.get("profile") ?? "";
          const slug = profileSlug || DEFAULT_SLUG;
          const geminiApiKey = process.env.GEMINI_API_KEY ?? "";

          if (req.method === "GET") {
            try {
              const profile = await getOrBootstrapProfile(slug);
              const merged = mergeWithDefaults(
                configRowToPartial(profile.config!),
              );
              merged.ai.apiKey = geminiApiKey;

              jsonRes(res, 200, merged);
            } catch (error) {
              jsonRes(res, 500, {
                error: "Failed to read config",
                details:
                  error instanceof Error ? error.message : "Unknown error",
              });
            }
            return;
          }

          if (req.method === "POST") {
            try {
              const body = await readRequestBody(req);
              const normalizedConfig = mergeWithDefaults(body);
              const {
                ai: { apiKey: _dropped, ...ai },
                ...rest
              } = normalizedConfig;
              const createData = {
                profileId: slug,
                appearance: asJson(rest.appearance),
                ai: asJson(ai),
                persona: asJson(rest.persona),
                services: asJson(rest.services),
                quickLinks: asJson(rest.quickLinks),
                dataset: asJson(rest.dataset),
                behavior: asJson(rest.behavior),
              };

              await prisma.profile.upsert({
                where: { slug },
                create: {
                  slug,
                  name:
                    slug === DEFAULT_SLUG
                      ? DEFAULT_PROFILE_NAME
                      : slug,
                  status: "active",
                },
                update: {},
              });

              const updateData = { ...createData };
              delete (updateData as Record<string, unknown>).profileId;

              await prisma.config.upsert({
                where: { profileId: slug },
                create: createData,
                update: updateData,
              });

              jsonRes(res, 200, { success: true });
            } catch (error) {
              jsonRes(res, 500, {
                error: "Failed to save config",
                details:
                  error instanceof Error ? error.message : "Unknown error",
              });
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
          res.setHeader(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE, OPTIONS",
          );
          res.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type",
          );

          if (req.method === "OPTIONS") {
            res.statusCode = 204;
            res.end();
            return;
          }

          const url = new URL(req.url ?? "/", "http://localhost");
          let slug = url.searchParams.get("slug") ?? "";

          try {
            if (req.method === "GET") {
              if (slug) {
                if (url.searchParams.get("metadata") === "1") {
                  const profile = await prisma.profile.findUnique({
                    where: { slug },
                    select: { slug: true, name: true, status: true, createdAt: true },
                  });
                  jsonRes(res, profile ? 200 : 404, profile ?? { error: "Profile not found" });
                  return;
                }
                const profile = await prisma.profile.findUnique({
                  where: { slug },
                  include: { config: true },
                });
                if (!profile) {
                  jsonRes(res, 404, { error: "Profile not found" });
                  return;
                }
                const merged = mergeWithDefaults(
                  configRowToPartial(profile.config),
                );
                const {
                  ai: { apiKey: _dropped, ...ai },
                  ...rest
                } = merged;
                jsonRes(res, 200, {
                  slug: profile.slug,
                  name: profile.name,
                  status: profile.status,
                  createdAt: profile.createdAt.toISOString(),
                  config: { ...rest, ai },
                });
                return;
              }

              const profiles = await prisma.profile.findMany({
                orderBy: { createdAt: "asc" },
              });
              jsonRes(res, 200, {
                profiles: profiles.map((p) => ({
                  slug: p.slug,
                  name: p.name,
                  status: p.status,
                  createdAt: p.createdAt.toISOString(),
                })),
              });
              return;
            }

            if (req.method === "POST") {
              const body = (await readRequestBody(req)) as {
                name?: string;
                slug?: string;
                cloneFrom?: string;
              };
              const name = (body.name ?? "").trim();
              if (!name) {
                jsonRes(res, 400, {
                  error: "Profile name is required",
                });
                return;
              }

              const rawSlug = body.slug
                ? body.slug.trim()
                : slugify(name);
              const finalSlug = rawSlug || slugify(name);

              const existing = await prisma.profile.findUnique({
                where: { slug: finalSlug },
              });
              if (existing) {
                jsonRes(res, 409, {
                  error: "A profile with this slug already exists",
                });
                return;
              }

              // Build default config, optionally cloned from an existing profile
              let configData: {
                appearance: Prisma.InputJsonValue;
                ai: Prisma.InputJsonValue;
                persona: Prisma.InputJsonValue;
                services: Prisma.InputJsonValue;
                quickLinks: Prisma.InputJsonValue;
                dataset: Prisma.InputJsonValue;
                behavior: Prisma.InputJsonValue;
              };

              if (body.cloneFrom) {
                const source = await prisma.profile.findUnique({
                  where: { slug: body.cloneFrom },
                  include: { config: true },
                });
                if (source?.config) {
                  const defaults = mergeWithDefaults(
                    configRowToPartial(source.config),
                  );
                  const {
                    ai: { apiKey: _dropped, ...ai },
                    ...rest
                  } = defaults;
                  configData = {
                    appearance: asJson(rest.appearance),
                    ai: asJson(ai),
                    persona: asJson(rest.persona),
                    services: asJson(rest.services),
                    quickLinks: asJson(rest.quickLinks),
                    dataset: asJson(rest.dataset),
                    behavior: asJson(rest.behavior),
                  };
                } else {
                  configData = buildDefaultConfigData();
                }
              } else {
                configData = buildDefaultConfigData();
              }

              const newProfile = await prisma.profile.create({
                data: {
                  slug: finalSlug,
                  name,
                  status: "active",
                  config: { create: configData },
                },
              });

              jsonRes(res, 201, {
                slug: newProfile.slug,
                name: newProfile.name,
                status: newProfile.status,
                createdAt: newProfile.createdAt.toISOString(),
              });
              return;
            }

            if (req.method === "PUT") {
              if (!slug) {
                jsonRes(res, 400, {
                  error: "slug query param required",
                });
                return;
              }

              const profile = await prisma.profile.findUnique({
                where: { slug },
              });
              if (!profile) {
                jsonRes(res, 404, {
                  error: "Profile not found",
                });
                return;
              }

              const body = (await readRequestBody(req)) as {
                slug?: string;
                config?: unknown;
                name?: string;
                status?: string;
              };

              // Allow renaming the slug (primary key — requires updating FK references)
              if (
                body.slug &&
                typeof body.slug === "string" &&
                body.slug.trim() &&
                body.slug !== slug
              ) {
                const newSlug = body.slug.trim();

                if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(newSlug)) {
                  jsonRes(res, 400, {
                    error: "Slug must use only lowercase letters, numbers, and hyphens",
                  });
                  return;
                }

                const existing = await prisma.profile.findUnique({
                  where: { slug: newSlug },
                });
                if (existing) {
                  jsonRes(res, 409, {
                    error: "A profile with this slug already exists",
                  });
                  return;
                }

                await prisma.$transaction([
                  prisma.$executeRawUnsafe(
                    `UPDATE "Profile" SET slug = $1 WHERE slug = $2`,
                    newSlug,
                    slug,
                  ),
                  prisma.$executeRawUnsafe(
                    `UPDATE "Config" SET "profileId" = $1 WHERE "profileId" = $2`,
                    newSlug,
                    slug,
                  ),
                  prisma.$executeRawUnsafe(
                    `UPDATE "Conversation" SET "profileId" = $1 WHERE "profileId" = $2`,
                    newSlug,
                    slug,
                  ),
                  prisma.$executeRawUnsafe(
                    `UPDATE "QuoteRequest" SET "profileId" = $1 WHERE "profileId" = $2`,
                    newSlug,
                    slug,
                  ),
                ]);

                slug = newSlug;
              }

              // Allow reactivating an archived profile
              if (body.status && ["active", "archived"].includes(body.status)) {
                await prisma.profile.update({
                  where: { slug },
                  data: { status: body.status },
                });
              }

              if (body.config) {
                const normalized = mergeWithDefaults(
                  body.config as Parameters<
                    typeof mergeWithDefaults
                  >[0],
                );
                const {
                  ai: { apiKey: _dropped, ...ai },
                  ...rest
                } = normalized;
                const createData = {
                  profileId: slug,
                  appearance: asJson(rest.appearance),
                  ai: asJson(ai),
                  persona: asJson(rest.persona),
                  services: asJson(rest.services),
                  quickLinks: asJson(rest.quickLinks),
                  dataset: asJson(rest.dataset),
                  behavior: asJson(rest.behavior),
                };
                const updateData = { ...createData };
                delete (updateData as Record<string, unknown>).profileId;
                await prisma.config.upsert({
                  where: { profileId: slug },
                  create: createData,
                  update: updateData,
                });
              }

              if (body.name) {
                await prisma.profile.update({
                  where: { slug },
                  data: { name: body.name },
                });
              }

              jsonRes(res, 200, { success: true });
              return;
            }

            if (req.method === "DELETE") {
              if (!slug) {
                jsonRes(res, 400, {
                  error: "slug query param required",
                });
                return;
              }

              const mode = url.searchParams.get("mode") || "archive";

              const profile = await prisma.profile.findUnique({
                where: { slug },
              });
              if (!profile) {
                jsonRes(res, 404, {
                  error: "Profile not found",
                });
                return;
              }

              if (mode === "hard") {
                // Permanently delete the profile and ALL connected data.
                // Delete in dependency order (children first) as a safety net
                // on top of Prisma's onDelete: Cascade.
                await prisma.$transaction([
                  prisma.$executeRawUnsafe(
                    `DELETE FROM "Message" WHERE "conversationId" IN (SELECT "id" FROM "Conversation" WHERE "profileId" = $1)`,
                    slug,
                  ),
                  prisma.$executeRawUnsafe(
                    `DELETE FROM "Conversation" WHERE "profileId" = $1`,
                    slug,
                  ),
                  prisma.$executeRawUnsafe(
                    `DELETE FROM "QuoteRequest" WHERE "profileId" = $1`,
                    slug,
                  ),
                  prisma.$executeRawUnsafe(
                    `DELETE FROM "Config" WHERE "profileId" = $1`,
                    slug,
                  ),
                  prisma.$executeRawUnsafe(
                    `DELETE FROM "EmailIntegration" WHERE "profileId" = $1`,
                    slug,
                  ),
                  prisma.$executeRawUnsafe(
                    `DELETE FROM "Profile" WHERE "slug" = $1`,
                    slug,
                  ),
                ]);
                jsonRes(res, 200, { success: true, action: "deleted" });
                return;
              }

              // Default: archive (soft delete)
              const activeCount = await prisma.profile.count({
                where: { status: "active" },
              });
              if (activeCount <= 1) {
                jsonRes(res, 400, {
                  error: "Cannot archive the last active profile",
                });
                return;
              }

              await prisma.profile.update({
                where: { slug },
                data: { status: "archived" },
              });

              jsonRes(res, 200, { success: true, action: "archived" });
              return;
            }

            res.setHeader("Allow", "GET, POST, PUT, DELETE");
            jsonRes(res, 405, { error: "Method not allowed" });
          } catch (error) {
            jsonRes(res, 500, {
              error: "Profiles operation failed",
              details:
                error instanceof Error
                  ? error.message
                  : "Unknown error",
            });
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

          if (req.method === "OPTIONS") {
            res.statusCode = 204;
            res.end();
            return;
          }
          if (req.method !== "POST") {
            jsonRes(res, 405, { error: "Method not allowed" });
            return;
          }

          const ip = getClientIp(req);
          if (isRateLimited(ip)) {
            jsonRes(res, 429, {
              error: "Too many requests. Please try again later.",
            });
            return;
          }

          let body: {
            name?: string;
            email?: string;
            message?: string;
            service?: string;
            profile?: string;
            honeypot?: string;
            emailVisitor?: boolean;
          };
          try {
            body = (await readRequestBody(req)) as typeof body;
          } catch {
            jsonRes(res, 400, { error: "Invalid request body" });
            return;
          }

          if (body.honeypot) {
            jsonRes(res, 200, { success: true });
            return;
          }
          if (!body.name?.trim()) {
            jsonRes(res, 400, { error: "Name is required" });
            return;
          }
          if (
            !body.email?.trim() ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
          ) {
            jsonRes(res, 400, {
              error: "A valid email address is required",
            });
            return;
          }
          if (!body.message?.trim()) {
            jsonRes(res, 400, { error: "Message is required" });
            return;
          }

          // Get recipients from profile config via Prisma
          let recipients: string[] = [];
          let ccList: string[] = [];
          let subject = "New Quote Request via Chatbot";
          let starterSubject = "";
          let companyName = body.profile || "Our team";

          try {
            const profileSlug = body.profile || DEFAULT_SLUG;
            const config = await prisma.config.findUnique({
              where: { profileId: profileSlug },
            });
            if (config?.behavior) {
              const behavior = config.behavior as {
                quoteNotifyTo?: string[];
                quoteNotifyCC?: string[];
                quoteEmailSubject?: string;
                quoteStarterSubject?: string;
              };
              recipients = behavior.quoteNotifyTo?.filter(Boolean) ?? [];
              ccList = behavior.quoteNotifyCC?.filter(Boolean) ?? [];
              subject =
                behavior.quoteEmailSubject?.trim() || subject;
              starterSubject = behavior.quoteStarterSubject?.trim() || "";
            }
            const appearance = config?.appearance as
              | { companyName?: string }
              | undefined;
            companyName = appearance?.companyName?.trim() || companyName;

            if (recipients.length === 0) {
              // Fallback: try default profile
              const defaultConfig = await prisma.config.findUnique({
                where: { profileId: DEFAULT_SLUG },
              });
              if (defaultConfig?.behavior) {
                const behavior = defaultConfig.behavior as {
                  quoteNotifyTo?: string[];
                };
                recipients =
                  behavior.quoteNotifyTo?.filter(Boolean) ?? [];
              }
            }
          } catch {
            /* DB unavailable — recipients stay empty */
          }

          // Internal-only mode still requires a sales recipient. Visitor-starter
          // mode emails the visitor directly, so sales is only used for CC.
          if (!body.emailVisitor && recipients.length === 0) {
            jsonRes(res, 500, {
              error:
                "No notification recipients configured for this profile",
            });
            return;
          }

          const timestamp = new Date().toLocaleString("en-US", {
            timeZone: "Asia/Manila",
            dateStyle: "long",
            timeStyle: "short",
          });

          const mailOptions = body.emailVisitor
            ? {
                fromName: companyName,
                to: body.email!.trim(),
                cc:
                  [...new Set([...recipients, ...ccList])].join(", ") ||
                  undefined,
                replyTo: recipients[0] || undefined,
                subject:
                  starterSubject || `Your request to ${companyName}`,
                text: `Hi ${body.name!.trim() || "there"},\n\nThanks for reaching out to ${companyName}. We've received your request and a member of our team (cc'd here) will follow up shortly.\n${body.service ? `\nWhat you asked about:\n${body.service}\n` : ""}\nSent: ${timestamp}`,
                html: buildStarterEmailHtml({
                  name: body.name!.trim(),
                  service: body.service?.trim() ?? "",
                  companyName,
                  timestamp,
                }),
              }
            : {
                fromName: "Chatbot Notifications",
                to: recipients.join(", "),
                cc: ccList.length > 0 ? ccList.join(", ") : undefined,
                subject,
                text: `New Quote Request — ${body.profile || "Chatbot"}\n\nVisitor: ${body.name} <${body.email}>\n${body.service ? `Service/Topic: ${body.service}\n` : ""}\nMessage:\n${body.message}\n\nReceived: ${timestamp}`,
                html: buildEmailHtml({
                  name: body.name!.trim(),
                  email: body.email!.trim(),
                  message: body.message!.trim(),
                  service: body.service?.trim() ?? "",
                  profile: body.profile || "Chatbot",
                  timestamp,
                }),
              };

          try {
            await sendProfileEmail(body.profile || DEFAULT_SLUG, mailOptions);

            // Persist quote request (best-effort)
            try {
              const profileId = body.profile || DEFAULT_SLUG;
              await prisma.profile.upsert({
                where: { slug: profileId },
                create: {
                  slug: profileId,
                  name: profileId,
                  status: "active",
                },
                update: {},
              });
              await prisma.quoteRequest.create({
                data: {
                  profileId,
                  name: body.name.trim(),
                  email: body.email.trim(),
                  message: body.message.trim(),
                  service: body.service?.trim() ?? "",
                },
              });
            } catch (dbErr) {
              console.error(
                "Failed to persist quote request to DB:",
                dbErr,
              );
            }

            jsonRes(res, 200, { success: true });
          } catch (error) {
            console.error("Quote request email failed:", error);
            jsonRes(res, 500, {
              error: "Failed to send notification email",
              details:
                error instanceof Error
                  ? error.message
                  : "Unknown error",
            });
          }
        },
      );
    },
  };
}

// ─── Default config builder ───────────────────────────────────────

function buildDefaultConfigData() {
  const defaults = mergeWithDefaults({});
  const { ai: { apiKey: _dropped, ...ai }, ...rest } = defaults;
  return {
    appearance: asJson(rest.appearance),
    ai: asJson(ai),
    persona: asJson(rest.persona),
    services: asJson(rest.services),
    quickLinks: asJson(rest.quickLinks),
    dataset: asJson(rest.dataset),
    behavior: asJson(rest.behavior),
  };
}
