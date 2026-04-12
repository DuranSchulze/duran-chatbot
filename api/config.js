import fs from "node:fs";
import path from "node:path";
import { createClient } from "redis";
import { mergeWithDefaults } from "@duran-chatbot/config";

const LEGACY_CONFIG_KEY = "chatbot:config";
const PROFILES_INDEX_KEY = "chatbot:profiles";
const PROFILE_KEY = (slug) => `chatbot:profile:${slug}`;
const DEFAULT_SLUG = "duran-schulze";
const fallbackConfigPath = path.join(process.cwd(), "data", "config.json");

const redisUrl = process.env.REDIS_URL;
const redis = redisUrl ? createClient({ url: redisUrl }) : null;
const redisConnection = redis ? redis.connect() : null;

function readFallbackConfig() {
  const file = fs.readFileSync(fallbackConfigPath, "utf8");
  return mergeWithDefaults(JSON.parse(file));
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

/** Resolve the config key to read/write for a given slug, bootstrapping if needed. */
async function resolveProfileKey(client, slug) {
  const profileKey = PROFILE_KEY(slug);

  const profilesIndexRaw = await client.get(PROFILES_INDEX_KEY);
  if (!profilesIndexRaw) {
    const legacyRaw = await client.get(LEGACY_CONFIG_KEY);
    const config = legacyRaw
      ? mergeWithDefaults(JSON.parse(legacyRaw))
      : readFallbackConfig();

    const defaultProfile = {
      slug: DEFAULT_SLUG,
      name: "Duran Schulze",
      status: "active",
      createdAt: new Date().toISOString(),
    };

    await client.set(PROFILE_KEY(DEFAULT_SLUG), JSON.stringify(config));
    await client.set(PROFILES_INDEX_KEY, JSON.stringify([defaultProfile]));

    return PROFILE_KEY(slug || DEFAULT_SLUG);
  }

  return profileKey;
}

async function getStoredConfig(client, slug) {
  const key = await resolveProfileKey(client, slug || DEFAULT_SLUG);
  const rawConfig = await client.get(key);

  if (!rawConfig) {
    if (!slug || slug === DEFAULT_SLUG) {
      const fallback = readFallbackConfig();
      await client.set(key, JSON.stringify(fallback));
      return fallback;
    }
    return readFallbackConfig();
  }

  return mergeWithDefaults(JSON.parse(rawConfig));
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const urlParams = new URL(req.url, "http://localhost").searchParams;
  const profileSlug = req.query?.profile ?? urlParams.get("profile") ?? "";

  const geminiApiKey = process.env.GEMINI_API_KEY ?? "";

  if (req.method === "GET") {
    try {
      let config;
      if (redisUrl) {
        const client = await getRedisClient();
        config = await getStoredConfig(client, profileSlug);
      } else {
        config = readFallbackConfig();
      }
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
      const normalizedConfig = mergeWithDefaults(nextConfig);
      const { ai: { apiKey: _dropped, ...ai }, ...rest } = normalizedConfig;

      const slug = profileSlug || DEFAULT_SLUG;
      const key = await resolveProfileKey(client, slug);
      await client.set(key, JSON.stringify({ ...rest, ai }));

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
