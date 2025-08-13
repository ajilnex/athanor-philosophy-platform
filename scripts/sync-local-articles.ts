import { PrismaClient } from '@prisma/client'
import { promises as fs } from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔄 Synchronisation des articles locaux...\n')
    
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    
    // Lire les fichiers dans le dossier uploads
    const files = await fs.readdir(uploadsDir)
    const pdfFiles = files.filter(f => f.endsWith('.pdf'))
    
    console.log(`📁 Trouvé ${pdfFiles.length} fichiers PDF dans uploads/`)
    
    if (pdfFiles.length === 0) {
      console.log('❌ Aucun fichier PDF trouvé')
      return
    }
    
    for (const fileName of pdfFiles) {
      const filePath = `/uploads/${fileName}`
      const fullPath = path.join(uploadsDir, fileName)
      
      // Vérifier si déjà en base
      const existing = await prisma.article.findFirst({
        where: { fileName }
      })
      
      if (existing) {
        console.log(`⏭️  "${fileName}" déjà en base`)
        continue
      }
      
      // Obtenir les stats du fichier
      const stats = await fs.stat(fullPath)
      const fileSize = stats.size
      
      // Nettoyer le nom pour le titre
      const title = fileName
        .replace(/^\d+_+/, '') // Retirer timestamp au début
        .replace(/\.pdf$/, '') // Retirer .pdf
        .replace(/_+/g, ' ') // Remplacer _ par espaces
        .replace(/\s+/g, ' ') // Normaliser espaces
        .trim()
      
      // Créer l'article
      const article = await prisma.article.create({
        data: {
          title,
          fileName,
          filePath,
          fileSize,
          author: 'Aubin Robert', // Par défaut
          tags: [], // PostgreSQL array, vide par défaut 
          isPublished: true,
        }
      })
      
      console.log(`✅ Ajouté: "${title}" (${Math.round(fileSize/1024)}KB)`)
    }
    
    // Statistiques finales
    const totalArticles = await prisma.article.count()
    console.log(`\n📊 Total: ${totalArticles} publication(s) en base`)
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()