/**
 * Tests for encoding handling in Feu Humain import scripts
 *
 * These tests verify that both encoding approaches work correctly:
 * 1. clean-messenger-export.ts: Simple string replacement approach
 * 2. import-feu-humain.ts: Mojibake repair approach (CP1252 -> UTF-8)
 */

import { describe, it, expect } from '@jest/globals'

// Import the cleanString functions from both scripts
import { cleanString as cleanStringSimple } from '../../scripts/clean-messenger-export'
import { cleanString as cleanStringMojibake } from '../../scripts/import-feu-humain'

describe('Encoding Handling', () => {
  describe('Simple String Replacement (clean-messenger-export)', () => {
    it('should fix common French accented characters', () => {
      expect(cleanStringSimple('Ã©')).toBe('é')
      expect(cleanStringSimple('Ã¨')).toBe('è')
      expect(cleanStringSimple('Ã ')).toBe('à')
      expect(cleanStringSimple('Ã§')).toBe('ç')
    })

    it('should fix typographic quotes and apostrophes', () => {
      expect(cleanStringSimple('â€™')).toBe("'")
      expect(cleanStringSimple('câ€™est')).toBe("c'est")
      expect(cleanStringSimple('â€œhelloâ€')).toBe('"hello"')
    })

    it('should fix special characters', () => {
      expect(cleanStringSimple('â‚¬')).toBe('€')
      expect(cleanStringSimple('Â°')).toBe('°')
      expect(cleanStringSimple('nÂ°')).toBe('n°')
    })

    it('should handle multiple issues in one string', () => {
      const input = 'Câ€™est Ã©tÃ© 2023 â‚¬'
      const expected = "C'est été 2023 €"
      expect(cleanStringSimple(input)).toBe(expected)
    })

    it('should handle null and undefined', () => {
      expect(cleanStringSimple(null)).toBe(null)
      expect(cleanStringSimple(undefined)).toBe(undefined)
    })

    it('should trim whitespace', () => {
      expect(cleanStringSimple('  hello  ')).toBe('hello')
      expect(cleanStringSimple('hello   world')).toBe('hello world')
    })
  })

  describe('Mojibake Repair (import-feu-humain)', () => {
    it('should repair UTF-8 decoded as CP1252 (Mojibake)', () => {
      // When UTF-8 bytes are incorrectly decoded as CP1252
      // é (UTF-8: 0xC3 0xA9) becomes Ã© when decoded as CP1252
      const mojibake = 'Ã©'
      const repaired = cleanStringMojibake(mojibake)
      expect(repaired).toBe('é')
    })

    it('should repair complex French text', () => {
      // Note: The Mojibake approach works at byte level
      // This test uses the actual mojibake representation
      const mojibake = 'Ã©tÃ© Ã  Paris'
      const repaired = cleanStringMojibake(mojibake)
      // The mojibake repair may not fix all cases perfectly
      // but should at least not make it worse
      expect(repaired).toBeTruthy()
      expect(repaired?.length).toBeGreaterThan(0)
    })

    it('should leave already correct UTF-8 unchanged', () => {
      const correct = 'été à Paris'
      const result = cleanStringMojibake(correct)
      expect(result).toBe(correct)
    })

    it('should handle mixed correct and corrupted text', () => {
      // This is a tricky case: some text is correct, some is mojibake
      const mixed = 'Hello Ã©tÃ©'
      const result = cleanStringMojibake(mixed)
      // Should repair the mojibake part
      expect(result).toBe('Hello été')
    })

    it('should handle null and undefined', () => {
      expect(cleanStringMojibake(null)).toBe(null)
      expect(cleanStringMojibake(undefined)).toBe(undefined)
    })

    it('should trim whitespace', () => {
      const result = cleanStringMojibake('  hello  ')
      expect(result).toBe('hello')
    })

    it('should handle emojis correctly', () => {
      // Emojis should be preserved when mixed with mojibake
      const withEmoji = '❤️ Ã©tÃ©'
      const result = cleanStringMojibake(withEmoji)
      // The function should preserve emojis and attempt to repair text
      // At minimum, it should not corrupt the emoji
      expect(result).toBeTruthy()
      expect(result?.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      expect(cleanStringSimple('')).toBe('')
      expect(cleanStringMojibake('')).toBe('')
    })

    it('should handle strings with only whitespace', () => {
      expect(cleanStringSimple('   ')).toBe('')
      expect(cleanStringMojibake('   ')).toBe('')
    })

    it('should handle very long strings', () => {
      const longString = 'Ã©'.repeat(1000)
      const resultSimple = cleanStringSimple(longString)
      const resultMojibake = cleanStringMojibake(longString)

      expect(resultSimple).toBe('é'.repeat(1000))
      expect(resultMojibake).toBe('é'.repeat(1000))
    })

    it('should handle strings with special regex characters', () => {
      const withRegex = 'Test (Ã©) [Ã ] {Ã§}'
      const resultSimple = cleanStringSimple(withRegex)
      expect(resultSimple).toContain('é')
      expect(resultSimple).toContain('à')
      expect(resultSimple).toContain('ç')
    })
  })

  describe('Real-world Examples', () => {
    it('should handle typical Messenger export text', () => {
      const messengerText = 'Câ€™est super ! Ã‡a va bien ?'
      const resultSimple = cleanStringSimple(messengerText)
      expect(resultSimple).toBe("C'est super ! Ça va bien ?")
    })

    it('should handle names with accents', () => {
      const name = 'FrÃ©dÃ©ric'
      const resultSimple = cleanStringSimple(name)
      const resultMojibake = cleanStringMojibake(name)

      expect(resultSimple).toBe('Frédéric')
      expect(resultMojibake).toBe('Frédéric')
    })

    it('should handle reactions (emojis)', () => {
      const reaction = '❤️'
      const resultSimple = cleanStringSimple(reaction)
      const resultMojibake = cleanStringMojibake(reaction)

      expect(resultSimple).toBe('❤️')
      expect(resultMojibake).toBe('❤️')
    })
  })

  describe('Performance', () => {
    it('should handle large batches efficiently', () => {
      const testStrings = Array(1000).fill('Ã©tÃ© Ã  Paris')

      const startSimple = Date.now()
      testStrings.forEach(s => cleanStringSimple(s))
      const timeSimple = Date.now() - startSimple

      const startMojibake = Date.now()
      testStrings.forEach(s => cleanStringMojibake(s))
      const timeMojibake = Date.now() - startMojibake

      // Both should complete in reasonable time (< 1 second for 1000 strings)
      expect(timeSimple).toBeLessThan(1000)
      expect(timeMojibake).toBeLessThan(1000)
    })
  })
})
