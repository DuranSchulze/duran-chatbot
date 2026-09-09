import { prisma } from "./client.js";
import { decryptSecret, encryptSecret } from "./crypto.js";

export type EmailProvider = "resend";

export interface EmailIntegrationInput {
  /** Plaintext Resend API key. Empty/undefined keeps the stored value. */
  secret?: string | null;
  fromEmail?: string | null;
  fromName?: string | null;
}

/** Safe shape returned to the admin UI — never includes the secret itself. */
export interface EmailIntegrationPublic {
  provider: EmailProvider;
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

const RESEND_API_URL = "https://api.resend.com/emails";

/** Read the per-profile integration without exposing the secret. */
export async function getEmailIntegration(
  profileId: string,
): Promise<EmailIntegrationPublic | null> {
  const row = await prisma.emailIntegration.findUnique({ where: { profileId } });
  if (!row) return null;
  return {
    provider: "resend",
    fromEmail: row.fromEmail,
    fromName: row.fromName,
    hasSecret: Boolean(row.secretEnc),
    // A profile is ready when it stores a key, or when the env fallback exists.
    configured: Boolean(
      row.secretEnc ||
        process.env.RESEND_API_KEY ||
        process.env.RESEND_FROM_EMAIL,
    ),
  };
}

/**
 * Create or update the integration.
 *
 * Note: older rows may still carry SMTP-era host/port/username columns
 * (provider was "gmail"/"brevo"/"mailtrap"/"mandrill"/"smtp"). Those columns
 * are legacy leftovers — sending now always goes through Resend — so new saves
 * leave them untouched.
 */
export async function saveEmailIntegration(
  profileId: string,
  input: EmailIntegrationInput,
): Promise<EmailIntegrationPublic> {
  const data: {
    provider: string;
    fromEmail: string | null;
    fromName: string | null;
    secretEnc?: string;
  } = {
    provider: "resend",
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

interface ResolvedResend {
  apiKey: string;
  fromEmail: string;
  defaultFromName: string;
}

/** Split "a@x.com, b@y.com" strings into the array Resend expects. */
function toRecipientList(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const list = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return list.length > 0 ? list : undefined;
}

/** Quote/control characters are not allowed in a display name. */
function sanitizeFromName(name: string): string {
  return name.replace(/["\\\r\n]/g, "").trim();
}

/** Resolve the Resend key + sender for a profile, falling back to env vars. */
async function resolveResend(profileId: string): Promise<ResolvedResend> {
  const row = await prisma.emailIntegration.findUnique({
    where: { profileId },
  });
  const storedKey = row?.secretEnc ? decryptSecret(row.secretEnc) : "";
  const apiKey = storedKey || process.env.RESEND_API_KEY || "";
  if (!apiKey) {
    throw new Error(
      "Resend is not configured. Add your Resend API key in Email settings, or set the RESEND_API_KEY environment variable.",
    );
  }
  const fromEmail =
    row?.fromEmail?.trim() || process.env.RESEND_FROM_EMAIL?.trim() || "";
  if (!fromEmail) {
    throw new Error(
      "A verified sender address is required. Set the From email in Email settings, or the RESEND_FROM_EMAIL environment variable.",
    );
  }
  return {
    apiKey,
    fromEmail,
    defaultFromName:
      row?.fromName?.trim() ||
      process.env.RESEND_FROM_NAME?.trim() ||
      "Notifications",
  };
}

/** Send an email for a profile through the Resend API (per-profile key or env fallback). */
export async function sendProfileEmail(
  profileId: string,
  message: ProfileMailMessage,
): Promise<void> {
  const { apiKey, fromEmail, defaultFromName } =
    await resolveResend(profileId);
  const fromName = sanitizeFromName(message.fromName || defaultFromName);
  const from = fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;

  const payload: Record<string, unknown> = {
    from,
    to: toRecipientList(message.to),
    cc: toRecipientList(message.cc),
    reply_to: message.replyTo?.trim() || undefined,
    subject: message.subject,
  };
  if (message.text) payload.text = message.text;
  if (message.html) payload.html = message.html;

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let detail = `Resend request failed (${res.status})`;
    try {
      const data = (await res.json()) as { message?: string };
      if (data?.message) detail = data.message;
    } catch {
      /* keep fallback message */
    }
    throw new Error(detail);
  }
}
