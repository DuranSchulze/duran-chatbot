import prisma from "@duran-chatbot/database";

// Public endpoint the widget polls to surface admin/sales ("middleman") replies
// to the visitor. Scoped to a single session: the sessionId is a random token the
// visitor already holds in localStorage, so it acts as the access key for its own
// conversation only.
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const urlParams = new URL(req.url, "http://localhost").searchParams;
  const profileId = req.query?.profile ?? urlParams.get("profile") ?? "default";
  const sessionId = req.query?.sessionId ?? urlParams.get("sessionId") ?? "";

  if (!sessionId) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { sessionId_profileId: { sessionId, profileId } },
      include: { messages: { orderBy: { timestamp: "asc" } } },
    });

    if (!conversation) {
      res.status(200).json({ messages: [] });
      return;
    }

    const messages = conversation.messages.map((m) => ({
      role: m.role,
      content: m.content,
      senderName: m.senderName ?? null,
      timestamp: m.timestamp.toISOString(),
    }));

    res.status(200).json({ messages });
  } catch (error) {
    console.error("messages error:", error);
    res.status(500).json({
      error: "Failed to read messages",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
