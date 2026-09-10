import prisma from "./client.js";
import { notificationReadiness } from "./notifications.js";
export async function getNotificationStatus(profile: string) {
  const [counts, lastFailure] = await Promise.all([
    prisma.notificationDelivery.groupBy({ by: ["channel", "status"], where: { event: { conversation: { profileId: profile } } }, _count: { _all: true } }),
    prisma.notificationDelivery.findFirst({ where: { status: "failed", event: { conversation: { profileId: profile } } }, orderBy: { updatedAt: "desc" }, select: { channel: true, lastError: true, updatedAt: true } }),
  ]);
  return { channels: notificationReadiness(profile), counts: counts.map(row => ({ channel: row.channel, status: row.status, count: row._count._all })), lastFailure };
}

export async function retryFailedNotifications(profile: string) {
  const failed = await prisma.notificationDelivery.findMany({ where: { status: "failed", event: { conversation: { profileId: profile } } }, select: { id: true }, take: 50, orderBy: { updatedAt: "asc" } });
  const result = await prisma.notificationDelivery.updateMany({ where: { id: { in: failed.map(row => row.id) }, status: "failed" }, data: { status: "pending", attempts: 0, nextAttemptAt: new Date(), lastError: null, leaseToken: null, leaseUntil: null } });
  return { queued: result.count };
}
