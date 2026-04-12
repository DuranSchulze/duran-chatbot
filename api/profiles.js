import fs from "node:fs";
import path from "node:path";
import { createClient } from "redis";
import { mergeWithDefaults } from "@duran-chatbot/config";

const PROFILES_INDEX_KEY = "chatbot:profiles";
const PROFILE_KEY = (slug) => `chatbot:profile:${slug}`;
const LEGACY_CONFIG_KEY = "chatbot:config";
const DEFAULT_SLUG = "duran-schulze";
const fallbackConfigPath = path.join(process.cwd(), "data", "config.json");

const redisUrl = process.env.REDIS_URL;
const redis = redisUrl ? createClient({ url: redisUrl }) : null;
const redisConnection = redis ? redis.connect() : null;

async function getRedisClient() {
  if (!redis || !redisConnection) {
    throw new Error("REDIS_URL is not configured");
  }
  await redisConnection;
  return redis;
}

function readFallbackConfig() {
  const file = fs.readFileSync(fallbackConfigPath, "utf8");
  return mergeWithDefaults(JSON.parse(file));
}

/** Ensure the profiles index is bootstrapped. Migrates legacy config if needed. */
async function ensureBootstrapped(client) {
  const existingIndex = await client.get(PROFILES_INDEX_KEY);
  if (existingIndex) return;

  let config;
  const legacyRaw = await client.get(LEGACY_CONFIG_KEY);
  if (legacyRaw) {
    config = mergeWithDefaults(JSON.parse(legacyRaw));
  } else {
    config = readFallbackConfig();
  }

  const profile = {
    slug: DEFAULT_SLUG,
    name: "Duran Schulze",
    status: "active",
    createdAt: new Date().toISOString(),
  };

  await client.set(PROFILE_KEY(DEFAULT_SLUG), JSON.stringify(config));
  await client.set(PROFILES_INDEX_KEY, JSON.stringify([profile]));
}

async function getProfilesIndex(client) {
  await ensureBootstrapped(client);
  const raw = await client.get(PROFILES_INDEX_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveProfilesIndex(client, profiles) {
  await client.set(PROFILES_INDEX_KEY, JSON.stringify(profiles));
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const slug = req.query?.slug ?? new URL(req.url, "http://localhost").searchParams.get("slug");

  try {
    const client = await getRedisClient();

    if (req.method === "GET") {
      if (slug) {
        const profiles = await getProfilesIndex(client);
        const meta = profiles.find((p) => p.slug === slug);
        if (!meta) {
          res.status(404).json({ error: "Profile not found" });
          return;
        }
        const raw = await client.get(PROFILE_KEY(slug));
        const config = raw ? mergeWithDefaults(JSON.parse(raw)) : readFallbackConfig();
        res.status(200).json({ ...meta, config });
        return;
      }

      const profiles = await getProfilesIndex(client);
      res.status(200).json({ profiles });
      return;
    }

    if (req.method === "POST") {
      const body = await readRequestBody(req);
      const name = (body.name ?? "").trim();
      if (!name) {
        res.status(400).json({ error: "Profile name is required" });
        return;
      }

      const rawSlug = body.slug ? body.slug.trim() : slugify(name);
      const finalSlug = rawSlug || slugify(name);

      const profiles = await getProfilesIndex(client);
      if (profiles.find((p) => p.slug === finalSlug)) {
        res.status(409).json({ error: "A profile with this slug already exists" });
        return;
      }

      const newProfile = {
        slug: finalSlug,
        name,
        status: "active",
        createdAt: new Date().toISOString(),
      };

      const baseConfig = body.cloneFrom
        ? (() => {
            const srcRaw = null;
            return srcRaw ? mergeWithDefaults(JSON.parse(srcRaw)) : readFallbackConfig();
          })()
        : readFallbackConfig();

      await client.set(PROFILE_KEY(finalSlug), JSON.stringify(baseConfig));
      await saveProfilesIndex(client, [...profiles, newProfile]);

      res.status(201).json(newProfile);
      return;
    }

    if (req.method === "PUT") {
      if (!slug) {
        res.status(400).json({ error: "slug query param required" });
        return;
      }

      const profiles = await getProfilesIndex(client);
      const idx = profiles.findIndex((p) => p.slug === slug);
      if (idx === -1) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      const body = await readRequestBody(req);

      if (body.config) {
        const geminiApiKey = process.env.GEMINI_API_KEY ?? "";
        const normalized = mergeWithDefaults(body.config);
        const { ai: { apiKey: _dropped, ...ai }, ...rest } = normalized;
        await client.set(PROFILE_KEY(slug), JSON.stringify({ ...rest, ai }));
      }

      if (body.name) {
        profiles[idx] = { ...profiles[idx], name: body.name };
        await saveProfilesIndex(client, profiles);
      }

      res.status(200).json({ success: true });
      return;
    }

    if (req.method === "DELETE") {
      if (!slug) {
        res.status(400).json({ error: "slug query param required" });
        return;
      }

      const profiles = await getProfilesIndex(client);
      const idx = profiles.findIndex((p) => p.slug === slug);
      if (idx === -1) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      if (profiles.filter((p) => p.status === "active").length <= 1) {
        res.status(400).json({ error: "Cannot archive the last active profile" });
        return;
      }

      profiles[idx] = { ...profiles[idx], status: "archived" };
      await saveProfilesIndex(client, profiles);

      res.status(200).json({ success: true });
      return;
    }

    res.setHeader("Allow", "GET, POST, PUT, DELETE");
    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    res.status(500).json({
      error: "Profiles operation failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
