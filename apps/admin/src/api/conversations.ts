import { getAuthHeaders } from "@/lib/auth";

export interface ChatMessage {
  role: "user" | "assistant" | "admin";
  content: string;
  senderName?: string | null;
  timestamp: string;
}

export interface ConversationSession {
  sessionId: string;
  userName: string;
  userEmail: string;
  profile: string;
  firstSeen: string;
  lastActive: string;
  adminReadAt: string | null;
  messages: ChatMessage[];
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function fetchConversations(
  profile: string,
): Promise<ConversationSession[]> {
  const res = await fetch(`/api/conversations?profile=${encodeURIComponent(profile)}`, {
    headers: getAuthHeaders(),
  });

  if (res.status === 401) throw new UnauthorizedError();

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string; details?: string };
    const msg = [data.error, data.details].filter(Boolean).join(" — ");
    throw new Error(msg || `Failed to fetch conversations (${res.status})`);
  }

  const data = (await res.json()) as { sessions: ConversationSession[] };
  return data.sessions;
}

export async function sendAdminReply(
  profile: string,
  sessionId: string,
  content: string,
): Promise<ChatMessage> {
  const res = await fetch(`/api/conversations?profile=${encodeURIComponent(profile)}`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ profile, sessionId, content }),
  });

  if (res.status === 401) throw new UnauthorizedError();
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Failed to send reply (${res.status})`);
  }

  const data = (await res.json()) as { message: ChatMessage };
  return data.message;
}

export async function markConversationRead(
  profile: string,
  sessionId: string,
): Promise<void> {
  const res = await fetch(`/api/conversations?profile=${encodeURIComponent(profile)}`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ action: "markRead", profile, sessionId }),
  });
  if (res.status === 401) throw new UnauthorizedError();
  // Non-fatal: a failed read-marker shouldn't break the UI.
}
