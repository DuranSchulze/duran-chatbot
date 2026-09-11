import { isAdmin } from "./_lib/auth.js";
import prisma from "@duran-chatbot/database";
import { mergeWithDefaults, publicWidgetConfig } from "@duran-chatbot/config";

const DEFAULT_SLUG = "duran-schulze";
const DEFAULT_PROFILE_NAME = "Duran Schulze";

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

function buildDefaultConfigData() {
  const defaults = mergeWithDefaults({});
  const {
    ai: { apiKey: _dropped, ...ai },
    ...rest
  } = defaults;
  return {
    appearance: rest.appearance,
    ai,
    persona: rest.persona,
    services: rest.services,
    quickLinks: rest.quickLinks,
    dataset: rest.dataset,
    behavior: rest.behavior,
    integrations: rest.integrations,
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET" && !isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
  if (req.headers.authorization && !isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });

  let slug =
    req.query?.slug ??
    new URL(req.url, "http://localhost").searchParams.get("slug");

  try {
    if (req.method === "GET") {
      if (slug) {
        if (new URL(req.url, "http://localhost").searchParams.get("metadata") === "1") {
          const profile = await prisma.profile.findUnique({ where: { slug }, select: { slug: true, name: true, status: true, createdAt: true } });
          return res.status(profile ? 200 : 404).json(profile ?? { error: "Profile not found" });
        }
        const profile = await prisma.profile.findUnique({
          where: { slug },
          include: { config: true },
        });
        if (!profile) {
          res.status(404).json({ error: "Profile not found" });
          return;
        }
        const merged = mergeWithDefaults(configRowToPartial(profile.config));
        const {
          ai: { apiKey: _dropped, ...ai },
          ...rest
        } = isAdmin(req) ? merged : publicWidgetConfig(merged);
        res.status(200).json({
          slug: profile.slug,
          name: profile.name,
          status: profile.status,
          createdAt: profile.createdAt.toISOString(),
          config: { ...rest, ai },
        });
        return;
      }

      const profiles = await prisma.profile.findMany({
        orderBy: { createdAt: "asc" },
      });
      res.status(200).json({
        profiles: profiles.map((p) => ({
          slug: p.slug,
          name: p.name,
          status: p.status,
          createdAt: p.createdAt.toISOString(),
        })),
      });
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

      const existing = await prisma.profile.findUnique({
        where: { slug: finalSlug },
      });
      if (existing) {
        res
          .status(409)
          .json({ error: "A profile with this slug already exists" });
        return;
      }

      let configData = buildDefaultConfigData();

      if (body.cloneFrom) {
        const source = await prisma.profile.findUnique({
          where: { slug: body.cloneFrom },
          include: { config: true },
        });
        if (source?.config) {
          const {
            ai: { apiKey: _dropped, ...ai },
            ...rest
          } = mergeWithDefaults(configRowToPartial(source.config));
          configData = {
            appearance: rest.appearance,
            ai,
            persona: rest.persona,
            services: rest.services,
            quickLinks: rest.quickLinks,
            dataset: rest.dataset,
            behavior: rest.behavior,
            integrations: rest.integrations,
          };
        }
      }

      const newProfile = await prisma.profile.create({
        data: {
          slug: finalSlug,
          name,
          status: "active",
          config: { create: configData },
        },
      });

      res.status(201).json({
        slug: newProfile.slug,
        name: newProfile.name,
        status: newProfile.status,
        createdAt: newProfile.createdAt.toISOString(),
      });
      return;
    }

    if (req.method === "PUT") {
      if (!slug) {
        res.status(400).json({ error: "slug query param required" });
        return;
      }

      const profile = await prisma.profile.findUnique({ where: { slug } });
      if (!profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      const body = await readRequestBody(req);

      // Allow renaming the slug (primary key — requires updating FK references)
      if (
        body.slug &&
        typeof body.slug === "string" &&
        body.slug.trim() &&
        body.slug !== slug
      ) {
        const newSlug = body.slug.trim();

        // Validate slug format
        if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(newSlug)) {
          res.status(400).json({
            error: "Slug must use only lowercase letters, numbers, and hyphens",
          });
          return;
        }

        // Check uniqueness
        const existing = await prisma.profile.findUnique({
          where: { slug: newSlug },
        });
        if (existing) {
          res
            .status(409)
            .json({ error: "A profile with this slug already exists" });
          return;
        }

        // Transaction: update slug in Profile + all FK references
        await prisma.$transaction([
          prisma.$executeRawUnsafe(
            `UPDATE "Profile" SET slug = $1 WHERE slug = $2`,
            newSlug,
            slug,
          ),
          prisma.$executeRawUnsafe(
            `UPDATE "Config" SET "profileId" = $1 WHERE "profileId" = $2`,
            newSlug,
            slug,
          ),
          prisma.$executeRawUnsafe(
            `UPDATE "Conversation" SET "profileId" = $1 WHERE "profileId" = $2`,
            newSlug,
            slug,
          ),
          prisma.$executeRawUnsafe(
            `UPDATE "QuoteRequest" SET "profileId" = $1 WHERE "profileId" = $2`,
            newSlug,
            slug,
          ),
        ]);

        // Update the query slug so subsequent operations use the new one
        slug = newSlug;
      }

      // Allow reactivating an archived profile
      if (body.status && ["active", "archived"].includes(body.status)) {
        await prisma.profile.update({
          where: { slug },
          data: { status: body.status },
        });
      }

      if (body.config) {
        const normalized = mergeWithDefaults(body.config);
        const {
          ai: { apiKey: _dropped, ...ai },
          ...rest
        } = normalized;
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
        await prisma.config.upsert({
          where: { profileId: slug },
          create: { profileId: slug, ...configData },
          update: configData,
        });
      }

      if (body.name) {
        await prisma.profile.update({
          where: { slug },
          data: { name: body.name },
        });
      }

      res.status(200).json({ success: true });
      return;
    }

    if (req.method === "DELETE") {
      if (!slug) {
        res.status(400).json({ error: "slug query param required" });
        return;
      }

      const urlParams = new URL(req.url, "http://localhost").searchParams;
      const mode = urlParams.get("mode") || "archive";

      const profile = await prisma.profile.findUnique({ where: { slug } });
      if (!profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      if (mode === "hard") {
        // Permanently delete the profile and ALL connected data.
        // Delete in dependency order (children first) as a safety net
        // on top of Prisma's onDelete: Cascade.
        await prisma.$transaction([
          // 1. Messages belonging to this profile's conversations
          prisma.$executeRawUnsafe(
            `DELETE FROM "Message" WHERE "conversationId" IN (SELECT "id" FROM "Conversation" WHERE "profileId" = $1)`,
            slug,
          ),
          // 2. Conversations
          prisma.$executeRawUnsafe(
            `DELETE FROM "Conversation" WHERE "profileId" = $1`,
            slug,
          ),
          // 3. Quote requests
          prisma.$executeRawUnsafe(
            `DELETE FROM "QuoteRequest" WHERE "profileId" = $1`,
            slug,
          ),
          // 4. Config
          prisma.$executeRawUnsafe(
            `DELETE FROM "Config" WHERE "profileId" = $1`,
            slug,
          ),
          // 5. Email integration
          prisma.$executeRawUnsafe(
            `DELETE FROM "EmailIntegration" WHERE "profileId" = $1`,
            slug,
          ),
          // 6. The profile itself
          prisma.$executeRawUnsafe(
            `DELETE FROM "Profile" WHERE "slug" = $1`,
            slug,
          ),
        ]);
        res.status(200).json({ success: true, action: "deleted" });
        return;
      }

      // Default: archive (soft delete)
      const activeCount = await prisma.profile.count({
        where: { status: "active" },
      });
      if (activeCount <= 1) {
        res
          .status(400)
          .json({ error: "Cannot archive the last active profile" });
        return;
      }

      await prisma.profile.update({
        where: { slug },
        data: { status: "archived" },
      });

      res.status(200).json({ success: true, action: "archived" });
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
