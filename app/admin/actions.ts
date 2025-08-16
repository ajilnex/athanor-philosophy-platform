'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import cloudinary from '@/lib/cloudinary'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// Helper function pour vérifier les permissions admin
async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    throw new Error('Authentification admin requise')
  }
  return session
}

export async function toggleArticlePublished(articleId: string) {
  try {
    await requireAdmin() // Vérification admin obligatoire

    const article = await prisma.article.findUnique({
      where: { id: articleId },
    })

    if (!article) {
      throw new Error('Article not found')
    }

    await prisma.article.update({
      where: { id: articleId },
      data: { isPublished: !article.isPublished },
    })

    revalidatePath('/admin/articles')
    return { success: true }
  } catch (error) {
    console.error('Error toggling article:', error)
    return { success: false, error: 'Failed to update article' }
  }
}

export async function deleteArticle(articleId: string) {
  try {
    await requireAdmin() // Vérification admin obligatoire

    // 1. Lire l'article pour obtenir l'URL Cloudinary
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    })

    if (!article) {
      return { success: false, error: 'Article not found' }
    }

    // 2. Extraire le public_id de l'URL Cloudinary
    // Format URL: https://res.cloudinary.com/[cloud]/raw/upload/v[version]/[folder]/[public_id].[ext]
    let publicId = null
    if (article.filePath) {
      const urlParts = article.filePath.split('/')
      const fileName = urlParts[urlParts.length - 1] // Dernier segment
      const folderIndex = urlParts.indexOf('athanor-articles')

      if (folderIndex !== -1) {
        // Reconstruire le public_id avec le dossier
        const fileNameWithoutExt = fileName.split('.')[0]
        publicId = `athanor-articles/${fileNameWithoutExt}`
      }
    }

    // 3. Supprimer le fichier de Cloudinary si possible
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId, {
          resource_type: 'raw',
        })
        console.log(`✅ Fichier Cloudinary supprimé: ${publicId}`)
      } catch (cloudError) {
        console.error('⚠️ Erreur suppression Cloudinary:', cloudError)
        // Continuer même si la suppression Cloudinary échoue
      }
    }

    // 4. Supprimer l'enregistrement de la base de données
    await prisma.article.delete({
      where: { id: articleId },
    })

    revalidatePath('/admin/articles')
    return { success: true }
  } catch (error) {
    console.error('Error deleting article:', error)
    return { success: false, error: 'Failed to delete article' }
  }
}

export async function uploadArticle(formData: FormData) {
  try {
    await requireAdmin() // Vérification admin obligatoire

    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const author = formData.get('author') as string
    const category = formData.get('category') as string
    const tagsString = formData.get('tags') as string

    // Validations
    if (!file) {
      return { success: false, error: 'Aucun fichier fourni' }
    }

    if (!title?.trim()) {
      return { success: false, error: 'Le titre est obligatoire' }
    }

    if (file.type !== 'application/pdf') {
      return { success: false, error: 'Seuls les fichiers PDF sont autorisés' }
    }

    // 🛡️ PROTECTION: Limite de taille (50MB max)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return { success: false, error: 'La taille du fichier doit être inférieure à 50MB' }
    }

    // 🛡️ PROTECTION: Vérifier le nom de fichier (plus permissif)
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return { success: false, error: "Le fichier doit avoir l'extension .pdf" }
    }

    // Vérifier la longueur du nom de fichier
    if (file.name.length > 255) {
      return { success: false, error: 'Le nom de fichier est trop long (maximum 255 caractères)' }
    }

    // Parse tags
    let tags: string[] = []
    try {
      tags = JSON.parse(tagsString || '[]')
    } catch {
      tags = tagsString ? tagsString.split(',').map(t => t.trim()) : []
    }

    // Convert file to buffer for Cloudinary upload
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Nettoyer le nom de fichier pour Cloudinary (conserver les caractères français)
    const cleanFileName = file.name
      .normalize('NFD') // Décomposer les caractères accentués
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les diacritiques
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Remplacer les caractères spéciaux par des underscores
      .toLowerCase()

    // Upload to Cloudinary with public access
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: 'raw', // For PDF files
            folder: 'athanor-articles', // Organize in folder
            public_id: `${Date.now()}_${cleanFileName}`,
            use_filename: false, // Use our cleaned public_id instead
            access_mode: 'public', // Make files publicly accessible
            type: 'upload', // Ensure upload type
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
        .end(buffer)
    })

    const cloudinaryResult = uploadResult as any

    // Save to database with Cloudinary URL
    const article = await prisma.article.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        author: author?.trim() || null,
        fileName: file.name,
        filePath: cloudinaryResult.secure_url, // Store Cloudinary URL
        fileSize: file.size,
        tags: tags,
        category: category?.trim() || null,
        isPublished: true,
      },
    })

    revalidatePath('/admin/articles')
    return { success: true, articleId: article.id }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: "Échec de l'upload de l'article",
    }
  }
}
