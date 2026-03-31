import type { IncomingMessage, ServerResponse } from "node:http"
import fs from "fs"
import path from "path"
import { createClient } from "redis"
import type { Connect, PluginOption, ViteDevServer } from "vite"

const CONFIG_KEY = "chatbot:config"
const GEMINI_MODELS_URL = "https://generativelanguage.googleapis.com/v1beta/models"

let redisClient: ReturnType<typeof createClient> | null = null
let redisClientPromise: Promise<ReturnType<typeof createClient>> | null = null

function getOrCreateRedisClient() {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) return null
  if (redisClient) return redisClient
  redisClient = createClient({ url: redisUrl })
  redisClientPromise = redisClient.connect().then(() => redisClient!)
  return redisClient
}

function readFallbackConfig(configPath: string) {
  const data = fs.readFileSync(configPath, "utf-8")
  return JSON.parse(data)
}


async function readRequestBody(req: IncomingMessage) {
  let body = ""

  for await (const chunk of req) {
    body += chunk.toString()
  }

  return body ? JSON.parse(body) : {}
}

function normalizeModels(payload: unknown) {
  const models = Array.isArray((payload as { models?: unknown[] })?.models)
    ? ((payload as { models: Array<Record<string, unknown>> }).models)
    : []

  return models
    .filter((model) => Array.isArray(model.supportedGenerationMethods))
    .filter((model) =>
      (model.supportedGenerationMethods as unknown[]).includes("generateContent"),
    )
    .map((model) => ({
      id: typeof model.name === "string" ? model.name.replace(/^models\//, "") : "",
      label:
        typeof model.displayName === "string" && model.displayName.length > 0
          ? model.displayName
          : typeof model.name === "string"
            ? model.name.replace(/^models\//, "")
            : "Unknown model",
    }))
    .filter((model) => model.id.length > 0)
    .sort((a, b) => a.label.localeCompare(b.label))
}

  export function apiPlugin(): PluginOption {
  return {
    name: "api-server",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(
        "/api/models",
        async (_req: IncomingMessage, res: ServerResponse) => {
          const geminiApiKey = process.env.GEMINI_API_KEY

          if (!geminiApiKey) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: "GEMINI_API_KEY is not configured" }))
            return
          }

          try {
            const response = await fetch(`${GEMINI_MODELS_URL}?key=${geminiApiKey}`)

            if (!response.ok) {
              const details = await response.text()
              res.statusCode = response.status
              res.end(
                JSON.stringify({
                  error: "Failed to fetch Gemini models",
                  details: details || response.statusText,
                }),
              )
              return
            }

            const payload = (await response.json()) as unknown

            res.setHeader("Content-Type", "application/json")
            res.end(JSON.stringify({ models: normalizeModels(payload) }))
            return
          } catch (error) {
            res.statusCode = 500
            res.end(
              JSON.stringify({
                error: "Failed to fetch Gemini models",
                details: error instanceof Error ? error.message : "Unknown error",
              }),
            )
            return
          }
        },
      )

      server.middlewares.use(
        "/api/config",
        async (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
          const configPath = path.resolve(__dirname, "../../../../data/config.json")

          if (req.method === "GET") {
            try {
              let config = readFallbackConfig(configPath)
              const geminiApiKey = process.env.GEMINI_API_KEY ?? ""
              const client = getOrCreateRedisClient()

              if (client) {
                await redisClientPromise
                const cachedConfig = await client.get(CONFIG_KEY)

                if (cachedConfig) {
                  config = JSON.parse(cachedConfig)
                } else {
                  await client.set(CONFIG_KEY, JSON.stringify(config))
                }
              }

              // Inject API key from env — never stored in config/Redis
              config = { ...config, ai: { ...config.ai, apiKey: geminiApiKey } }

              res.setHeader("Content-Type", "application/json")
              res.end(JSON.stringify(config))
            } catch (error) {
              res.statusCode = 500
              res.end(
                JSON.stringify({
                  error: "Failed to read config",
                  details: error instanceof Error ? error.message : "Unknown error",
                }),
              )
            }
            return
          }

          if (req.method === "POST") {
            try {
              const client = getOrCreateRedisClient()
              if (!client) {
                res.statusCode = 500
                res.end(JSON.stringify({ error: "REDIS_URL is not configured" }))
                return
              }
              await redisClientPromise
              const body = await readRequestBody(req)

              // Strip the apiKey before saving — it lives in env only
              const { ai: { apiKey: _dropped, ...ai }, ...rest } = body
              const config = { ...rest, ai }

              await client.set(CONFIG_KEY, JSON.stringify(config))

              res.setHeader("Content-Type", "application/json")
              res.end(JSON.stringify({ success: true }))
            } catch (error) {
              res.statusCode = 500
              res.end(
                JSON.stringify({
                  error: "Failed to save config",
                  details: error instanceof Error ? error.message : "Unknown error",
                }),
              )
            }
            return
          }

          next()
        },
      )
    },
  }
}
