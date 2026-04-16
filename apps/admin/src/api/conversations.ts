import { getAuthHeaders } from "@/lib/auth";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ConversationSession {
  sessionId: string;
  userName: string;
  userEmail: string;
  profile: string;
  firstSeen: string;
  lastActive: string;
  messages: ChatMessage[];
}

export async function fetchConversations(
  profile: string,
): Promise<ConversationSession[]> {
  const res = await fetch(`/api/conversations?profile=${encodeURIComponent(profile)}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `Failed to fetch conversations (${res.status})`);
  }

  const data = (await res.json()) as { sessions: ConversationSession[] };
  return data.sessions;
}
