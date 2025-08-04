'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import cloudinary from '@/lib/cloudinary'

export async function toggleArticlePublished(articleId: string) {
  try {
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

    // 🛡️ PROTECTION: Vérifier le nom de fichier
    if (!file.name.match(/^[a-zA-Z0-9._-]+\.pdf$/)) {
      return { success: false, error: 'Nom de fichier invalide. Utilisez uniquement lettres, chiffres, points, tirets et underscores.' }
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
    
    // Upload to Cloudinary with public access
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw', // For PDF files
          folder: 'athanor-articles', // Organize in folder
          public_id: `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
          use_filename: true,
          access_mode: 'public', // Make files publicly accessible
          type: 'upload' // Ensure upload type
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
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
    redirect(`/articles/${article.id}`)
  } catch (error) {
    console.error('Upload error:', error)
    return { 
      success: false, 
      error: 'Échec de l\'upload de l\'article'
    }
  }
}