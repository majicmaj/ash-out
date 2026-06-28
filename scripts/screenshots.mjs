/**
 * Capture screenshots of the running app for visual review.
 * Requires the preview server on http://localhost:4173.
 *
 *   npm run preview & node scripts/screenshots.mjs
 */
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { findChromium } from './chromium-path.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const outDir = `${root}.screenshots`
await mkdir(outDir, { recursive: true })

const browser = await chromium.launch({ executablePath: findChromium() })
const page = await browser.newPage({ viewport: { width: 420, height: 880 }, deviceScaleFactor: 2 })

await page.goto('http://localhost:4173/')
await page.waitForSelector('text=Start your journal')
await page.screenshot({ path: `${outDir}/1-empty.png` })

const entries = [
  'bench press 3x8 @ 60kg, felt strong',
  'grilled chicken salad + rice',
  '5k easy run, zone 2',
]
for (const text of entries) {
  await page.getByLabel(/new log entry/i).fill(text)
  await page.getByRole('button', { name: /log it/i }).click()
  await page.waitForTimeout(150)
}
await page.screenshot({ path: `${outDir}/2-journal.png` })

await page.getByRole('button', { name: /data & settings/i }).click()
await page.waitForSelector('text=Data & settings')
await page.screenshot({ path: `${outDir}/3-settings.png` })

await browser.close()
console.log('screenshots written to', outDir)
