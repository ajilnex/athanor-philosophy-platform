#!/usr/bin/env ts-node

/**
 * Script de restauration depuis un snapshot
 * 
 * Ce script :
 * 1. Lit le fichier prisma/snapshot.json
 * 2. Nettoie la base de données locale
 * 3. Restaure les données du snapshot
 * 4. Crée un utilisateur admin local pour les tests
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
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
    filePath: string
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
    authorId: string
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

async function createDevUser(prisma: PrismaClient): Promise<string> {
  console.log('👤 Création de l\'utilisateur admin de développement...')
  
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const adminUser = await prisma.user.create({
    data: {
      id: 'dev-admin-user',
      email: 'admin@athanor.com',
      name: 'Admin Dev',
      role: 'ADMIN',
      hashedPassword
    }
  })
  
  console.log(`  ✅ Utilisateur admin créé: ${adminUser.email}`)
  console.log(`  🔑 Mot de passe: admin123`)
  
  return adminUser.id
}

async function restoreFromSnapshot() {
  console.log('🔄 Restauration depuis le snapshot...\n')
  
  // Vérifier l'existence du snapshot
  const snapshotPath = path.join(process.cwd(), 'prisma', 'snapshot.json')
  
  try {
    await fs.access(snapshotPath)
  } catch {
    console.error('❌ Fichier snapshot.json introuvable!')
    console.error('💡 Exécutez d\'abord: npm run snapshot:create')
    process.exit(1)
  }
  
  // Lire le snapshot
  console.log('📖 Lecture du snapshot...')
  const snapshotContent = await fs.readFile(snapshotPath, 'utf-8')
  const snapshot: SnapshotData = JSON.parse(snapshotContent)
  
  console.log(`📊 Snapshot du ${new Date(snapshot.metadata.createdAt).toLocaleString()}`)
  console.log(`📊 Articles: ${snapshot.metadata.totalArticles}`)
  console.log(`📊 Billets: ${snapshot.metadata.totalBillets}`)
  console.log(`📊 Commentaires: ${snapshot.metadata.totalComments}`)
  
  // Connexion à la BDD locale
  const prisma = new PrismaClient()
  
  try {
    // 1. Nettoyer la base de données (ordre important pour les contraintes)
    console.log('\n🧹 Nettoyage de la base de données...')
    await prisma.comment.deleteMany()
    await prisma.billet.deleteMany()
    await prisma.article.deleteMany()
    await prisma.session.deleteMany()
    await prisma.account.deleteMany()
    await prisma.user.deleteMany()
    await prisma.verificationToken.deleteMany()
    
    // 2. Créer l'utilisateur admin de dev
    const adminUserId = await createDevUser(prisma)
    
    // 3. Restaurer les articles
    if (snapshot.articles.length > 0) {
      console.log('\n📄 Restauration des articles...')
      for (const article of snapshot.articles) {
        await prisma.article.create({
          data: {
            id: article.id,
            title: article.title,
            description: article.description || null,
            author: article.author || null,
            fileName: article.fileName,
            filePath: article.filePath, // URL Cloudinary dev
            fileSize: article.fileSize,
            tags: article.tags,
            category: article.category || null,
            publishedAt: new Date(article.publishedAt),
            isPublished: article.isPublished,
            isSealed: false // Toujours false pour les données de dev
          }
        })
      }
      console.log(`  ✅ ${snapshot.articles.length} articles restaurés`)
    }
    
    // 4. Restaurer les billets
    if (snapshot.billets.length > 0) {
      console.log('\n📝 Restauration des billets...')
      for (const billet of snapshot.billets) {
        await prisma.billet.create({
          data: {
            id: billet.id,
            slug: billet.slug,
            title: billet.title,
            content: billet.content,
            excerpt: billet.excerpt || null,
            tags: billet.tags,
            date: new Date(billet.date),
            isSealed: false // Toujours false pour les données de dev
          }
        })
      }
      console.log(`  ✅ ${snapshot.billets.length} billets restaurés`)
    }
    
    // 5. Restaurer les commentaires (avec admin comme auteur)
    if (snapshot.comments.length > 0) {
      console.log('\n💬 Restauration des commentaires...')
      for (const comment of snapshot.comments) {
        await prisma.comment.create({
          data: {
            id: comment.id,
            content: comment.content,
            authorId: adminUserId, // Assigner à l'admin dev
            targetType: comment.targetType,
            targetId: comment.targetId,
            parentId: comment.parentId || null,
            isApproved: comment.isApproved,
            isVisible: comment.isVisible,
            createdAt: new Date(comment.createdAt)
          }
        })
      }
      console.log(`  ✅ ${snapshot.comments.length} commentaires restaurés`)
    }
    
    console.log('\n🎉 Restauration terminée avec succès!')
    console.log('💡 Vous pouvez maintenant vous connecter avec admin@athanor.com / admin123')
    
  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécution du script
if (import.meta.url === `file://${process.argv[1]}`) {
  restoreFromSnapshot()
}

export { restoreFromSnapshot }