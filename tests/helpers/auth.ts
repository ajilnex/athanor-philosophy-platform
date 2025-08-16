import { Page } from '@playwright/test'

export async function loginAsAdmin(page: Page) {
  // Aller sur la page de connexion
  await page.goto('/auth/signin')

  // Remplir le formulaire de connexion
  await page.fill('#email', 'admin@athanor.com')
  await page.fill('#password', 'admin123')

  // Cliquer sur le bouton de connexion
  await page.click('button[type="submit"]')

  // Attendre la redirection
  await page.waitForURL('/admin', { timeout: 10000 })

  console.log('✅ Connexion admin réussie')
}
