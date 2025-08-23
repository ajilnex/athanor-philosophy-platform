import { Page, expect } from '@playwright/test'

export async function loginAsAdmin(page: Page) {
  console.log('🔐 Attempting admin login...')

  const email = process.env.ADMIN_EMAIL || 'admin@athanor.com'
  const password = process.env.ADMIN_PASSWORD || 'admin123'

  // Aller sur la page de connexion
  await page.goto('/auth/signin', { waitUntil: 'networkidle' })

  // Attendre que la page soit chargée
  await expect(page.locator('body')).toBeVisible()

  // Chercher les champs de connexion avec plusieurs sélecteurs possibles
  const emailField = page.locator('input[name="email"], input[type="email"], #email').first()
  const passwordField = page
    .locator('input[name="password"], input[type="password"], #password')
    .first()

  // Vérifier que les champs existent
  await expect(emailField).toBeVisible({ timeout: 5000 })
  await expect(passwordField).toBeVisible({ timeout: 5000 })

  // Remplir le formulaire de connexion
  await emailField.fill(email)
  await passwordField.fill(password)

  console.log('📝 Form filled, submitting...')

  // Cliquer sur le bouton de connexion avec plusieurs sélecteurs possibles
  const submitButton = page
    .locator(
      'button[type="submit"], input[type="submit"], button:has-text("connexion"), button:has-text("login")'
    )
    .first()
  await expect(submitButton).toBeVisible()
  await submitButton.click()

  // Attendre la redirection ou vérifier qu'on est connecté
  try {
    await page.waitForURL('/admin', { timeout: 10000 })
    console.log('✅ Redirected to admin dashboard')
  } catch (error) {
    // Si pas de redirection exacte, vérifier qu'on n'est plus sur signin
    await page.waitForURL(url => !url.toString().includes('/auth/signin'), { timeout: 10000 })
    console.log('✅ Login successful (not on signin page)')
  }

  console.log('✅ Admin login completed')
}
