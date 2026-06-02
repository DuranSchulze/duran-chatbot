import { createTransport } from "nodemailer";

import { prisma } from "./client.js";
import { decryptSecret, encryptSecret } from "./crypto.js";

export type EmailProvider = "gmail" | "brevo" | "mailtrap" | "mandrill" | "smtp";

/** Known SMTP host/port presets so the admin only has to paste a key. */
const PRESETS: Record<EmailProvider, { host?: string; port?: number }> = {
  gmail: {},
  brevo: { host: "smtp-relay.brevo.com", port: 587 },
  mailtrap: { host: "live.smtp.mailtrap.io", port: 587 },
  mandrill: { host: "smtp.mandrillapp.com", port: 587 },
  smtp: {},
};

export interface EmailIntegrationInput {
  provider: EmailProvider;
  host?: string | null;
  port?: number | null;
  username?: string | null;
  /** Plaintext API key / SMTP password. Empty/undefined keeps the stored value. */
  secret?: string | null;
  fromEmail?: string | null;
  fromName?: string | null;
}

/** Safe shape returned to the admin UI — never includes the secret itself. */
export interface EmailIntegrationPublic {
  provider: EmailProvider;
  host: string | null;
  port: number | null;
  username: string | null;
  fromEmail: string | null;
  fromName: string | null;
  hasSecret: boolean;
  configured: boolean;
}

export interface ProfileMailMessage {
  to: string;
  cc?: string;
  replyTo?: string;
  subject: string;
  text?: string;
  html?: string;
  /** Display name for the From header (e.g. company name). */
  fromName?: string;
}

function isProvider(value: unknown): value is EmailProvider {
  return (
    value === "gmail" ||
    value === "brevo" ||
    value === "mailtrap" ||
    value === "mandrill" ||
    value === "smtp"
  );
}

/** Read the per-profile integration without exposing the secret. */
export async function getEmailIntegration(
  profileId: string,
): Promise<EmailIntegrationPublic | null> {
  const row = await prisma.emailIntegration.findUnique({ where: { profileId } });
  if (!row) return null;
  return {
    provider: isProvider(row.provider) ? row.provider : "smtp",
    host: row.host,
    port: row.port,
    username: row.username,
    fromEmail: row.fromEmail,
    fromName: row.fromName,
    hasSecret: Boolean(row.secretEnc),
    configured: Boolean(row.secretEnc || row.provider === "gmail"),
  };
}

/** Create or update the integration. Only re-encrypts the secret when a new one is given. */
export async function saveEmailIntegration(
  profileId: string,
  input: EmailIntegrationInput,
): Promise<EmailIntegrationPublic> {
  const provider: EmailProvider = isProvider(input.provider)
    ? input.provider
    : "smtp";

  const data: {
    provider: string;
    host: string | null;
    port: number | null;
    username: string | null;
    fromEmail: string | null;
    fromName: string | null;
    secretEnc?: string;
  } = {
    provider,
    host: input.host?.trim() || PRESETS[provider].host || null,
    port: input.port ?? PRESETS[provider].port ?? null,
    username: input.username?.trim() || null,
    fromEmail: input.fromEmail?.trim() || null,
    fromName: input.fromName?.trim() || null,
  };

  // Only overwrite the stored secret when the admin actually typed a new one.
  if (input.secret && input.secret.trim()) {
    data.secretEnc = encryptSecret(input.secret.trim());
  }

  await prisma.profile.upsert({
    where: { slug: profileId },
    create: { slug: profileId, name: profileId, status: "active" },
    update: {},
  });

  await prisma.emailIntegration.upsert({
    where: { profileId },
    create: { profileId, ...data },
    update: data,
  });

  const result = await getEmailIntegration(profileId);
  return result!;
}

interface ResolvedTransport {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transporter: any;
  fromEmail: string;
  defaultFromName: string;
}

/** Build a nodemailer transport for a profile, falling back to env Gmail. */
async function resolveTransport(profileId: string): Promise<ResolvedTransport> {
  const row = await prisma.emailIntegration.findUnique({ where: { profileId } });

  if (row && (row.secretEnc || row.provider === "gmail")) {
    const provider: EmailProvider = isProvider(row.provider)
      ? row.provider
      : "smtp";
    const secret = decryptSecret(row.secretEnc);
    const username = row.username ?? "";

    if (provider === "gmail") {
      // Gmail can use a stored app password, or fall back to env credentials.
      const user = username || process.env.GMAIL_USER || "";
      const pass = secret || process.env.GMAIL_APP_PASSWORD || "";
      if (!user || !pass) throw new Error("Gmail credentials are not configured");
      return {
        transporter: createTransport({ service: "gmail", auth: { user, pass } }),
        fromEmail: row.fromEmail || user,
        defaultFromName: row.fromName || "Notifications",
      };
    }

    const host = row.host || PRESETS[provider].host;
    const port = row.port || PRESETS[provider].port || 587;
    if (!host) throw new Error(`SMTP host is not configured for ${provider}`);
    return {
      transporter: createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user: username, pass: secret },
      }),
      fromEmail: row.fromEmail || username,
      defaultFromName: row.fromName || "Notifications",
    };
  }

  // Fallback: legacy env Gmail (keeps existing deployments working).
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error("Email service is not configured");
  return {
    transporter: createTransport({ service: "gmail", auth: { user, pass } }),
    fromEmail: user,
    defaultFromName: "Notifications",
  };
}

/** Send an email for a profile using its configured provider (or env Gmail fallback). */
export async function sendProfileEmail(
  profileId: string,
  message: ProfileMailMessage,
): Promise<void> {
  const { transporter, fromEmail, defaultFromName } =
    await resolveTransport(profileId);
  const fromName = message.fromName || defaultFromName;
  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: message.to,
    cc: message.cc,
    replyTo: message.replyTo,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}
