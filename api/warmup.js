import prisma from "@duran-chatbot/database";

/**
 * Cold-start "starter" endpoint. The widget pings this as soon as it loads (and again
 * when it is opened) so the serverless function and its Prisma/Neon connection pool are
 * already warm by the time the first real chat-log or quote-request arrives. Kept tiny,
 * unauthenticated, and always 200 so a warmup ping can never surface an error to users.
 */
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    // Establishes the DB connection so the first user-facing query is fast.
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ ok: true });
  } catch {
    // Warmup is best-effort; never fail loudly.
    res.status(200).json({ ok: false });
  }
}
