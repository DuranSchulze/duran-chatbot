import { isAdmin } from "./_lib/auth.js";
import prisma from "@duran-chatbot/database";
import { mergeWithDefaults } from "@duran-chatbot/config";

const DEFAULT_SLUG = "duran-schulze";
const DEFAULT_PROFILE_NAME = "Duran Schulze";

async function readRequestBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody ? JSON.parse(rawBody) : {};
}

function configRowToPartial(config) {
  if (!config) return {};
  return {
    appearance: config.appearance ?? {},
    ai: config.ai ?? {},
    persona: config.persona ?? {},
    services: config.services ?? [],
    quickLinks: config.quickLinks ?? [],
    dataset: config.dataset ?? [],
    behavior: config.behavior ?? {},
    integrations: config.integrations ?? {},
  };
}

async function getOrBootstrapProfile(slug) {
  let profile = await prisma.profile.findUnique({
    where: { slug },
    include: { config: true },
  });

  if (!profile) {
    const defaults = mergeWithDefaults({});
    const { ai: { apiKey: _dropped, ...ai }, ...rest } = defaults;
    profile = await prisma.profile.create({
      data: {
        slug,
        name: slug === DEFAULT_SLUG ? DEFAULT_PROFILE_NAME : slug,
        status: "active",
        config: {
          create: {
            appearance: rest.appearance,
            ai,
            persona: rest.persona,
            services: rest.services,
            quickLinks: rest.quickLinks,
            dataset: rest.dataset,
            behavior: rest.behavior,
            integrations: rest.integrations,
          },
        },
      },
      include: { config: true },
    });
  }

  return profile;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET" && !isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });

  const urlParams = new URL(req.url, "http://localhost").searchParams;
  const profileSlug = req.query?.profile ?? urlParams.get("profile") ?? "";
  const slug = profileSlug || DEFAULT_SLUG;
  const geminiApiKey = process.env.GEMINI_API_KEY ?? "";

  if (req.method === "GET") {
    try {
      const profile = await getOrBootstrapProfile(slug);
      const merged = mergeWithDefaults(configRowToPartial(profile.config));
      merged.ai.apiKey = geminiApiKey;
      res.status(200).json(merged);
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
      const nextConfig = await readRequestBody(req);
      const normalized = mergeWithDefaults(nextConfig);
      const { ai: { apiKey: _dropped, ...ai }, ...rest } = normalized;
      const configData = {
        appearance: rest.appearance,
        ai,
        persona: rest.persona,
        services: rest.services,
        quickLinks: rest.quickLinks,
        dataset: rest.dataset,
        behavior: rest.behavior,
        integrations: rest.integrations,
      };

      await prisma.profile.upsert({
        where: { slug },
        create: { slug, name: slug === DEFAULT_SLUG ? DEFAULT_PROFILE_NAME : slug, status: "active" },
        update: {},
      });

      await prisma.config.upsert({
        where: { profileId: slug },
        create: { profileId: slug, ...configData },
        update: configData,
      });

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
