#!/usr/bin/env node

// Charge les variables d'environnement
require('dotenv').config({ path: '.env.local' })

/**
 * Script de build pour créer un index de recherche unifié
 * Combine le contenu des billets (.mdx) et des publications (PDF)
 * Génère un index Lunr.js pour recherche côté client ultra-rapide
 */

const fs = require('fs/promises')
const path = require('path')
const matter = require('gray-matter')
const lunr = require('lunr')
const { PrismaClient } = require('@prisma/client')
const { execSync } = require('child_process')

// Fonction pour extraire le texte d'un PDF via script séparé
function extractPdfTextViaScript(pdfUrl) {
  try {
    console.log(`   Extracting PDF text from: ${pdfUrl}`)
    const result = execSync(`npx tsx scripts/extract-pdf-text.ts "${pdfUrl}"`, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer pour gros PDF
      timeout: 30000 // 30s timeout
    })
    return result.trim()
  } catch (error) {
    console.error(`   Error extracting PDF text from ${pdfUrl}:`, error.message)
    return ''
  }
}

const CONTENT_DIR = path.join(process.cwd(), 'content', 'billets')
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'search-index.json')

async function buildSearchIndex() {
  console.log('🔍 Building unified search index...')
  
  const searchDocuments = []
  let billetCount = 0
  let publicationCount = 0

  try {
    // 1. Index des billets (.mdx)
    console.log('📝 Indexing billets...')
    const billetFiles = await fs.readdir(CONTENT_DIR)
    const mdxFiles = billetFiles.filter(f => f.endsWith('.mdx'))
    
    for (const file of mdxFiles) {
      const filePath = path.join(CONTENT_DIR, file)
      const slug = file.replace('.mdx', '')
      const raw = await fs.readFile(filePath, 'utf8')
      const { data, content } = matter(raw)
      
      searchDocuments.push({
        id: `billet:${slug}`,
        type: 'billet',
        title: data.title || slug,
        content: content.substring(0, 2000), // Limite pour performances
        date: data.date || new Date().toISOString().split('T')[0],
        url: `/billets/${slug}`,
        excerpt: data.excerpt,
        tags: data.tags || []
      })
      billetCount++
    }

    // 2. Index des publications (PDF)
    console.log('📄 Indexing publications...')
    const prisma = new PrismaClient()
    
    try {
      const publications = await prisma.article.findMany({
        where: { 
          isPublished: true,
          filePath: { 
            contains: '.pdf',
            mode: 'insensitive'
          }
        }
      })
      
      console.log(`   Found ${publications.length} publications to index`)
      
      for (const publication of publications) {
        try {
          console.log(`   Processing PDF: ${publication.title}`)
          // Utiliser directement le filePath de la base de données
          let pdfUrl = publication.filePath
          
          // Si c'est un chemin relatif, construire l'URL complète
          if (!pdfUrl.startsWith('http')) {
            const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
            pdfUrl = pdfUrl.startsWith('/') ? `${baseUrl}${pdfUrl}` : `${baseUrl}/${pdfUrl}`
          }
          
          console.log(`   PDF URL: ${pdfUrl}`)
          const cleanText = extractPdfTextViaScript(pdfUrl)
          
          if (cleanText) {
            searchDocuments.push({
              id: `publication:${publication.id}`,
              type: 'publication',
              title: publication.title,
              content: cleanText.substring(0, 5000), // Plus de contenu pour les PDF
              date: publication.publishedAt?.toISOString().split('T')[0] || publication.createdAt.toISOString().split('T')[0],
              url: `/publications/${publication.id}`,
              excerpt: publication.description,
              tags: publication.tags || []
            })
            publicationCount++
            console.log(`   ✅ Indexed: ${publication.title}`)
          } else {
            console.log(`   ⚠️  No text extracted from: ${publication.title}`)
          }
        } catch (error) {
          console.warn(`   ❌ Could not index PDF for publication ${publication.id}:`, error.message)
        }
      }
    } catch (dbError) {
      console.error('   ❌ Database error:', dbError.message)
      console.log('   Continuing with billets-only indexing...')
    } finally {
      await prisma.$disconnect()
    }

    // 3. Construction de l'index Lunr.js
    console.log('🏗️  Building Lunr index...')
    const index = lunr(function () {
      this.ref('id')
      this.field('title', { boost: 10 })
      this.field('content')
      this.field('excerpt', { boost: 5 })
      this.field('tags', { boost: 3 })
      
      searchDocuments.forEach(doc => {
        this.add(doc)
      })
    })

    // 4. Sauvegarde de l'index et des documents
    const indexData = {
      index: index.toJSON(),
      documents: searchDocuments,
      metadata: {
        generatedAt: new Date().toISOString(),
        billetCount,
        publicationCount,
        totalDocuments: searchDocuments.length
      }
    }

    await fs.writeFile(OUTPUT_PATH, JSON.stringify(indexData), 'utf8')
    
    console.log('✅ Search index built successfully!')
    console.log(`📊 Indexed: ${billetCount} billets, ${publicationCount} publications`)
    console.log(`💾 Index saved to: ${OUTPUT_PATH}`)
    
  } catch (error) {
    console.error('❌ Error building search index:', error)
    process.exit(1)
  }
}

// Exécution uniquement si appelé directement
if (require.main === module) {
  buildSearchIndex()
}

module.exports = { buildSearchIndex }