import jwt from "jsonwebtoken";
export function isAdmin(req) {
  const auth = req.headers.authorization;
  if (typeof auth !== "string" || !auth.startsWith("Bearer ") || !process.env.AUTH_JWT_SECRET) return false;
  try { jwt.verify(auth.slice(7), process.env.AUTH_JWT_SECRET, { algorithms: ["HS256"] }); return true; } catch { return false; }
}
