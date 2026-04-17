import { getAuthHeaders } from "@/lib/auth";

export interface SheetsStatus {
  connected: boolean;
  email?: string;
  sheetTitle?: string;
  tabs?: string[];
  sheetId?: string;
  error?: string;
}

export async function checkSheetsStatus(): Promise<SheetsStatus> {
  const res = await fetch("/api/sheets-status", { headers: getAuthHeaders() });
  if (!res.ok && res.status !== 200) return { connected: false, error: `HTTP ${res.status}` };
  return (await res.json()) as SheetsStatus;
}

export async function testSheetWrite(): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch("/api/sheets-status", {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
  });
  return (await res.json()) as { success: boolean; message?: string; error?: string };
}

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
