import { deleteArticle } from '../../app/admin/actions'
import { prisma } from '../../lib/prisma'
import cloudinary from '../../lib/cloudinary'

// Mock des modules
jest.mock('../../lib/prisma')
jest.mock('../../lib/cloudinary')
jest.mock('../../lib/auth', () => ({
  requireAdmin: jest.fn(),
}))

// Mock de next/cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockCloudinary = cloudinary as jest.Mocked<typeof cloudinary>

// Mock auth
const { requireAdmin } = require('../../lib/auth')

describe('deleteArticle', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Par défaut, requireAdmin ne throw pas (admin authentifié)
    requireAdmin.mockResolvedValue(undefined)
  })

  describe('Cas de succès', () => {
    it('supprime un article avec fichier Cloudinary', async () => {
      // Arrange
      const articleId = 'test-article-id'
      const mockArticle = {
        id: articleId,
        title: 'Test Article',
        filePath:
          'https://res.cloudinary.com/test/raw/upload/v123/athanor-articles/1234567890_test.pdf',
      }

      mockPrisma.article.findUnique.mockResolvedValue(mockArticle as any)
      mockPrisma.article.delete.mockResolvedValue(mockArticle as any)
      mockCloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' } as any)

      // Act
      const result = await deleteArticle(articleId)

      // Assert
      expect(result).toEqual({ success: true })
      expect(mockPrisma.article.findUnique).toHaveBeenCalledWith({
        where: { id: articleId },
      })
      expect(mockCloudinary.uploader.destroy).toHaveBeenCalledWith(
        'athanor-articles/1234567890_test',
        { resource_type: 'raw' }
      )
      expect(mockPrisma.article.delete).toHaveBeenCalledWith({
        where: { id: articleId },
      })
    })

    it('supprime un article sans fichier Cloudinary', async () => {
      // Arrange
      const articleId = 'test-article-id'
      const mockArticle = {
        id: articleId,
        title: 'Test Article',
        filePath: null, // Pas de fichier
      }

      mockPrisma.article.findUnique.mockResolvedValue(mockArticle as any)
      mockPrisma.article.delete.mockResolvedValue(mockArticle as any)

      // Act
      const result = await deleteArticle(articleId)

      // Assert
      expect(result).toEqual({ success: true })
      expect(mockCloudinary.uploader.destroy).not.toHaveBeenCalled()
      expect(mockPrisma.article.delete).toHaveBeenCalledWith({
        where: { id: articleId },
      })
    })

    it('continue même si Cloudinary échoue', async () => {
      // Arrange
      const articleId = 'test-article-id'
      const mockArticle = {
        id: articleId,
        title: 'Test Article',
        filePath: 'https://res.cloudinary.com/test/raw/upload/v123/athanor-articles/test.pdf',
      }

      mockPrisma.article.findUnique.mockResolvedValue(mockArticle as any)
      mockPrisma.article.delete.mockResolvedValue(mockArticle as any)
      mockCloudinary.uploader.destroy.mockRejectedValue(new Error('Cloudinary error'))

      // Spy sur console.error pour vérifier le log
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      // Act
      const result = await deleteArticle(articleId)

      // Assert
      expect(result).toEqual({ success: true })
      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ Erreur suppression Cloudinary:',
        expect.any(Error)
      )
      expect(mockPrisma.article.delete).toHaveBeenCalled() // Continue malgré l'erreur

      consoleSpy.mockRestore()
    })
  })

  describe("Cas d'erreur", () => {
    it('retourne erreur si utilisateur non admin', async () => {
      // Arrange
      requireAdmin.mockRejectedValue(new Error('Unauthorized'))

      // Act
      const result = await deleteArticle('test-id')

      // Assert
      expect(result).toEqual({ success: false, error: 'Failed to delete article' })
      expect(mockPrisma.article.findUnique).not.toHaveBeenCalled()
    })

    it('retourne erreur si article introuvable', async () => {
      // Arrange
      const articleId = 'nonexistent-id'
      mockPrisma.article.findUnique.mockResolvedValue(null)

      // Act
      const result = await deleteArticle(articleId)

      // Assert
      expect(result).toEqual({ success: false, error: 'Article not found' })
      expect(mockPrisma.article.delete).not.toHaveBeenCalled()
    })

    it('retourne erreur si suppression DB échoue', async () => {
      // Arrange
      const articleId = 'test-article-id'
      const mockArticle = { id: articleId, title: 'Test', filePath: null }

      mockPrisma.article.findUnique.mockResolvedValue(mockArticle as any)
      mockPrisma.article.delete.mockRejectedValue(new Error('Database error'))

      // Act
      const result = await deleteArticle(articleId)

      // Assert
      expect(result).toEqual({ success: false, error: 'Failed to delete article' })
    })
  })

  describe('Extraction public_id Cloudinary', () => {
    it("extrait correctement le public_id d'une URL Cloudinary standard", async () => {
      // Arrange
      const articleId = 'test-id'
      const mockArticle = {
        id: articleId,
        filePath:
          'https://res.cloudinary.com/demo/raw/upload/v1234567890/athanor-articles/1640000000000_document.pdf',
      }

      mockPrisma.article.findUnique.mockResolvedValue(mockArticle as any)
      mockPrisma.article.delete.mockResolvedValue(mockArticle as any)
      mockCloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' } as any)

      // Act
      await deleteArticle(articleId)

      // Assert
      expect(mockCloudinary.uploader.destroy).toHaveBeenCalledWith(
        'athanor-articles/1640000000000_document',
        { resource_type: 'raw' }
      )
    })

    it('gère les URLs sans dossier athanor-articles', async () => {
      // Arrange
      const articleId = 'test-id'
      const mockArticle = {
        id: articleId,
        filePath: 'https://res.cloudinary.com/demo/raw/upload/v1234567890/other-folder/test.pdf',
      }

      mockPrisma.article.findUnique.mockResolvedValue(mockArticle as any)
      mockPrisma.article.delete.mockResolvedValue(mockArticle as any)

      // Act
      await deleteArticle(articleId)

      // Assert
      // Ne doit pas appeler destroy si pas dans le bon dossier
      expect(mockCloudinary.uploader.destroy).not.toHaveBeenCalled()
    })
  })
})
