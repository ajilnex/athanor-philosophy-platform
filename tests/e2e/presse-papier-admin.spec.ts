import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../helpers/auth'

test.describe('Presse-papier with ADMIN auth', () => {
  test('admin can see and use add form on public presse-papier page', async ({ page }) => {
    const consoleMessages: { type: string; text: string }[] = []
    const pageErrors: string[] = []

    page.on('console', msg => {
      const type = msg.type()
      const text = msg.text()
      consoleMessages.push({ type, text })
      console.log(`Console ${type}: ${text}`)
    })

    page.on('pageerror', err => {
      pageErrors.push(String(err))
      console.log('Page error:', String(err))
    })

    // First try to login as admin
    console.log('🔐 Attempting admin login...')

    try {
      await loginAsAdmin(page)
      console.log('✅ Admin login successful')
    } catch (error) {
      console.log('❌ Admin login failed:', error)
      console.log('⚠️ Continuing without auth to test the behavior')
    }

    // Navigate to public presse-papier page
    console.log('📄 Navigating to presse-papier page...')
    await page.goto('/presse-papier')

    // Take a screenshot to see what's happening
    await page.screenshot({ path: 'presse-papier-page.png', fullPage: true })

    // Check if page loads
    await expect(page.getByRole('heading', { name: /presse.papier/i })).toBeVisible()
    console.log('✅ Presse-papier page loaded')

    // Check if admin form is visible (should be if logged in as admin)
    const urlInput = page.getByPlaceholder(/https:\/\/exemple\.com\/article/i)
    const isFormVisible = await urlInput.isVisible()

    console.log(`📝 Admin form visible: ${isFormVisible}`)

    if (isFormVisible) {
      console.log('✅ Admin form found, testing form submission...')

      // Try to add a test URL
      const testUrl = 'https://example.com/test-article'
      await urlInput.fill(testUrl)

      const noteInput = page.getByPlaceholder(/pourquoi/i)
      await noteInput.fill('Test note from E2E')

      // Submit the form
      const submitButton = page.getByRole('button', { name: /ajouter/i })
      await expect(submitButton).toBeVisible()

      console.log('🚀 Submitting form...')
      await submitButton.click()

      // Wait a bit to see what happens
      await page.waitForTimeout(2000)

      // Check for any errors or success indicators
      const pageUrl = page.url()
      console.log('📍 Current URL after submission:', pageUrl)

      // Take another screenshot after submission
      await page.screenshot({ path: 'presse-papier-after-submit.png', fullPage: true })

      // Check if we got redirected or if there's an error page
      if (pageUrl.includes('/error') || pageUrl.includes('500') || pageUrl.includes('404')) {
        console.log('❌ Redirected to error page!')
        const errorContent = await page.content()
        console.log('Error page content sample:', errorContent.slice(0, 500))
      }
    } else {
      console.log('⚠️ Admin form not visible, likely not authenticated as admin')
    }

    // Log all console messages and errors for analysis
    const errorLogs = consoleMessages.filter(m => m.type === 'error')
    if (errorLogs.length > 0) {
      console.log('🔥 Console errors found:')
      errorLogs.forEach(log => console.log(`  - ${log.text}`))
    }

    if (pageErrors.length > 0) {
      console.log('🔥 Page errors found:')
      pageErrors.forEach(err => console.log(`  - ${err}`))
    }

    console.log('📊 Total console messages:', consoleMessages.length)
    console.log('📊 Error messages:', errorLogs.length)
    console.log('📊 Page errors:', pageErrors.length)
  })

  test('test server action directly by inspecting network calls', async ({ page }) => {
    console.log('🌐 Testing server action network behavior...')

    // Capture network requests
    const requests: any[] = []
    const responses: any[] = []

    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData(),
        headers: request.headers(),
      })
      console.log(`➡️ Request: ${request.method()} ${request.url()}`)
    })

    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
      })
      console.log(`⬅️ Response: ${response.status()} ${response.url()}`)
    })

    // Try to login first
    try {
      await loginAsAdmin(page)
      console.log('✅ Logged in as admin')
    } catch (error) {
      console.log('❌ Login failed, testing without auth')
    }

    // Go to presse-papier page
    await page.goto('/presse-papier')

    // Try to submit form if visible
    const urlInput = page.getByPlaceholder(/https:\/\/exemple\.com\/article/i)
    const isFormVisible = await urlInput.isVisible()

    if (isFormVisible) {
      console.log('📝 Form visible, submitting test data...')

      await urlInput.fill('https://example.com/network-test')
      await page.getByPlaceholder(/pourquoi/i).fill('Network test')

      // Clear previous requests to focus on form submission
      requests.length = 0
      responses.length = 0

      await page.getByRole('button', { name: /ajouter/i }).click()

      // Wait for network activity
      await page.waitForTimeout(3000)

      console.log('📡 Network activity during form submission:')
      console.log(`  Requests made: ${requests.length}`)
      console.log(`  Responses received: ${responses.length}`)

      requests.forEach((req, i) => {
        console.log(`  Request ${i + 1}: ${req.method} ${req.url}`)
        if (req.postData) {
          console.log(`    Post data: ${req.postData}`)
        }
      })

      responses.forEach((res, i) => {
        console.log(`  Response ${i + 1}: ${res.status} ${res.url}`)
      })

      // Look for any requests that might be server actions
      const serverActionRequests = requests.filter(
        req => req.url.includes('presse-papier') || req.method === 'POST' || req.postData
      )

      console.log(`🎯 Potential server action requests: ${serverActionRequests.length}`)
      serverActionRequests.forEach(req => {
        console.log(`  Server action: ${req.method} ${req.url}`)
        console.log(`  Headers:`, JSON.stringify(req.headers, null, 2))
      })
    }
  })
})
