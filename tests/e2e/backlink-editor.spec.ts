import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../helpers/auth'

test.describe('Backlink Editor', () => {
  test('capture console logs when using backlink button', async ({ page }) => {
    const consoleMessages: { type: string; text: string; timestamp: number }[] = []

    // Capturer TOUS les logs console
    page.on('console', msg => {
      const type = msg.type()
      const text = msg.text()
      const timestamp = Date.now()
      consoleMessages.push({ type, text, timestamp })

      // Afficher en temps réel les logs qui nous intéressent
      if (
        text.includes('🔧') ||
        text.includes('🎯') ||
        text.includes('🔥') ||
        text.includes('Mode bouton') ||
        text.includes('BacklinkPicker')
      ) {
        console.log(`[${type.toUpperCase()}] ${text}`)
      }
    })

    // Se connecter comme admin
    await loginAsAdmin(page)

    // Aller sur la page éditeur visuel
    await page.goto('/admin/editor')

    // Attendre que la page soit chargée
    await page.waitForLoadState('networkidle')

    // Sélectionner le premier billet pour l'éditer
    await page.click('a[href*="/admin/editor?edit="]')

    // Attendre que l'éditeur soit ouvert
    await page.waitForLoadState('networkidle')

    // Attendre que CodeMirror soit chargé
    await page.waitForSelector('.cm-editor', { timeout: 5000 })

    // Cliquer dans l'éditeur pour avoir le focus
    await page.click('.cm-content')

    // Attendre un peu
    await page.waitForTimeout(1000)

    console.log('📝 Début du test backlink...')

    // Cliquer sur le bouton backlink (texte "Backlink" + icône Link2)
    await page.click('button:has-text("Backlink")')

    // Attendre que la palette s'ouvre
    await page.waitForSelector('text=Insérer un backlink', { timeout: 5000 })

    console.log('🎨 Palette BacklinkPicker ouverte')

    // Cliquer sur un billet existant (par exemple le premier de la liste)
    const firstBillet = page
      .locator('button')
      .filter({ hasText: 'bibliographie-collective' })
      .first()
    if (await firstBillet.isVisible()) {
      await firstBillet.click()
      console.log('📌 Billet sélectionné')
    }

    // Attendre que l'insertion soit faite
    await page.waitForTimeout(2000)

    // Afficher tous les logs capturés
    console.log('\n🔍 LOGS CAPTURÉS:')
    consoleMessages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.type}] ${msg.text}`)
    })

    // Vérifier le contenu de l'éditeur
    const editorContent = await page.textContent('.cm-content')
    console.log('\n📄 Contenu éditeur final:', editorContent)
  })
})
