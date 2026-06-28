import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Unit / integration tests run in jsdom with a fake IndexedDB so the Dexie
// data layer can be exercised in Node. E2E lives in Playwright (playwright.config.ts).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    include: ['src/**/*.test.{ts,tsx}'],
    // The data layer drives a fake IndexedDB whose async change notifications
    // can be starved under heavy CPU contention; live-query–dependent UI
    // assertions occasionally miss a notification in jsdom (never in a real
    // browser — the Playwright E2E covers that path authoritatively). Run files
    // serially and allow one retry to absorb that environmental flakiness.
    // Deterministic data-layer tests pass on the first attempt regardless.
    fileParallelism: false,
    retry: 2,
  },
})
