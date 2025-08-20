import { test, expect } from '@playwright/test'

test.describe('Presse-papier', () => {
  test('presse-papier page loads and shows add form', async ({ page }) => {
    const consoleMessages: { type: string; text: string }[] = []
    const pageErrors: string[] = []

    page.on('console', msg => {
      const type = msg.type()
      const text = msg.text()
      consoleMessages.push({ type, text })
    })

    page.on('pageerror', err => {
      pageErrors.push(String(err))
    })

    // Navigate to presse-papier page
    await page.goto('/presse-papier')

    // Check if page loads without errors
    await expect(page.getByRole('heading', { name: /presse.papier/i })).toBeVisible()

    // Look for URL input field
    const urlInput = page
      .getByPlaceholder(/url/i)
      .or(page.getByLabel(/url/i))
      .or(page.locator('input[type="url"]'))
    await expect(urlInput.first()).toBeVisible()

    // Look for submit button
    const submitButton = page
      .getByRole('button', { name: /ajouter/i })
      .or(page.getByRole('button', { name: /add/i }))
    await expect(submitButton.first()).toBeVisible()

    // Check for errors
    const errorLogs = consoleMessages.filter(m => m.type === 'error')
    if (pageErrors.length || errorLogs.length) {
      console.log('Console logs:', consoleMessages)
      console.log('Page errors:', pageErrors)
      console.log('Error count:', errorLogs.length, 'Page errors:', pageErrors.length)
    }
  })

  test('admin presse-papier page loads and shows form', async ({ page }) => {
    const consoleMessages: { type: string; text: string }[] = []
    const pageErrors: string[] = []

    page.on('console', msg => {
      consoleMessages.push({ type: msg.type(), text: msg.text() })
    })

    page.on('pageerror', err => {
      pageErrors.push(String(err))
    })

    // Navigate to admin presse-papier page
    await page.goto('/admin/presse-papier')

    // Check if we get redirected to login or if page loads
    const currentUrl = page.url()
    console.log('Current URL after navigation:', currentUrl)

    // If redirected to auth, that's expected (no auth in test)
    if (currentUrl.includes('/auth') || currentUrl.includes('/login')) {
      console.log('Redirected to auth as expected (no session)')
      return
    }

    // If we're still on admin page, check for form elements
    if (currentUrl.includes('/admin/presse-papier')) {
      const urlInput = page.getByPlaceholder(/url/i).or(page.locator('input[type="url"]'))
      await expect(urlInput.first()).toBeVisible({ timeout: 5000 })
    }

    // Log any errors for debugging
    const errorLogs = consoleMessages.filter(m => m.type === 'error')
    if (errorLogs.length > 0) {
      console.log('Console errors:', errorLogs)
    }
    if (pageErrors.length > 0) {
      console.log('Page errors:', pageErrors)
    }
  })

  test('test add link API endpoint directly', async ({ page }) => {
    // Test the API endpoint directly to see what error we get
    const testUrl = 'https://example.com'

    try {
      const response = await page.request.post('/api/admin/presse-papier', {
        data: { url: testUrl },
      })

      console.log('API Response Status:', response.status())
      console.log('API Response Headers:', await response.headers())

      if (!response.ok()) {
        const errorText = await response.text()
        console.log('API Error Response:', errorText)

        // Check if it's an auth error (401/403) vs other error
        if (response.status() === 401 || response.status() === 403) {
          console.log('Auth required as expected for admin endpoint')
        } else {
          console.log('Unexpected API error status:', response.status())
        }
      } else {
        const result = await response.json()
        console.log('API Success Response:', result)
      }
    } catch (error) {
      console.log('API Request Error:', error)
    }
  })

  test('check if home page shows presse-papier section', async ({ page }) => {
    await page.goto('/')

    // Look for presse-papier section on home page
    const pressePapierSection = page.getByText(/presse.papier/i)
    await expect(pressePapierSection).toBeVisible()

    // Check if it shows "Aucun lien" or actual links
    const noLinksMessage = page.getByText(/aucun lien/i)
    const hasNoLinks = await noLinksMessage.isVisible()

    console.log('Home page shows no links message:', hasNoLinks)

    if (!hasNoLinks) {
      // Check for link elements
      const linkElements = page.locator('[data-graph-shield] a[href^="http"]')
      const linkCount = await linkElements.count()
      console.log('Number of press clip links found:', linkCount)
    }
  })
})
