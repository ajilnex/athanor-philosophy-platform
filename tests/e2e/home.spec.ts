import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('loads without console errors and shows key UI', async ({ page }) => {
    const consoleMessages: { type: string; text: string }[] = []
    page.on('console', msg => {
      const type = msg.type()
      const text = msg.text()
      consoleMessages.push({ type, text })
    })
    const pageErrors: string[] = []
    page.on('pageerror', err => {
      pageErrors.push(String(err))
    })

    await page.goto('/')

    // Use level:1 to avoid matching other headings with "Athanor" in text
    await expect(page.getByRole('heading', { level: 1, name: /athanor/i })).toBeVisible()
    await expect(page.getByPlaceholder('Rechercher...')).toBeVisible()

    // Ensure graph asset is present (built during `npm run build`)
    const resp = await page.request.get('/graph-billets.svg')
    expect(resp.ok()).toBeTruthy()

    // Fail test if page errors or console errors found
    const errorLogs = consoleMessages.filter(m => m.type === 'error')
    if (pageErrors.length || errorLogs.length) {
      console.log('Console logs:', consoleMessages)
      console.log('Page errors:', pageErrors)
      throw new Error('Page had console errors or page exceptions')
    }
  })
})
