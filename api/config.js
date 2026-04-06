import fs from "node:fs";
import path from "node:path";
import { createClient } from "redis";

const CONFIG_KEY = "chatbot:config";
const fallbackConfigPath = path.join(process.cwd(), "data", "config.json");

const redisUrl = process.env.REDIS_URL;
const redis = redisUrl ? createClient({ url: redisUrl }) : null;
const redisConnection = redis ? redis.connect() : null;

function readFallbackConfig() {
  const file = fs.readFileSync(fallbackConfigPath, "utf8");
  return JSON.parse(file);
}

async function readRequestBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  const chunks = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody ? JSON.parse(rawBody) : {};
}

async function getRedisClient() {
  if (!redis || !redisConnection) {
    throw new Error("REDIS_URL is not configured");
  }

  await redisConnection;
  return redis;
}

async function getStoredConfig() {
  const client = await getRedisClient();
  const rawConfig = await client.get(CONFIG_KEY);

  if (!rawConfig) {
    const fallbackConfig = readFallbackConfig();
    await client.set(CONFIG_KEY, JSON.stringify(fallbackConfig));
    return fallbackConfig;
  }

  return JSON.parse(rawConfig);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const geminiApiKey = process.env.GEMINI_API_KEY ?? "";

  if (req.method === "GET") {
    try {
      let config = redisUrl ? await getStoredConfig() : readFallbackConfig();
      config = { ...config, ai: { ...config.ai, apiKey: geminiApiKey } };
      res.status(200).json(config);
    } catch (error) {
      res.status(500).json({
        error: "Failed to read config",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
    return;
  }

  if (req.method === "POST") {
    try {
      const client = await getRedisClient();
      const nextConfig = await readRequestBody(req);
      const { ai: { apiKey: _dropped, ...ai }, ...rest } = nextConfig;

      await client.set(CONFIG_KEY, JSON.stringify({ ...rest, ai }));

      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({
        error: "Failed to save config",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ error: "Method not allowed" });
}
