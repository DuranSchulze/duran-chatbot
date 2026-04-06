import react from "@vitejs/plugin-react"
import path from "path"
import { defineConfig, loadEnv } from "vite"
import { createRequire } from "module"
import { apiPlugin } from "./src/server/api-plugin"

const require = createRequire(import.meta.url)
const widgetVersion: string = (require("../../packages/widget/package.json") as { version: string }).version

export default defineConfig(({ mode }) => {
  // Load env from the monorepo root (two levels up from apps/admin)
  const monorepoRoot = path.resolve(__dirname, "../..")
  const env = loadEnv(mode, monorepoRoot, "")

  // Inject into process.env so the Vite plugin (Node context) can read them
  Object.assign(process.env, env)

  return {
    plugins: [react(), apiPlugin()],
    define: {
      __WIDGET_VERSION__: JSON.stringify(widgetVersion),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
    },
  }
})
