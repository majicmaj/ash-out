import { defineConfig, devices } from '@playwright/test'
import { findChromium } from './scripts/chromium-path.mjs'

// E2E drives the real production-style build in headless Chromium with a real
// IndexedDB, so the logging flow is validated end to end before a human looks.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use the pre-installed Chromium; its build differs from Playwright's
        // bundled revision in this environment. Falls back to default elsewhere.
        launchOptions: { executablePath: findChromium() },
      },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
