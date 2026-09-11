import prisma from "./client.js";
import { notificationChannels, notificationReadiness } from "./notifications.js";
import { conversationEmailReadiness } from "./conversation-email.js";
import { normalizeConversationEmail } from "@duran-chatbot/config";
type Scope = "messaging" | "email";
const channelFilter = (scope: Scope) => scope === "email" ? { equals: "email" } : { in: [...notificationChannels] };
export async function getNotificationStatus(profile: string, scope: Scope = "messaging") {
  const where = { channel: channelFilter(scope), event: { conversation: { profileId: profile } } };
  const [counts, lastFailure] = await Promise.all([
    prisma.notificationDelivery.groupBy({ by: ["channel", "status"], where, _count: { _all: true } }),
    prisma.notificationDelivery.findFirst({ where: { ...where, status: "failed" }, orderBy: { updatedAt: "desc" }, select: { channel: true, lastError: true, updatedAt: true } }),
  ]);
  const summary = { counts: counts.map(row => ({ channel: row.channel, status: row.status, count: row._count._all })), lastFailure };
  if (scope === "email") {
    const row = await prisma.profile.findUnique({ where: { slug: profile }, include: { config: true } });
    const settings = normalizeConversationEmail((row?.config?.behavior as Record<string, unknown> | null)?.conversationEmail);
    const readiness = await conversationEmailReadiness(profile, settings);
    if (row?.status !== "active") {
      readiness.configured = false;
      readiness.enabled = false;
      readiness.missing.push("Active chatbot profile");
    }
    return { ...summary, readiness };
  }
  return { ...summary, channels: notificationReadiness(profile) };
}

export async function retryFailedNotifications(profile: string, scope: Scope = "messaging") {
  const where = { channel: channelFilter(scope), status: "failed", event: { conversation: { profileId: profile } } };
  const failed = await prisma.notificationDelivery.findMany({ where, select: { id: true }, take: 50, orderBy: { updatedAt: "asc" } });
  const result = await prisma.notificationDelivery.updateMany({ where: { ...where, id: { in: failed.map(row => row.id) } }, data: { status: "pending", attempts: 0, nextAttemptAt: new Date(), lastError: null, leaseToken: null, leaseUntil: null } });
  return { queued: result.count };
}
