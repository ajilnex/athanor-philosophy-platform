/**
 * Operation ARO - Archive OCRisation (Tesseract.js version)
 * 
 * Processes photos from FEU HUMAIN archive using local Tesseract.js OCR.
 * 100% free, runs locally, no cloud API needed.
 * 
 * Usage: npx dotenv-cli -e .env.local -- npx tsx scripts/operation-aro-tesseract.ts
 */

import { PrismaClient } from '@prisma/client'
import Tesseract from 'tesseract.js'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface ProcessingStats {
    total: number
    processed: number
    withText: number
    skipped: number
    errors: number
}

/**
 * Extract keywords from OCR text
 */
function extractKeywords(text: string): string[] {
    const stopWords = new Set([
        'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'à', 'au', 'en',
        'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'on', 'ce', 'ça',
        'est', 'sont', 'a', 'ont', 'fait', 'faire', 'dit', 'dire', 'avec', 'pour',
        'pas', 'ne', 'que', 'qui', 'quoi', 'où', 'quand', 'comment', 'pourquoi',
        'dans', 'sur', 'sous', 'par', 'mais', 'donc', 'car', 'ni', 'si', 'même',
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
        'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'
    ])

    const words = text
        .toLowerCase()
        .replace(/[^a-zàâäéèêëïîôùûüç\s-]/gi, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word))

    const wordCount = new Map<string, number>()
    words.forEach(word => {
        wordCount.set(word, (wordCount.get(word) || 0) + 1)
    })

    return Array.from(wordCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word)
}

/**
 * Generate a short label for the graph node
 */
function generateNodeLabel(text: string): string {
    const lines = text.trim().split('\n').filter(l => l.trim().length > 2)
    if (lines.length > 0) {
        const firstLine = lines[0].trim()
        if (firstLine.length <= 40) return firstLine
        return firstLine.substring(0, 37) + '...'
    }
    return text.substring(0, 40).trim() + '...'
}

/**
 * Process a single image with Tesseract.js
 */
async function processImage(
    worker: Tesseract.Worker,
    imagePath: string
): Promise<{ text: string; confidence: number } | null> {
    try {
        const result = await worker.recognize(imagePath)
        const text = result.data.text.trim()

        if (text.length < 10) {
            return null // Too short to be meaningful
        }

        return {
            text,
            confidence: result.data.confidence
        }
    } catch (error) {
        console.error(`Error processing ${path.basename(imagePath)}:`, error)
        return null
    }
}

/**
 * Main ARO processing function
 */
async function runOperationARO(archiveSlug: string, limit: number = 1000) {
    console.log('\n🔥 OPERATION ARO - Archive OCRisation (Tesseract.js)')
    console.log('='.repeat(55))
    console.log(`Archive: ${archiveSlug}`)
    console.log(`Limit: ${limit} images`)
    console.log('Engine: Tesseract.js (100% local, FREE)')
    console.log('')

    // 1. Get the archive
    const archive = await prisma.conversationArchive.findUnique({
        where: { slug: archiveSlug }
    })

    if (!archive) {
        throw new Error(`Archive not found: ${archiveSlug}`)
    }

    console.log(`📁 Found archive: ${archive.title}`)

    // 2. Get unprocessed photos
    const mediaItems = await prisma.conversationMedia.findMany({
        where: {
            message: { archiveId: archive.id },
            type: 'photo',
            note: { is: null }
        },
        include: { message: true },
        orderBy: { createdAt: 'asc' },
        take: limit
    })

    console.log(`📷 Found ${mediaItems.length} unprocessed photos`)

    if (mediaItems.length === 0) {
        console.log('✅ All photos already processed!')
        return
    }

    // 3. Initialize Tesseract worker
    console.log('🔧 Initializing Tesseract.js (downloading language data if needed)...')
    const worker = await Tesseract.createWorker('fra+eng', 1, {
        logger: (m) => {
            if (m.status === 'recognizing text') {
                // Silent during recognition
            } else if (m.status) {
                process.stdout.write(`\r   ${m.status}: ${Math.round((m.progress || 0) * 100)}%`)
            }
        }
    })
    console.log('\n✅ Tesseract.js ready')

    const stats: ProcessingStats = {
        total: mediaItems.length,
        processed: 0,
        withText: 0,
        skipped: 0,
        errors: 0
    }

    const baseDir = path.join(process.cwd(), 'FEU', 'feulhumanite_5339569999440793')
    const startTime = Date.now()

    // 4. Process each image
    for (let i = 0; i < mediaItems.length; i++) {
        const media = mediaItems[i]
        stats.processed++

        // Progress indicator
        const pct = Math.round((i / mediaItems.length) * 100)
        const elapsed = Math.round((Date.now() - startTime) / 1000)
        const eta = i > 0 ? Math.round((elapsed / i) * (mediaItems.length - i)) : 0
        process.stdout.write(`\r📊 Progress: ${pct}% (${i}/${mediaItems.length}) | ETA: ${eta}s | ✓${stats.withText} .${stats.skipped}`)

        const filename = path.basename(media.originalUri)
        const localPath = path.join(baseDir, 'photos', filename)

        if (!fs.existsSync(localPath)) {
            stats.skipped++
            continue
        }

        const result = await processImage(worker, localPath)

        if (!result) {
            await prisma.archiveNote.create({
                data: {
                    archiveId: archive.id,
                    mediaId: media.id,
                    status: 'skipped',
                    processedAt: new Date()
                }
            })
            stats.skipped++
            continue
        }

        const keywords = extractKeywords(result.text)
        const nodeLabel = generateNodeLabel(result.text)
        const nodeWeight = Math.min(1 + Math.log10(result.text.length) / 2, 5)

        await prisma.archiveNote.create({
            data: {
                archiveId: archive.id,
                mediaId: media.id,
                extractedText: result.text,
                keywords,
                language: 'fr',
                confidence: result.confidence,
                nodeLabel,
                nodeWeight,
                status: 'processed',
                processedAt: new Date()
            }
        })

        stats.withText++
    }

    // Cleanup
    await worker.terminate()

    // 5. Summary
    const totalTime = Math.round((Date.now() - startTime) / 1000)
    console.log('\n\n📊 OPERATION ARO COMPLETE')
    console.log('='.repeat(55))
    console.log(`Total images:      ${stats.total}`)
    console.log(`Processed:         ${stats.processed}`)
    console.log(`With text found:   ${stats.withText}`)
    console.log(`Skipped (no text): ${stats.skipped}`)
    console.log(`Errors:            ${stats.errors}`)
    console.log(`Total time:        ${totalTime}s (${(totalTime / stats.processed).toFixed(1)}s/image)`)
    console.log('')
    console.log('💾 Notes saved to database. Ready for graph integration!')
}

// CLI
const args = process.argv.slice(2)
const limit = parseInt(args.find(arg => /^\d+$/.test(arg)) || '1000', 10)
const archiveSlug = args.find(arg => !arg.startsWith('--') && !/^\d+$/.test(arg)) || 'feu-humain'

runOperationARO(archiveSlug, limit)
    .catch(console.error)
    .finally(() => prisma.$disconnect())
