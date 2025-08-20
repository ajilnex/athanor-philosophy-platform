import { makeSnippet } from '@/lib/search-utils'

describe('search-utils', () => {
  describe('makeSnippet', () => {
    const sampleText = `
      Cette fonction extrait un extrait contextuel autour du terme recherché.
      Elle trouve la première occurrence et crée un snippet avec highlighting.
      Le texte est nettoyé et les balises HTML sont échappées pour la sécurité.
      Très utile pour les résultats de recherche contextuelle.
    `.trim()

    it('crée un snippet avec le terme trouvé', () => {
      const result = makeSnippet(sampleText, 'occurrence', 200)

      expect(result).toContain('occurrence')
      expect(typeof result).toBe('string')
    })

    it('surligne le terme recherché', () => {
      const result = makeSnippet(sampleText, 'contextuel', 200)

      // makeSnippet utilise <strong> pour le highlighting
      expect(result).toContain('<strong>contextuel</strong>')
    })

    it('échappe les caractères HTML dangereux', () => {
      const dangerousText = 'Test <script>alert("xss")</script> content'
      const result = makeSnippet(dangerousText, 'script', 200)

      // Vérifier que le terme est surligné et HTML échappé
      expect(result).toContain('<strong>script</strong>')
      expect(result).toContain('&lt;') // HTML échappé
      expect(result).not.toContain('<script>alert')
    })

    it('gère les termes non trouvés', () => {
      const result = makeSnippet(sampleText, 'inexistant', 200)

      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('respecte la longueur maximale', () => {
      const longText = 'a'.repeat(1000) + ' target ' + 'b'.repeat(1000)
      const result = makeSnippet(longText, 'target', 100)

      expect(result.length).toBeLessThanOrEqual(200) // includes HTML markup
    })

    it('est insensible à la casse', () => {
      const result = makeSnippet(sampleText, 'FONCTION', 200)

      expect(result).toContain('fonction')
    })

    it('gère les accents et caractères spéciaux', () => {
      const textWithAccents = 'Texte avec des caractères accentués : café, naïveté'
      const result = makeSnippet(textWithAccents, 'café', 200)

      expect(result).toContain('café')
    })

    it('gère les requêtes multi-termes', () => {
      const result = makeSnippet(sampleText, 'fonction extrait', 200)

      expect(result).toContain('fonction')
      expect(result).toContain('extrait')
    })

    it('gère les phrases entre guillemets', () => {
      const result = makeSnippet(sampleText, '"extrait contextuel"', 200)

      expect(result).toContain('extrait')
      expect(result).toContain('contextuel')
    })

    it('nettoie le markdown avant traitement', () => {
      const markdown = '## Titre\n\nParagraphe avec **gras** et *italique*.\n\n`code inline`'
      const result = makeSnippet(markdown, 'gras', 200)

      expect(result).not.toContain('##')
      expect(result).not.toContain('**')
      expect(result).toContain('gras')
    })
  })
})
