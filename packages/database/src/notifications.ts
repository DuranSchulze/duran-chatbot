import { randomUUID } from "node:crypto";
import prisma from "./client.js";

export const notificationChannels = ["telegram", "viber", "whatsapp"] as const;
export type NotificationChannel = typeof notificationChannels[number];
type Env = Record<string, string | undefined>;
const required: Record<NotificationChannel, string[]> = {
  telegram: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"],
  viber: ["VIBER_AUTH_TOKEN"],
  whatsapp: ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_TEMPLATE_NAME", "WHATSAPP_TEMPLATE_LANGUAGE", "WHATSAPP_API_VERSION"],
};

const recipientVariables = {
  viber: { plural: "VIBER_ADMIN_USER_IDS", legacy: "VIBER_ADMIN_USER_ID" },
  whatsapp: { plural: "WHATSAPP_ADMIN_NUMBERS", legacy: "WHATSAPP_ADMIN_NUMBER" },
} as const;

function recipients(channel: "viber" | "whatsapp", env: Env): string[] {
  const variables = recipientVariables[channel];
  return [...new Set(`${env[variables.plural] || ""}\n${env[variables.legacy] || ""}`
    .split(/[\n,]+/)
    .map(value => value.trim())
    .filter(Boolean))];
}

export function notificationReadiness(profile: string, env: Env = process.env) {
  return Object.fromEntries(notificationChannels.map(channel => {
    const missing = required[channel].filter(key => !env[key]?.trim());
    if (channel !== "telegram" && recipients(channel, env).length === 0) {
      const variables = recipientVariables[channel];
      missing.push(`${variables.plural} or ${variables.legacy}`);
    }
    if (env.NOTIFICATION_PROFILE_SLUG !== profile) missing.push("NOTIFICATION_PROFILE_SLUG");
    if (channel === "whatsapp" && env.WHATSAPP_API_VERSION && !/^v\d+\.\d+$/.test(env.WHATSAPP_API_VERSION)) missing.push("WHATSAPP_API_VERSION (invalid)");
    return [channel, { configured: missing.length === 0, missing }];
  })) as Record<NotificationChannel, { configured: boolean; missing: string[] }>;
}

export function enabledChannels(value: unknown): NotificationChannel[] {
  if (!value || typeof value !== "object") return [];
  return notificationChannels.filter(channel => (value as Record<string, { enabled?: unknown }>)[channel]?.enabled === true);
}

export class NotificationError extends Error {
  constructor(public code: string, public retryable: boolean, public retryAfterSeconds = 0) { super(code); }
}

export type Inquiry = { profile: string; name: string; email: string; query: string; eventId: string };
const clip = (value: string, limit: number) => Array.from(value).length > limit ? Array.from(value).slice(0, limit - 1).join("") + "…" : value;
const oneLine = (value: string) => value.replace(/\p{Cc}+/gu, " ").trim();

/**
 * Provider-ready payload: plain text for Telegram/Viber, plus WhatsApp's four
 * positional template parameters (profile, name, email, inquiry).
 */
type Outbound = { text: string; whatsapp: [string, string, string, string] };

async function deliver(channel: NotificationChannel, outbound: Outbound, env: Env, transport: typeof fetch, recipient?: string) {
  let url: string;
  let body: unknown;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (channel === "telegram") {
    url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    body = { chat_id: env.TELEGRAM_CHAT_ID, text: outbound.text, link_preview_options: { is_disabled: true } };
  } else if (channel === "viber") {
    url = "https://chatapi.viber.com/pa/send_message";
    headers["X-Viber-Auth-Token"] = env.VIBER_AUTH_TOKEN!;
    body = { receiver: recipient, type: "text", sender: { name: "Chatbot inquiries" }, text: outbound.text };
  } else {
    url = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${encodeURIComponent(env.WHATSAPP_PHONE_NUMBER_ID!)}/messages`;
    headers.Authorization = `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`;
    // Approved template body has exactly four positional parameters:
    // profile, visitor name, visitor email, inquiry (single-line, bounded).
    body = { messaging_product: "whatsapp", to: recipient, type: "template", template: {
      name: env.WHATSAPP_TEMPLATE_NAME, language: { code: env.WHATSAPP_TEMPLATE_LANGUAGE },
      components: [{ type: "body", parameters: outbound.whatsapp.map(text => ({ type: "text", text })) }],
    } };
  }
  let response: Response;
  try {
    response = await transport(url, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(5000), redirect: "error" });
  } catch {
    // Never persist/log raw provider errors: URLs may contain tokens.
    throw new NotificationError("network_or_timeout", true);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const retryAfter = Number(response.headers.get("retry-after") || data?.parameters?.retry_after || 0);
    throw new NotificationError(`http_${response.status}`, response.status === 429 || response.status >= 500, Number.isFinite(retryAfter) ? Math.min(retryAfter, 86400) : 0);
  }
  if (channel === "telegram" && data?.ok !== true) throw new NotificationError("telegram_rejected", data?.error_code === 429 || data?.error_code >= 500, data?.parameters?.retry_after || 0);
  if (channel === "viber" && data?.status !== 0) throw new NotificationError("viber_rejected", [1, 12].includes(data?.status));
  const id = channel === "telegram" ? data?.result?.message_id : channel === "viber" ? data?.message_token : data?.messages?.[0]?.id;
  if (id == null) throw new NotificationError("invalid_provider_response", true);
  return String(id);
}

export async function sendNotification(channel: NotificationChannel, inquiry: Inquiry, env: Env = process.env, transport: typeof fetch = fetch) {
  if (!notificationReadiness(inquiry.profile, env)[channel].configured) throw new NotificationError("not_configured", false);
  const name = clip(oneLine(inquiry.name) || "Not provided", 150);
  const email = clip(oneLine(inquiry.email) || "Not provided", 254);
  const query = clip(inquiry.query, 2400);
  const outbound: Outbound = {
    text: `New chatbot inquiry\nProfile: ${clip(oneLine(inquiry.profile), 100)}\nName: ${name}\nEmail: ${email}\n\nInquiry:\n${query}\n\nReference: ${inquiry.eventId}`,
    whatsapp: [clip(oneLine(inquiry.profile), 100), name, email, clip(oneLine(inquiry.query), 350)],
  };
  if (channel === "telegram") return deliver(channel, outbound, env, transport);
  const ids: string[] = [];
  // A channel delivery is accepted only after every configured recipient has
  // been accepted by the provider. A later-recipient failure may cause an
  // earlier recipient to see a duplicate when the delivery is retried.
  for (const recipient of recipients(channel, env)) ids.push(await deliver(channel, outbound, env, transport, recipient));
  return ids.join(",");
}

/**
 * Send a clearly-labelled test alert straight to the configured recipient so an
 * admin can prove credentials without waiting for a visitor inquiry. Never
 * persisted to the delivery outbox and never counted as a real inquiry.
 */
export async function sendTestNotification(channel: NotificationChannel, profile: string, env: Env = process.env, transport: typeof fetch = fetch) {
  if (!notificationReadiness(profile, env)[channel].configured) throw new NotificationError("not_configured", false);
  const label = clip(oneLine(profile) || "Chatbot", 100);
  const summary = `If you can read this, ${channel} alerts are wired up. No visitor inquiry is involved.`;
  const outbound: Outbound = {
    text: `Test alert from the chatbot dashboard\nProfile: ${label}\n\n${summary}`,
    whatsapp: [label, "Test alert", "no-reply@example.com", clip(summary, 350)],
  };
  if (channel === "telegram") return deliver(channel, outbound, env, transport);
  const ids: string[] = [];
  for (const recipient of recipients(channel, env)) ids.push(await deliver(channel, outbound, env, transport, recipient));
  return ids.join(",");
}

// CAS claims prevent concurrent request/cron workers from sending the same row.
// A crash after provider acceptance can still cause a duplicate on lease expiry.
export async function dispatchNotifications(eventId?: string) {
  const now = new Date();
  const due = await prisma.notificationDelivery.findMany({
    where: { ...(eventId ? { eventId } : {}), OR: [
      { status: "pending", nextAttemptAt: { lte: now } },
      { status: "sending", leaseUntil: { lte: now } },
    ] }, orderBy: { nextAttemptAt: "asc" }, take: 12,
  });
  // Four bounded batches; all asynchronous work is awaited before responding.
  for (let i = 0; i < due.length; i += 3) await Promise.all(due.slice(i, i + 3).map(async row => {
    const leaseToken = randomUUID();
    const claimed = await prisma.notificationDelivery.updateMany({
      where: { id: row.id, status: row.status, attempts: row.attempts, leaseToken: row.leaseToken },
      data: { status: "sending", leaseToken, leaseUntil: new Date(Date.now() + 60000), attempts: { increment: 1 } },
    });
    if (!claimed.count) return;
    const finish = (data: Record<string, unknown>) => prisma.notificationDelivery.updateMany({ where: { id: row.id, leaseToken }, data: { ...data, leaseToken: null, leaseUntil: null } });
    try {
      const event = await prisma.notificationEvent.findUnique({ where: { id: row.eventId }, include: { message: true, conversation: { include: { profile: { include: { config: true } } } } } });
      if (!event) return; // Cascaded deletion also removed the claimed delivery.
      const conversation = event.conversation;
      const profile = conversation.profile;
      const channel = row.channel as NotificationChannel;
      if (profile.status !== "active" || !enabledChannels(profile.config?.integrations).includes(channel)) {
        await finish({ status: "cancelled", lastError: "channel_disabled" });
        return;
      }
      if (row.attempts >= 5) {
        await finish({ status: "failed", lastError: "attempt_limit" });
        return;
      }
      const providerMessageId = await sendNotification(channel, { profile: profile.slug, name: conversation.userName, email: conversation.userEmail, query: event.message.content, eventId: event.id });
      await finish({ status: "accepted", providerMessageId, lastError: null });
    } catch (error) {
      const failure = error instanceof NotificationError ? error : new NotificationError("worker_error", true);
      const retry = failure.retryable && row.attempts + 1 < 5;
      const delay = Math.max(failure.retryAfterSeconds, 30 * 2 ** row.attempts) * 1000 + Math.floor(Math.random() * 1000);
      await finish({ status: retry ? "pending" : "failed", lastError: failure.code, nextAttemptAt: new Date(Date.now() + delay) });
    }
  }));
  return { processed: due.length };
}
