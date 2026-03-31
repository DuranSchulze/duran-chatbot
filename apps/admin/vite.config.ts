import type { IncomingMessage, ServerResponse } from 'node:http'
import fs from 'fs'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig, type Connect, type PluginOption, type ViteDevServer } from 'vite'

// Custom plugin to handle API requests for config file
const apiPlugin = (): PluginOption => ({
  name: 'api-server',
  configureServer(server: ViteDevServer) {
    server.middlewares.use('/api/config', (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
      const configPath = path.resolve(__dirname, '../../data/config.json')
      
      // GET - Read config
      if (req.method === 'GET') {
        try {
          const data = fs.readFileSync(configPath, 'utf-8')
          res.setHeader('Content-Type', 'application/json')
          res.end(data)
        } catch (err) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Failed to read config' }))
        }
        return
      }
      
      // POST - Save config
      if (req.method === 'POST') {
        let body = ''
        req.on('data', (chunk: Buffer) => {
          body += chunk.toString()
        })
        req.on('end', () => {
          try {
            const config = JSON.parse(body)
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true }))
          } catch (err) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Failed to save config' }))
          }
        })
        return
      }
      
      next()
    })
  }
})

export default defineConfig({
  plugins: [react(), apiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
})
