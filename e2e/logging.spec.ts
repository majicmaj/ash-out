import { test, expect, type Page } from '@playwright/test'

// Each Playwright test gets a fresh browser context, so IndexedDB starts empty.

/** A journal entry, scoped to the list so it never collides with the composer. */
const entry = (page: Page, text: string) => page.getByRole('listitem').filter({ hasText: text })

async function log(page: Page, text: string) {
  await page.getByLabel(/new log entry/i).fill(text)
  await page.getByRole('button', { name: /log it/i }).click()
}

test.describe('Ashout logging', () => {
  test('shows the empty state on first visit', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/start your journal/i)).toBeVisible()
  })

  test('logs an entry and shows it in the journal', async ({ page }) => {
    await page.goto('/')
    await log(page, 'bench press 3x8 at 60kg')

    await expect(entry(page, 'bench press 3x8 at 60kg')).toBeVisible()
    await expect(page.getByText('Today')).toBeVisible()
    // Composer resets for the next entry.
    await expect(page.getByLabel(/new log entry/i)).toHaveValue('')
  })

  test('auto-structures a workout into muscle-group and volume chips', async ({ page }) => {
    await page.goto('/')
    await log(page, 'bench press 3x8 at 60kg')

    const row = entry(page, 'bench press 3x8 at 60kg')
    await expect(row.getByText('chest')).toBeVisible()
    await expect(row.getByText('triceps')).toBeVisible()
    await expect(row.getByText(/kg volume/i)).toBeVisible()
  })

  test('aggregates insights and ranks muscle groups', async ({ page }) => {
    await page.goto('/')
    await log(page, 'bench press 3x8 at 60kg')
    await expect(entry(page, 'bench press 3x8 at 60kg').getByText('chest')).toBeVisible()

    await page.getByRole('tab', { name: /insights/i }).click()
    await expect(page.getByText(/muscle group leaderboard/i)).toBeVisible()
    await expect(page.getByText('Total sets')).toBeVisible()
    await expect(page.getByText('chest')).toBeVisible()
  })

  test('persists entries across a reload (on-device storage)', async ({ page }) => {
    await page.goto('/')
    await log(page, '5k easy run')
    await expect(entry(page, '5k easy run')).toBeVisible()

    await page.reload()
    await expect(entry(page, '5k easy run')).toBeVisible()
  })

  test('edits an entry', async ({ page }) => {
    await page.goto('/')
    await log(page, 'sqats 5x5')

    const row = entry(page, 'sqats 5x5')
    await row.getByRole('button', { name: /edit entry/i }).click()
    await page.getByLabel(/edit entry text/i).fill('squats 5x5')
    await page.getByRole('button', { name: /^save$/i }).click()

    await expect(entry(page, 'squats 5x5')).toBeVisible()
  })

  test('deletes an entry after confirmation', async ({ page }) => {
    await page.goto('/')
    await log(page, 'temporary note')

    const row = entry(page, 'temporary note')
    await row.getByRole('button', { name: /^delete entry$/i }).click()
    await row.getByRole('button', { name: /confirm delete/i }).click()

    await expect(entry(page, 'temporary note')).toHaveCount(0)
  })

  test('works offline after the first load (PWA shell)', async ({ page, context }) => {
    await page.goto('/')
    await log(page, 'offline entry')
    await expect(entry(page, 'offline entry')).toBeVisible()

    // Give the service worker a moment to take control, then cut the network.
    await page.waitForTimeout(1000)
    await context.setOffline(true)
    await page.reload()

    // The shell loads from the service worker cache and data from IndexedDB.
    await expect(entry(page, 'offline entry')).toBeVisible()
    await context.setOffline(false)
  })
})
