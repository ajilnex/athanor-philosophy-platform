/**
 * Generate intelligent titles for OCR notes using Google Gemini
 * 
 * Usage: npm run generate-titles
 * 
 * IMPORTANT: Free tier limits (December 2024):
 * - 10 RPM (requests per minute)
 * - 20 RPD (requests per day) - VERY LIMITED!
 * 
 * With 682 notes, you need paid tier or ~34 days on free tier.
 * Consider enabling billing for ~$0.05 total cost.
 */

import { PrismaClient } from '@prisma/client'
import { GoogleGenerativeAI } from '@google/generative-ai'

const prisma = new PrismaClient()

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment')
    process.exit(1)
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

// Rate limiting - VERY conservative for free tier
const DELAY_BETWEEN_REQUESTS = 12000  // 12 seconds = 5 RPM (half of 10 RPM limit)
const MAX_NOTES_PER_RUN = 18          // Stay under 20 RPD limit
const MAX_RETRIES = 2
const RETRY_DELAY = 60000             // 60 seconds on rate limit

const PROMPT = `Tu es un assistant expert en philosophie. Analyse ce texte extrait d'une photo (OCR) et génère un TITRE concis mais évocateur.

Le titre doit:
- Capturer l'essence du texte (concepts clés, thèse principale)
- Mentionner l'auteur si identifiable (ex: "Kant sur la raison pure")
- OU contenir une citation marquante entre guillemets si pertinent
- Faire 5-15 mots maximum
- Être en français

Réponds UNIQUEMENT avec le titre, sans guillemets autour, sans explication.

TEXTE:
`

async function sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms))
}

async function generateTitle(text: string, retries = 0): Promise<string> {
    try {
        const truncatedText = text.substring(0, 1500)
        const result = await model.generateContent(PROMPT + truncatedText)
        const response = result.response
        const title = response.text().trim()

        return title
            .replace(/^["«]|["»]$/g, '')
            .replace(/\n/g, ' ')
            .trim()
    } catch (error: unknown) {
        const errorObj = error as { status?: number; message?: string }

        if (errorObj.status === 429 && retries < MAX_RETRIES) {
            console.log(`⏳ Rate limit - pause ${RETRY_DELAY / 1000}s (essai ${retries + 1}/${MAX_RETRIES})...`)
            await sleep(RETRY_DELAY)
            return generateTitle(text, retries + 1)
        }

        if (errorObj.status === 429) {
            console.log('\n🛑 QUOTA JOURNALIER ÉPUISÉ!')
            console.log('   Relance demain ou active la facturation.')
            process.exit(1)
        }

        console.error(`❌ Erreur: ${errorObj.message || error}`)
        return ''
    }
}

async function main() {
    console.log('\n🎨 Génération des titres avec Gemini (Free Tier)')
    console.log('='.repeat(55))
    console.log(`⚠️  Limite: ${MAX_NOTES_PER_RUN} notes par exécution (quota 20/jour)`)
    console.log(`⏱️  Délai: ${DELAY_BETWEEN_REQUESTS / 1000}s entre requêtes`)
    console.log('')

    // Get notes that need processing
    const notes = await prisma.archiveNote.findMany({
        where: {
            status: 'processed',
            extractedText: { not: null }
        },
        select: {
            id: true,
            nodeLabel: true,
            extractedText: true
        },
        orderBy: { createdAt: 'asc' }
    })

    // Filter notes needing titles
    const notesToProcess = notes.filter(note => {
        if (!note.extractedText || note.extractedText.length < 50) return false
        if (note.nodeLabel && note.nodeLabel.length > 25 && !note.nodeLabel.endsWith('...')) return false
        return true
    })

    // Limit to MAX_NOTES_PER_RUN
    const batch = notesToProcess.slice(0, MAX_NOTES_PER_RUN)

    console.log(`📚 ${notesToProcess.length} notes restantes à traiter`)
    console.log(`📦 Ce batch: ${batch.length} notes`)
    console.log(`⏱️  Temps estimé: ~${Math.ceil((batch.length * DELAY_BETWEEN_REQUESTS) / 60000)} minutes`)
    console.log('')

    if (batch.length === 0) {
        console.log('✅ Toutes les notes ont déjà des titres!')
        return
    }

    let processed = 0
    let errors = 0

    for (const note of batch) {
        const title = await generateTitle(note.extractedText!)

        if (title && title.length > 5 && title.length < 150) {
            await prisma.archiveNote.update({
                where: { id: note.id },
                data: { nodeLabel: title }
            })
            processed++
            console.log(`✓ [${processed}/${batch.length}] ${title.substring(0, 60)}...`)
        } else {
            errors++
            console.log(`✗ [${processed + errors}/${batch.length}] Échec`)
        }

        // Rate limiting
        if (processed + errors < batch.length) {
            await sleep(DELAY_BETWEEN_REQUESTS)
        }
    }

    const remaining = notesToProcess.length - batch.length

    console.log('\n' + '='.repeat(55))
    console.log('📊 BATCH TERMINÉ!')
    console.log(`   ✓ Titres générés: ${processed}`)
    console.log(`   ✗ Erreurs: ${errors}`)
    console.log(`   📋 Restant: ${remaining} notes`)

    if (remaining > 0) {
        console.log(`\n💡 Relance demain pour ${Math.min(remaining, MAX_NOTES_PER_RUN)} notes de plus,`)
        console.log('   ou active la facturation pour tout traiter maintenant.')
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
