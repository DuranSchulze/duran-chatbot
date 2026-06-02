import {
  getEmailIntegration,
  saveEmailIntegration,
  sendProfileEmail,
} from "@duran-chatbot/database";
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

const EMPTY = {
  provider: "gmail",
  host: null,
  port: null,
  username: null,
  fromEmail: null,
  fromName: null,
  hasSecret: false,
  configured: false,
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    verifyToken(req);
  } catch {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const urlParams = new URL(req.url, "http://localhost").searchParams;
  const profile = req.query?.profile ?? urlParams.get("profile") ?? "default";

  try {
    if (req.method === "GET") {
      const integration = await getEmailIntegration(profile);
      res.status(200).json({ integration: integration ?? EMPTY });
      return;
    }

    if (req.method === "PUT") {
      const body = await readRequestBody(req);
      const integration = await saveEmailIntegration(profile, {
        provider: body.provider,
        host: body.host,
        port: body.port ? Number(body.port) : null,
        username: body.username,
        secret: body.secret,
        fromEmail: body.fromEmail,
        fromName: body.fromName,
      });
      res.status(200).json({ integration });
      return;
    }

    if (req.method === "POST") {
      // Send a test email using the saved integration.
      const body = await readRequestBody(req);
      const to = (body.to ?? "").trim();
      if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        res.status(400).json({ error: "A valid recipient email is required" });
        return;
      }
      await sendProfileEmail(profile, {
        to,
        subject: "Test email from your chatbot",
        text: "This is a test email confirming your email integration works.",
        html: "<p>This is a <strong>test email</strong> confirming your email integration works. 🎉</p>",
      });
      res.status(200).json({ success: true });
      return;
    }

    res.setHeader("Allow", "GET, PUT, POST");
    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("email-integration error:", error);
    res.status(500).json({
      error: "Email integration operation failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
