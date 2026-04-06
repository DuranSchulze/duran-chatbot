import type { IncomingMessage, ServerResponse } from "node:http";
import fs from "fs";
import path from "path";
import type { Connect, PluginOption, ViteDevServer } from "vite";

const GEMINI_MODELS_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

function readConfig(configPath: string) {
  const data = fs.readFileSync(configPath, "utf-8");
  return JSON.parse(data);
}

function writeConfig(configPath: string, config: unknown) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
}

async function readRequestBody(req: IncomingMessage) {
  let body = "";
  for await (const chunk of req) {
    body += chunk.toString();
  }
  return body ? JSON.parse(body) : {};
}

function normalizeModels(payload: unknown) {
  const models = Array.isArray((payload as { models?: unknown[] })?.models)
    ? (payload as { models: Array<Record<string, unknown>> }).models
    : [];

  return models
    .filter((model) => Array.isArray(model.supportedGenerationMethods))
    .filter((model) =>
      (model.supportedGenerationMethods as unknown[]).includes(
        "generateContent",
      ),
    )
    .map((model) => ({
      id:
        typeof model.name === "string"
          ? model.name.replace(/^models\//, "")
          : "",
      label:
        typeof model.displayName === "string" && model.displayName.length > 0
          ? model.displayName
          : typeof model.name === "string"
            ? model.name.replace(/^models\//, "")
            : "Unknown model",
    }))
    .filter((model) => model.id.length > 0)
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function apiPlugin(): PluginOption {
  return {
    name: "api-server",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(
        "/api/models",
        async (_req: IncomingMessage, res: ServerResponse) => {
          const geminiApiKey = process.env.GEMINI_API_KEY;

          if (!geminiApiKey) {
            res.statusCode = 500;
            res.end(
              JSON.stringify({ error: "GEMINI_API_KEY is not configured" }),
            );
            return;
          }

          try {
            const response = await fetch(
              `${GEMINI_MODELS_URL}?key=${geminiApiKey}`,
            );

            if (!response.ok) {
              const details = await response.text();
              res.statusCode = response.status;
              res.end(
                JSON.stringify({
                  error: "Failed to fetch Gemini models",
                  details: details || response.statusText,
                }),
              );
              return;
            }

            const payload = (await response.json()) as unknown;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ models: normalizeModels(payload) }));
          } catch (error) {
            res.statusCode = 500;
            res.end(
              JSON.stringify({
                error: "Failed to fetch Gemini models",
                details:
                  error instanceof Error ? error.message : "Unknown error",
              }),
            );
          }
        },
      );

      server.middlewares.use(
        "/api/config",
        async (
          req: IncomingMessage,
          res: ServerResponse,
          next: Connect.NextFunction,
        ) => {
          const configPath = path.resolve(
            __dirname,
            "../../../../data/config.json",
          );

          if (req.method === "GET") {
            try {
              const config = readConfig(configPath);
              const geminiApiKey = process.env.GEMINI_API_KEY ?? "";

              // Inject API key from env — never stored in the file
              const response = {
                ...config,
                ai: { ...config.ai, apiKey: geminiApiKey },
              };

              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(response));
            } catch (error) {
              res.statusCode = 500;
              res.end(
                JSON.stringify({
                  error: "Failed to read config",
                  details:
                    error instanceof Error ? error.message : "Unknown error",
                }),
              );
            }
            return;
          }

          if (req.method === "POST") {
            try {
              const body = await readRequestBody(req);

              // Strip apiKey before saving — it lives in env only
              const {
                ai: { apiKey: _dropped, ...ai },
                ...rest
              } = body;
              const config = { ...rest, ai };

              writeConfig(configPath, config);

              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: true }));
            } catch (error) {
              res.statusCode = 500;
              res.end(
                JSON.stringify({
                  error: "Failed to save config",
                  details:
                    error instanceof Error ? error.message : "Unknown error",
                }),
              );
            }
            return;
          }

          next();
        },
      );
    },
  };
}
