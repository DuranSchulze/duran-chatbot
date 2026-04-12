import { createTransport } from "nodemailer";
import { createClient } from "redis";
import { mergeWithDefaults } from "@duran-chatbot/config";

const PROFILES_INDEX_KEY = "chatbot:profiles";
const PROFILE_KEY = (slug) => `chatbot:profile:${slug}`;
const DEFAULT_SLUG = "duran-schulze";

const redisUrl = process.env.REDIS_URL;
const redis = redisUrl ? createClient({ url: redisUrl }) : null;
const redisConnection = redis ? redis.connect() : null;

const rateLimitMap = new Map();

async function getRedisClient() {
  if (!redis || !redisConnection) return null;
  await redisConnection;
  return redis;
}

function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const maxRequests = 5;

  const entry = rateLimitMap.get(ip) ?? { count: 0, resetAt: now + windowMs };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }

  entry.count += 1;
  rateLimitMap.set(ip, entry);

  return entry.count > maxRequests;
}

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

async function readBodySafe(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function getProfileBehavior(profileSlug) {
  try {
    const client = await getRedisClient();
    if (!client) return null;

    const slug = profileSlug || DEFAULT_SLUG;
    const raw = await client.get(PROFILE_KEY(slug));
    if (!raw) return null;

    const config = mergeWithDefaults(JSON.parse(raw));
    return config.behavior;
  } catch {
    return null;
  }
}

function buildEmailHtml({ name, email, message, service, profile, timestamp }) {
  const safe = (s) =>
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
              ${service ? `<tr>
                <td style="padding:20px 0;border-bottom:1px solid #e9ecef">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280">Service / Topic</p>
                  <p style="margin:0;font-size:14px;color:#111827">${safe(service)}</p>
                </td>
              </tr>` : ""}
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

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    res.status(429).json({ error: "Too many requests. Please try again later." });
    return;
  }

  let body;
  try {
    body = await readBodySafe(req);
  } catch {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { name, email, message, service, profile, honeypot } = body;

  if (honeypot) {
    res.status(200).json({ success: true });
    return;
  }

  if (!name?.trim()) {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email?.trim() || !emailPattern.test(email.trim())) {
    res.status(400).json({ error: "A valid email address is required" });
    return;
  }

  if (!message?.trim()) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    res.status(500).json({ error: "Email service is not configured" });
    return;
  }

  const behavior = await getProfileBehavior(profile);
  const recipients = behavior?.quoteNotifyTo?.filter(Boolean) ?? [];
  const ccList = behavior?.quoteNotifyCC?.filter(Boolean) ?? [];
  const subject =
    behavior?.quoteEmailSubject?.trim() || "New Quote Request via Chatbot";

  if (recipients.length === 0) {
    res.status(500).json({ error: "No notification recipients configured for this profile" });
    return;
  }

  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Manila",
    dateStyle: "long",
    timeStyle: "short",
  });

  const htmlBody = buildEmailHtml({
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    service: service?.trim() ?? "",
    profile: profile || "Chatbot",
    timestamp,
  });

  const textBody = [
    `New Quote Request — ${profile || "Chatbot"}`,
    ``,
    `Visitor: ${name.trim()} <${email.trim()}>`,
    service ? `Service/Topic: ${service.trim()}` : "",
    ``,
    `Message:`,
    message.trim(),
    ``,
    `Received: ${timestamp}`,
  ]
    .filter((l) => l !== undefined)
    .join("\n");

  try {
    const transporter = createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    await transporter.sendMail({
      from: `"Chatbot Notifications" <${gmailUser}>`,
      to: recipients.join(", "),
      cc: ccList.length > 0 ? ccList.join(", ") : undefined,
      subject,
      text: textBody,
      html: htmlBody,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Quote request email failed:", error);
    res.status(500).json({
      error: "Failed to send notification email",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
