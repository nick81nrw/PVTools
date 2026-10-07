import { copyFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// Routes that get their own index.html, so they can be opened directly
// on any static web server (like the former `nuxt generate` output).
const STATIC_ROUTES = ['impress', 'consumptionProfiles']

const staticRoutes = () => ({
  name: 'static-routes',
  apply: 'build',
  writeBundle() {
    const dist = resolve(import.meta.dirname, 'dist')
    const index = resolve(dist, 'index.html')
    for (const route of STATIC_ROUTES) {
      mkdirSync(resolve(dist, route), { recursive: true })
      copyFileSync(index, resolve(dist, route, 'index.html'))
    }
    copyFileSync(index, resolve(dist, '200.html'))
  },
})

export default defineConfig(({ command }) => ({
  plugins: [vue(), tailwindcss(), staticRoutes()],
  resolve: {
    alias: { '@': import.meta.dirname },
  },
  define: {
    // Backend base URL: local backend during development, APP_URL (or the
    // same origin, e.g. behind the nginx proxy) for production builds
    __API_BASE_URL__: JSON.stringify(
      command === 'serve'
        ? process.env.APP_URL || 'http://localhost:8082'
        : process.env.APP_URL || '',
    ),
    __GOOGLE_ANALYTICS_ID__: JSON.stringify(
      process.env.GOOGLE_ANALYTICS_ID || '',
    ),
  },
  server: { port: 3000 },
}))
