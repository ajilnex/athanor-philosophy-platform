#!/usr/bin/env ts-node

/**
 * Script de création de snapshot depuis la production
 * 
 * Ce script :
 * 1. Se connecte à la BDD de production
 * 2. Récupère les données publiques (Articles/Billets non scellés, Comments approuvés)
 * 3. Anonymise les données sensibles
 * 4. Migre les fichiers Cloudinary de prod vers dev
 * 5. Génère prisma/snapshot.json
 */

import { PrismaClient } from '@prisma/client'
import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs/promises'
import path from 'path'

// Types pour le snapshot
interface SnapshotData {
  articles: Array<{
    id: string
    title: string
    description?: string
    author?: string
    fileName: string
    filePath: string // URL Cloudinary dev après migration
    fileSize: number
    tags: string[]
    category?: string
    publishedAt: string
    isPublished: boolean
  }>
  billets: Array<{
    id: string
    slug: string
    title: string
    content: string
    excerpt?: string
    tags: string[]
    date: string
  }>
  comments: Array<{
    id: string
    content: string
    authorId: string // Anonymisé
    targetType: string
    targetId: string
    parentId?: string
    isApproved: boolean
    isVisible: boolean
    createdAt: string
  }>
  metadata: {
    createdAt: string
    source: string
    totalArticles: number
    totalBillets: number
    totalComments: number
  }
}

// Configuration Cloudinary pour l'environnement de développement
function setupDevCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME_DEV || process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY_DEV || process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET_DEV || process.env.CLOUDINARY_API_SECRET,
  })
}

async function migrateCloudinaryFile(prodUrl: string, fileName: string): Promise<string> {
  try {
    console.log(`  📦 Migration ${fileName}...`)
    
    // Upload depuis l'URL de production vers le compte dev
    const result = await cloudinary.uploader.upload(prodUrl, {
      resource_type: 'raw',
      folder: 'athanor-articles-dev', // Dossier séparé pour dev
      public_id: `dev_${Date.now()}_${fileName}`,
      use_filename: false,
      access_mode: 'public'
    })
    
    console.log(`    ✅ Migré vers: ${result.secure_url}`)
    return result.secure_url
    
  } catch (error) {
    console.error(`    ❌ Erreur migration ${fileName}:`, error)
    // Retourner l'URL originale en cas d'échec
    return prodUrl
  }
}

async function createSnapshot() {
  console.log('🏗️  Création du snapshot depuis la production...\n')
  
  // Configuration Cloudinary dev
  setupDevCloudinary()
  
  // Connexion à la BDD de production (via variables d'env)
  const prisma = new PrismaClient()
  
  try {
    // 1. Récupérer les articles publics
    console.log('📄 Récupération des articles publics...')
    const rawArticles = await prisma.article.findMany({
      where: {
        isSealed: false // Seulement les articles non scellés
      },
      orderBy: { publishedAt: 'desc' }
    })
    
    // 2. Migration Cloudinary des articles
    console.log('☁️  Migration des fichiers Cloudinary...')
    const articles = []
    for (const article of rawArticles) {
      const devUrl = await migrateCloudinaryFile(article.filePath, article.fileName)
      
      articles.push({
        id: article.id,
        title: article.title,
        description: article.description,
        author: article.author,
        fileName: article.fileName,
        filePath: devUrl, // URL dev après migration
        fileSize: article.fileSize,
        tags: article.tags,
        category: article.category,
        publishedAt: article.publishedAt.toISOString(),
        isPublished: article.isPublished
      })
    }
    
    // 3. Récupérer les billets publics
    console.log('📝 Récupération des billets publics...')
    const rawBillets = await prisma.billet.findMany({
      where: {
        isSealed: false // Seulement les billets non scellés
      },
      orderBy: { date: 'desc' }
    })
    
    const billets = rawBillets.map(billet => ({
      id: billet.id,
      slug: billet.slug,
      title: billet.title,
      content: billet.content,
      excerpt: billet.excerpt,
      tags: billet.tags,
      date: billet.date.toISOString()
    }))
    
    // 4. Récupérer les commentaires publics (anonymisés)
    console.log('💬 Récupération des commentaires publics...')
    const rawComments = await prisma.comment.findMany({
      where: {
        isApproved: true,
        isVisible: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    const comments = rawComments.map(comment => ({
      id: comment.id,
      content: comment.content,
      authorId: 'anonymous-user', // Anonymisation
      targetType: comment.targetType,
      targetId: comment.targetId,
      parentId: comment.parentId,
      isApproved: comment.isApproved,
      isVisible: comment.isVisible,
      createdAt: comment.createdAt.toISOString()
    }))
    
    // 5. Créer le snapshot
    const snapshot: SnapshotData = {
      articles,
      billets,
      comments,
      metadata: {
        createdAt: new Date().toISOString(),
        source: 'production',
        totalArticles: articles.length,
        totalBillets: billets.length,
        totalComments: comments.length
      }
    }
    
    // 6. Sauvegarder le snapshot
    const snapshotPath = path.join(process.cwd(), 'prisma', 'snapshot.json')
    await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2))
    
    console.log('\n✅ Snapshot créé avec succès!')
    console.log(`📊 Articles: ${articles.length}`)
    console.log(`📊 Billets: ${billets.length}`) 
    console.log(`📊 Commentaires: ${comments.length}`)
    console.log(`💾 Fichier: ${snapshotPath}`)
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du snapshot:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécution du script
if (import.meta.url === `file://${process.argv[1]}`) {
  createSnapshot()
}

export { createSnapshot }