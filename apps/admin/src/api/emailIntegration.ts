import { getAuthHeaders } from "@/lib/auth";

export type EmailProvider = "gmail" | "brevo" | "mailtrap" | "mandrill" | "smtp";

export interface EmailIntegration {
  provider: EmailProvider;
  host: string | null;
  port: number | null;
  username: string | null;
  fromEmail: string | null;
  fromName: string | null;
  hasSecret: boolean;
  configured: boolean;
}

export interface EmailIntegrationInput {
  provider: EmailProvider;
  host?: string | null;
  port?: number | null;
  username?: string | null;
  /** Leave empty to keep the stored key. */
  secret?: string | null;
  fromEmail?: string | null;
  fromName?: string | null;
}

const PATH = "/api/email-integration";

async function errMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string; details?: string };
    return [data.error, data.details].filter(Boolean).join(" — ") || fallback;
  } catch {
    return fallback;
  }
}

export async function fetchEmailIntegration(
  profile: string,
): Promise<EmailIntegration> {
  const res = await fetch(`${PATH}?profile=${encodeURIComponent(profile)}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error(await errMessage(res, `Failed to load (${res.status})`));
  }
  const data = (await res.json()) as { integration: EmailIntegration };
  return data.integration;
}

export async function saveEmailIntegration(
  profile: string,
  input: EmailIntegrationInput,
): Promise<EmailIntegration> {
  const res = await fetch(`${PATH}?profile=${encodeURIComponent(profile)}`, {
    method: "PUT",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await errMessage(res, `Failed to save (${res.status})`));
  }
  const data = (await res.json()) as { integration: EmailIntegration };
  return data.integration;
}

export async function sendTestEmail(
  profile: string,
  to: string,
): Promise<void> {
  const res = await fetch(`${PATH}?profile=${encodeURIComponent(profile)}`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ to }),
  });
  if (!res.ok) {
    throw new Error(await errMessage(res, `Test failed (${res.status})`));
  }
}
