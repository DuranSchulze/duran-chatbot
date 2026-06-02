import prisma from "@duran-chatbot/database";

async function readRequestBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let body;
  try {
    body = await readRequestBody(req);
  } catch {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { profile, sessionId, userName, userEmail, userMessage, aiResponse } = body;

  if (!userMessage || !aiResponse) {
    res.status(400).json({ error: "userMessage and aiResponse are required" });
    return;
  }

  const profileId = profile || "default";
  const now = new Date();

  try {
    // Ensure profile exists before logging
    await prisma.profile.upsert({
      where: { slug: profileId },
      create: { slug: profileId, name: profileId, status: "active" },
      update: {},
    });

    const conversation = await prisma.conversation.upsert({
      where: { sessionId_profileId: { sessionId: sessionId || "", profileId } },
      create: {
        sessionId: sessionId || "",
        profileId,
        userName: userName || "",
        userEmail: userEmail || "",
        firstSeen: now,
        lastActive: now,
      },
      update: {
        lastActive: now,
        userName: userName || "",
        userEmail: userEmail || "",
      },
    });

    await prisma.message.createMany({
      data: [
        { conversationId: conversation.id, role: "user", content: userMessage, timestamp: now },
        { conversationId: conversation.id, role: "assistant", content: aiResponse, timestamp: now },
      ],
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("chat-log error:", error);
    res.status(500).json({
      error: "Failed to log conversation",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
