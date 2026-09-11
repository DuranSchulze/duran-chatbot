import { randomUUID } from "node:crypto";
import prisma from "./client.js";
import { enabledChannels, dispatchNotifications } from "./notifications.js";
import { normalizeConversationEmail } from "@duran-chatbot/config";

export class ChatLogError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function validateChatLog(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new ChatLogError(400, "Invalid request body");
  const input = body as Record<string, unknown>;
  const field = (key: string, max: number, required = false): string => {
    const value = input[key];
    if (value == null && !required) return "";
    if (typeof value !== "string" || value.length > max || (required && !value.trim())) throw new ChatLogError(400, `Invalid ${key}`);
    return value;
  };
  return { profile: field("profile", 100) || "duran-schulze", sessionId: field("sessionId", 200, true), requestId: field("requestId", 100) || randomUUID(), userName: field("userName", 150), userEmail: field("userEmail", 254), userMessage: field("userMessage", 20000, true), aiResponse: field("aiResponse", 100000) };
}

export async function logChat(body: unknown, options: { allowInternal?: boolean } = {}) {
  const input = validateChatLog(body);
  if (input.profile === "internal" && !options.allowInternal) throw new ChatLogError(401, "Unauthorized");
  const result = await prisma.$transaction(async tx => {
    // Serialize per-profile admission across serverless instances (not an in-memory limiter).
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.profile}))`;
    if (input.profile === "internal" && options.allowInternal) await tx.profile.upsert({ where: { slug: "internal" }, create: { slug: "internal", name: "Internal" }, update: {} });
    const profile = await tx.profile.findUnique({ where: { slug: input.profile }, include: { config: true } });
    if (!profile || profile.status !== "active") throw new ChatLogError(404, "Active profile not found");
    const existing = await tx.conversation.findUnique({ where: { sessionId_profileId: { sessionId: input.sessionId, profileId: input.profile } } });
    if (existing) {
      const duplicate = await tx.notificationEvent.findUnique({ where: { conversationId_requestId: { conversationId: existing.id, requestId: input.requestId } }, include: { message: true } });
      if (duplicate) {
        if (duplicate.message.content !== input.userMessage) throw new ChatLogError(409, "requestId already used for another inquiry");
        // The widget submits the inquiry before generation finishes. Attach the
        // eventual answer once, regardless of request arrival order or retries.
        if (input.aiResponse) await tx.message.upsert({
          where: { id: `reply:${duplicate.messageId}` },
          create: { id: `reply:${duplicate.messageId}`, conversationId: existing.id, role: "assistant", content: input.aiResponse },
          update: {},
        });
        return { eventId: duplicate.id, duplicate: true };
      }
    }
    const recent = { gte: new Date(Date.now() - 60000) };
    const count = await tx.notificationEvent.count({ where: { conversation: { profileId: input.profile }, createdAt: recent } });
    if (count >= 60) throw new ChatLogError(429, "Too many inquiries. Please try again later.");
    if (existing && await tx.notificationEvent.count({ where: { conversationId: existing.id, createdAt: recent } }) >= 10) throw new ChatLogError(429, "Too many inquiries. Please try again later.");
    const conversation = await tx.conversation.upsert({
      where: { sessionId_profileId: { sessionId: input.sessionId, profileId: input.profile } },
      create: { sessionId: input.sessionId, profileId: input.profile, userName: input.userName, userEmail: input.userEmail },
      update: { lastActive: new Date(), ...(input.userName ? { userName: input.userName } : {}), ...(input.userEmail ? { userEmail: input.userEmail } : {}) },
    });
    const message = await tx.message.create({ data: { conversationId: conversation.id, role: "user", content: input.userMessage } });
    if (input.aiResponse) await tx.message.create({ data: { id: `reply:${message.id}`, conversationId: conversation.id, role: "assistant", content: input.aiResponse } });
    const channels: string[] = enabledChannels(profile.config?.integrations);
    if (normalizeConversationEmail((profile.config?.behavior as Record<string, unknown> | null)?.conversationEmail).enabled) channels.push("email");
    const event = await tx.notificationEvent.create({ data: { conversationId: conversation.id, requestId: input.requestId, messageId: message.id, deliveries: { create: channels.map(channel => ({ channel })) } } });
    return { eventId: event.id, duplicate: false };
  }, { maxWait: 10000, timeout: 10000 });
  // Chat persistence succeeds even when a provider or worker is unavailable.
  try { await dispatchNotifications(result.eventId); } catch { console.error("Notification dispatch deferred; persisted outbox will retry"); }
  return { success: true, ...result };
}
