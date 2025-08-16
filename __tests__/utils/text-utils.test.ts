// Test utilitaires de texte (simulation)

describe('Utilitaires de texte', () => {
  // Simulation de fonctions utilitaires
  const slugify = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const extractPublicId = (cloudinaryUrl: string): string | null => {
    if (!cloudinaryUrl) return null

    const urlParts = cloudinaryUrl.split('/')
    const fileName = urlParts[urlParts.length - 1]
    const folderIndex = urlParts.indexOf('athanor-articles')

    if (folderIndex !== -1) {
      const fileNameWithoutExt = fileName.split('.')[0]
      return `athanor-articles/${fileNameWithoutExt}`
    }

    return null
  }

  describe('slugify', () => {
    it('convertit le texte en slug', () => {
      expect(slugify('Hello World')).toBe('hello-world')
      expect(slugify('Test@#$%')).toBe('test')
      expect(slugify('  Espaces  multiples  ')).toBe('espaces-multiples')
    })

    it('gère les caractères spéciaux', () => {
      expect(slugify('Café & Thé')).toBe('caf-th')
      expect(slugify('123 Test!')).toBe('123-test')
    })

    it('gère les chaînes vides', () => {
      expect(slugify('')).toBe('')
      expect(slugify('   ')).toBe('')
    })
  })

  describe('extractPublicId', () => {
    it("extrait correctement le public_id d'une URL Cloudinary", () => {
      const url =
        'https://res.cloudinary.com/demo/raw/upload/v1234567890/athanor-articles/1640000000000_document.pdf'
      expect(extractPublicId(url)).toBe('athanor-articles/1640000000000_document')
    })

    it('retourne null pour une URL sans dossier athanor-articles', () => {
      const url = 'https://res.cloudinary.com/demo/raw/upload/v1234567890/other-folder/test.pdf'
      expect(extractPublicId(url)).toBeNull()
    })

    it('gère les URLs nulles ou vides', () => {
      expect(extractPublicId('')).toBeNull()
      expect(extractPublicId(null as any)).toBeNull()
    })

    it('gère les URLs malformées', () => {
      expect(extractPublicId('invalid-url')).toBeNull()
      expect(extractPublicId('https://example.com')).toBeNull()
    })
  })

  describe('Logique de validation', () => {
    const validateEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }

    const sanitizeFilename = (filename: string): string => {
      return filename
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .toLowerCase()
    }

    it('valide les emails', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true)
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
    })

    it('nettoie les noms de fichiers', () => {
      expect(sanitizeFilename('Café & Thé.pdf')).toBe('cafe___the.pdf')
      expect(sanitizeFilename('Test Document (2024).pdf')).toBe('test_document__2024_.pdf')
      expect(sanitizeFilename('simple.txt')).toBe('simple.txt')
    })
  })
})
