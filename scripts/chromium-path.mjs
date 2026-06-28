/**
 * Resolve a usable Chromium executable. In this environment Playwright's bundled
 * revision differs from the pre-installed one under PLAYWRIGHT_BROWSERS_PATH, so
 * we locate the existing binary instead of downloading. Returns undefined to let
 * Playwright use its own default when nothing pre-installed is found.
 */
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export function findChromium() {
  if (process.env.CHROMIUM_PATH && existsSync(process.env.CHROMIUM_PATH)) {
    return process.env.CHROMIUM_PATH
  }
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH
  if (!base || !existsSync(base)) return undefined

  const dir = readdirSync(base)
    .filter((d) => d.startsWith('chromium-'))
    .sort()
    .pop()
  if (!dir) return undefined

  const bin = join(base, dir, 'chrome-linux', 'chrome')
  return existsSync(bin) ? bin : undefined
}
