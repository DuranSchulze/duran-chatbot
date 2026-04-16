import jwt from "jsonwebtoken";

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

  const { username, password } = await readRequestBody(req);

  const validUsername = process.env.AUTH_USERNAME;
  const validPassword = process.env.AUTH_PASSWORD;
  const jwtSecret = process.env.AUTH_JWT_SECRET;

  if (!validUsername || !validPassword || !jwtSecret) {
    res.status(500).json({ error: "Auth is not configured on the server" });
    return;
  }

  if (username !== validUsername || password !== validPassword) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const token = jwt.sign({ username }, jwtSecret, { expiresIn: "7d" });
  res.status(200).json({ token });
}
