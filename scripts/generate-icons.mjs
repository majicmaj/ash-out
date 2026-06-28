/**
 * Rasterize public/favicon.svg into the PNG icons the PWA manifest needs.
 * Uses the Chromium that Playwright already provides — no native image deps.
 *
 *   node scripts/generate-icons.mjs
 */
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { findChromium } from './chromium-path.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const svg = await readFile(`${root}public/favicon.svg`, 'utf8')

const targets = [
  { file: 'pwa-192.png', size: 192 },
  { file: 'pwa-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
]

const browser = await chromium.launch({ executablePath: findChromium() })
const page = await browser.newPage()

for (const { file, size } of targets) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    `<style>html,body{margin:0}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`,
  )
  const png = await page.locator('svg').screenshot({ omitBackground: true })
  await writeFile(`${root}public/${file}`, png)
  console.log(`wrote public/${file} (${size}px)`)
}

await browser.close()
