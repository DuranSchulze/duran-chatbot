import { conversationEmailRecipientError, normalizeConversationEmail, type ConversationEmailConfig } from "@duran-chatbot/config";
import prisma from "./client.js";
import { decryptSecret } from "./crypto.js";
import { sendProfileEmail } from "./email.js";
import { NotificationError } from "./notification-error.js";

export function conversationAdminUrl(profile: string, conversation: string, origin = process.env.ADMIN_APP_URL): string {
  try {
    if (!origin?.trim()) throw new Error();
    const url = new URL(origin.trim());
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.username || url.password || url.hash || url.search || url.pathname !== "/" ||
      (url.protocol !== "https:" && !(local && url.protocol === "http:"))) throw new Error();
    const target = new URL("/conversations", url.origin);
    target.searchParams.set("profile", profile);
    target.searchParams.set("conversation", conversation);
    return target.toString();
  } catch { throw new NotificationError("email_admin_url_invalid", false); }
}

export async function conversationEmailReadiness(profileId: string, settings: ConversationEmailConfig) {
  const missing: string[] = [];
  const recipients = conversationEmailRecipientError(settings);
  if (recipients) missing.push(recipients);
  try { conversationAdminUrl(profileId, "readiness"); } catch { missing.push("ADMIN_APP_URL (valid admin origin required)"); }
  const row = await prisma.emailIntegration.findUnique({ where: { profileId } });
  if (!row?.secretEnc && !process.env.RESEND_API_KEY?.trim()) missing.push("Resend API key");
  if (row?.secretEnc) {
    try { if (!decryptSecret(row.secretEnc)) missing.push("Resend API key"); }
    catch { missing.push("Stored Resend key cannot be decrypted; save it again"); }
  }
  if (!(row?.fromEmail?.trim() || process.env.RESEND_FROM_EMAIL?.trim())) missing.push("Verified From email");
  return { enabled: settings.enabled, configured: missing.length === 0, missing };
}

type VisitorMessage = { id: string; role: string; content: string; timestamp: Date | string };
type ConversationIdentity = { id: string; userName: string; userEmail: string; firstSeen: Date | string; lastActive: Date | string };
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, x => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[x]!);
const date = (value: Date | string) => new Date(value).toISOString();
const clip = (value: string, length: number) => {
  if (value.length <= length) return value;
  let cut = value.slice(0, length);
  // Never split a UTF-16 surrogate pair at the content boundary.
  const last = cut.charCodeAt(cut.length - 1);
  if (last >= 0xd800 && last <= 0xdbff) cut = cut.slice(0, -1);
  return cut + "…";
};

/** Defense in depth: roles are filtered here as well as in the database query. */
export function formatConversationEmail(input: {
  settings: ConversationEmailConfig; profile: { slug: string; name: string };
  conversation: ConversationIdentity; message: VisitorMessage; messages: VisitorMessage[]; omitted?: boolean; adminOrigin?: string;
}) {
  const { profile, conversation, message } = input;
  if (message.role !== "user") throw new NotificationError("email_invalid_message_role", false);
  const settings = normalizeConversationEmail(input.settings);
  if (conversationEmailRecipientError(settings)) throw new NotificationError("email_invalid_recipients", false);
  const url = conversationAdminUrl(profile.slug, conversation.id, input.adminOrigin);
  // Reserve half the 12,000-character budget for the triggering message.
  const newest = clip(message.content, 6000);
  let budget = 12000 - newest.length;
  let omitted = input.omitted === true || newest !== message.content;
  const history = input.messages.filter(m => m.role === "user" && m.id !== message.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime() || b.id.localeCompare(a.id));
  const selected: VisitorMessage[] = [];
  for (const item of history) {
    if (selected.length >= 19 || budget <= 0) { omitted = true; continue; }
    const content = clip(item.content, Math.max(0, budget - 1));
    if (content !== item.content) omitted = true;
    selected.push({ ...item, content });
    budget -= content.length;
  }
  selected.reverse();
  const heading = "New chatbot conversation message";
  const identity = `Profile: ${clip(profile.name, 150)}\nVisitor: ${clip(conversation.userName, 150) || "Not provided"}\nEmail: ${clip(conversation.userEmail, 254) || "Not provided"}\nStarted: ${date(conversation.firstSeen)}\nLast activity: ${date(conversation.lastActive)}`;
  const notice = omitted ? "Some older visitor messages or long text were omitted. Open the conversation for the complete transcript." : "Only visitor messages are included in this email.";
  const text = `${heading}\n${identity}\n\nNew visitor message · ${date(message.timestamp)}\n${newest}\n\n${selected.length ? "Other visitor messages\n" + selected.map(m => `${date(m.timestamp)}\n${m.content}`).join("\n\n") + "\n\n" : ""}${notice}\n\nView conversation (admin login required): ${url}`;
  const block = (value: string) => `<div style="white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(value)}</div>`;
  const html = `<!doctype html><html lang="en"><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:600px;margin:24px auto;padding:24px;background:#ffffff;border-top:4px solid #004a99"><h1 style="font-size:22px">${heading}</h1>${block(identity)}<h2 style="font-size:16px;color:#004a99">New visitor message</h2><p style="font-size:12px;color:#475569">${escapeHtml(date(message.timestamp))}</p>${block(newest)}${selected.length ? '<h2 style="font-size:16px">Other visitor messages</h2>' + selected.map(m => `<p style="font-size:12px;color:#475569">${escapeHtml(date(m.timestamp))}</p>${block(m.content)}`).join("<hr style=\"border:0;border-top:1px solid #e2e8f0\">") : ""}<p style="font-size:13px;color:#475569">${notice}</p><p style="margin:28px 0"><a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 20px;background:#004a99;color:#ffffff;border-radius:6px;text-decoration:none">View conversation</a></p><p style="font-size:12px;color:#475569">Admin login required. The internal view includes the complete conversation.</p></div></body></html>`;
  return { to: settings.to.join(","), cc: settings.cc.join(",") || undefined, subject: settings.subject || heading, text, html };
}

export async function sendConversationEmail(settings: ConversationEmailConfig, profile: { slug: string; name: string }, conversation: ConversationIdentity, message: VisitorMessage): Promise<string> {
  // Bounded query: never fetch chatbot/admin content for email construction.
  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id, role: "user" },
    orderBy: [{ timestamp: "desc" }, { id: "desc" }], take: 21,
    select: { id: true, role: true, content: true, timestamp: true },
  });
  const payload = formatConversationEmail({ settings, profile, conversation, message, messages, omitted: messages.length > 20 });
  const id = await sendProfileEmail(profile.slug, payload, { notification: true });
  if (!id) throw new NotificationError("email_invalid_provider_response", true);
  return id;
}
