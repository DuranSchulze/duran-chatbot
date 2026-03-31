import react from "@vitejs/plugin-react"
import path from "path"
import { defineConfig } from "vite"
import { apiPlugin } from "./src/server/api-plugin"

export default defineConfig({
  plugins: [react(), apiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
})
