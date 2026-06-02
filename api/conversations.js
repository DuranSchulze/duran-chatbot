import prisma from "@duran-chatbot/database";
import jwt from "jsonwebtoken";

function verifyToken(req) {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) throw new Error("No token provided");
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) throw new Error("AUTH_JWT_SECRET not configured");
  return jwt.verify(token, secret);
}

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
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let user;
  try {
    user = verifyToken(req);
  } catch {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const urlParams = new URL(req.url, "http://localhost").searchParams;
  const profile = req.query?.profile ?? urlParams.get("profile") ?? "default";

  // ── POST: admin reply or mark-read ─────────────────────────────
  if (req.method === "POST") {
    let body;
    try {
      body = await readRequestBody(req);
    } catch {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const { action, sessionId, content } = body;
    const profileId = body.profile || profile || "default";
    if (!sessionId) {
      res.status(400).json({ error: "sessionId is required" });
      return;
    }

    try {
      const conversation = await prisma.conversation.findUnique({
        where: { sessionId_profileId: { sessionId, profileId } },
      });
      if (!conversation) {
        res.status(404).json({ error: "Conversation not found" });
        return;
      }

      if (action === "markRead") {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { adminReadAt: new Date() },
        });
        res.status(200).json({ success: true });
        return;
      }

      // Default action: admin reply
      if (!content || !content.trim()) {
        res.status(400).json({ error: "content is required" });
        return;
      }
      const now = new Date();
      // Show the brand persona (or company name) to visitors — never the admin
      // login. Visitors should feel they're talking to one consistent persona.
      let resolvedName = "";
      try {
        const cfg = await prisma.config.findUnique({ where: { profileId } });
        const persona = cfg?.persona;
        const appearance = cfg?.appearance;
        if (persona?.enabled && persona?.personaName?.trim()) {
          resolvedName = persona.personaName.trim();
        } else if (appearance?.companyName?.trim()) {
          resolvedName = appearance.companyName.trim();
        }
      } catch {
        /* config unavailable — fall through to default */
      }
      const senderName =
        (typeof body.senderName === "string" && body.senderName.trim()) ||
        resolvedName ||
        "Support";
      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "admin",
          content: content.trim(),
          senderName,
          timestamp: now,
        },
      });
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastActive: now, adminReadAt: now },
      });

      res.status(200).json({
        message: {
          role: message.role,
          content: message.content,
          senderName: message.senderName,
          timestamp: message.timestamp.toISOString(),
        },
      });
    } catch (error) {
      console.error("conversations POST error:", error);
      res.status(500).json({
        error: "Failed to post reply",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
    return;
  }

  // ── GET: list conversations ────────────────────────────────────
  try {
    const conversations = await prisma.conversation.findMany({
      where: { profileId: profile },
      include: { messages: { orderBy: { timestamp: "asc" } } },
      orderBy: { lastActive: "desc" },
    });

    const sessions = conversations.map((conv) => ({
      sessionId: conv.sessionId,
      userName: conv.userName,
      userEmail: conv.userEmail,
      profile: conv.profileId,
      firstSeen: conv.firstSeen.toISOString(),
      lastActive: conv.lastActive.toISOString(),
      adminReadAt: conv.adminReadAt ? conv.adminReadAt.toISOString() : null,
      messages: conv.messages.map((m) => ({
        role: m.role,
        content: m.content,
        senderName: m.senderName ?? null,
        timestamp: m.timestamp.toISOString(),
      })),
    }));

    res.status(200).json({ sessions });
  } catch (error) {
    console.error("conversations error:", error);
    res.status(500).json({
      error: "Failed to read conversations",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
