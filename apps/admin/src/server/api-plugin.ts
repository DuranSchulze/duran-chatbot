import type { IncomingMessage, ServerResponse } from "node:http"
import fs from "fs"
import path from "path"
import type { Connect, PluginOption, ViteDevServer } from "vite"

export function apiPlugin(): PluginOption {
  return {
    name: "api-server",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(
        "/api/config",
        (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
          const configPath = path.resolve(__dirname, "../../../../data/config.json")

          if (req.method === "GET") {
            try {
              const data = fs.readFileSync(configPath, "utf-8")
              res.setHeader("Content-Type", "application/json")
              res.end(data)
            } catch {
              res.statusCode = 500
              res.end(JSON.stringify({ error: "Failed to read config" }))
            }
            return
          }

          if (req.method === "POST") {
            let body = ""
            req.on("data", (chunk: Buffer) => {
              body += chunk.toString()
            })
            req.on("end", () => {
              try {
                const config = JSON.parse(body)
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
                res.setHeader("Content-Type", "application/json")
                res.end(JSON.stringify({ success: true }))
              } catch {
                res.statusCode = 500
                res.end(JSON.stringify({ error: "Failed to save config" }))
              }
            })
            return
          }

          next()
        },
      )
    },
  }
}
