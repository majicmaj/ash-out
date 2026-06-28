import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// App build config. Test config lives in vitest.config.ts so the PWA service
// worker is never generated during unit runs.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Ashout — workout & meal tracker',
        short_name: 'Ashout',
        description: 'Log workouts and meals in plain language. Runs entirely on your device.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // The whole app shell is precached so logging works fully offline.
        navigateFallback: '/index.html',
        // The on-device LLM engine is a large, optional chunk: don't precache it
        // for everyone — cache it at runtime the first time AI is enabled, so it
        // still works offline afterwards without bloating every install.
        globIgnores: ['**/webllm-*.js'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/webllm-.*\.js$/,
            handler: 'CacheFirst',
            options: { cacheName: 'webllm-engine', expiration: { maxEntries: 2 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Give the heavy, lazily-imported LLM engine a stable chunk name so the
        // service worker can single it out (see workbox.globIgnores above).
        manualChunks(id) {
          if (id.includes('@mlc-ai/web-llm')) return 'webllm'
        },
      },
    },
  },
})
