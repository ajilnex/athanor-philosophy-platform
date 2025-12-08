/**
 * Operation ARO - Archive OCRisation
 * 
 * Processes all photos in the FEU HUMAIN archive using Google Vision API
 * to extract text content and create searchable notes for the graph.
 * 
 * Usage: npx dotenv-cli -e .env.local -- npx tsx scripts/operation-aro.ts
 */

import { PrismaClient } from '@prisma/client'
import { ImageAnnotatorClient } from '@google-cloud/vision'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// Google Vision client - uses GOOGLE_APPLICATION_CREDENTIALS env var
let visionClient: ImageAnnotatorClient | null = null

async function initVisionClient(): Promise<ImageAnnotatorClient> {
    if (!visionClient) {
        // Check for credentials
        const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
        if (!credentialsPath || !fs.existsSync(credentialsPath)) {
            throw new Error(
                'GOOGLE_APPLICATION_CREDENTIALS not set or file not found.\n' +
                'Download service account JSON from Google Cloud Console and set the env var.'
            )
        }
        visionClient = new ImageAnnotatorClient()
    }
    return visionClient
}

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
    // Remove common French words and extract meaningful terms
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

    // Count word frequency
    const wordCount = new Map<string, number>()
    words.forEach(word => {
        wordCount.set(word, (wordCount.get(word) || 0) + 1)
    })

    // Return top keywords by frequency
    return Array.from(wordCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word)
}

/**
 * Generate a short label for the graph node
 */
function generateNodeLabel(text: string): string {
    // Take first meaningful line or first N characters
    const lines = text.trim().split('\n').filter(l => l.trim().length > 2)
    if (lines.length > 0) {
        const firstLine = lines[0].trim()
        if (firstLine.length <= 40) return firstLine
        return firstLine.substring(0, 37) + '...'
    }
    return text.substring(0, 40).trim() + '...'
}

/**
 * Process a single image with Google Vision OCR
 */
async function processImage(
    client: ImageAnnotatorClient,
    imagePath: string
): Promise<{ text: string; confidence: number; language: string } | null> {
    try {
        const imageBuffer = fs.readFileSync(imagePath)
        const [result] = await client.textDetection(imageBuffer)

        const fullTextAnnotation = result.fullTextAnnotation
        if (!fullTextAnnotation || !fullTextAnnotation.text) {
            return null
        }

        const text = fullTextAnnotation.text.trim()
        if (text.length < 10) {
            return null // Too short to be meaningful
        }

        // Extract confidence (average of page confidences)
        let confidence = 80 // Default
        if (fullTextAnnotation.pages && fullTextAnnotation.pages.length > 0) {
            const pageConfidences = fullTextAnnotation.pages
                .map(p => p.confidence || 0.8)
                .filter(c => c > 0)
            if (pageConfidences.length > 0) {
                confidence = (pageConfidences.reduce((a, b) => a + b, 0) / pageConfidences.length) * 100
            }
        }

        // Detect language
        let language = 'fr'
        if (result.textAnnotations && result.textAnnotations[0]?.locale) {
            language = result.textAnnotations[0].locale
        }

        return { text, confidence, language }
    } catch (error) {
        console.error(`Error processing ${imagePath}:`, error)
        return null
    }
}

/**
 * Main ARO processing function
 */
async function runOperationARO(archiveSlug: string, dryRun = false) {
    console.log('\n🔥 OPERATION ARO - Archive OCRisation')
    console.log('='.repeat(50))
    console.log(`Archive: ${archiveSlug}`)
    console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
    console.log('')

    // 1. Get the archive
    const archive = await prisma.conversationArchive.findUnique({
        where: { slug: archiveSlug }
    })

    if (!archive) {
        throw new Error(`Archive not found: ${archiveSlug}`)
    }

    console.log(`📁 Found archive: ${archive.title}`)

    // 2. Get all photos that haven't been processed yet
    const mediaItems = await prisma.conversationMedia.findMany({
        where: {
            message: { archiveId: archive.id },
            type: 'photo',
            note: null // Not yet processed
        },
        include: {
            message: true
        },
        orderBy: {
            createdAt: 'asc'
        }
    })

    console.log(`📷 Found ${mediaItems.length} unprocessed photos`)

    if (mediaItems.length === 0) {
        console.log('✅ All photos already processed!')
        return
    }

    // 3. Initialize Google Vision
    const visionClient = await initVisionClient()
    console.log('🔗 Google Vision API connected')

    const stats: ProcessingStats = {
        total: mediaItems.length,
        processed: 0,
        withText: 0,
        skipped: 0,
        errors: 0
    }

    // 4. Process each image
    const batchSize = 10
    const baseDir = path.join(process.cwd(), 'FEU', 'feulhumanite_5339569999440793')

    for (let i = 0; i < mediaItems.length; i += batchSize) {
        const batch = mediaItems.slice(i, i + batchSize)

        console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(mediaItems.length / batchSize)}`)

        for (const media of batch) {
            stats.processed++

            // Resolve local path from originalUri
            const relativePath = media.originalUri.replace(/^photos\//, '')
            const localPath = path.join(baseDir, 'photos', relativePath)

            if (!fs.existsSync(localPath)) {
                console.log(`  ⚠️ File not found: ${relativePath}`)
                stats.skipped++
                continue
            }

            // Process with Vision API
            const result = await processImage(visionClient, localPath)

            if (!result) {
                // No text found - create a skipped note
                if (!dryRun) {
                    await prisma.archiveNote.create({
                        data: {
                            archiveId: archive.id,
                            mediaId: media.id,
                            status: 'skipped',
                            processedAt: new Date()
                        }
                    })
                }
                stats.skipped++
                process.stdout.write('.')
                continue
            }

            // Create the note
            const keywords = extractKeywords(result.text)
            const nodeLabel = generateNodeLabel(result.text)
            const nodeWeight = Math.min(1 + Math.log10(result.text.length) / 2, 5)

            if (!dryRun) {
                await prisma.archiveNote.create({
                    data: {
                        archiveId: archive.id,
                        mediaId: media.id,
                        extractedText: result.text,
                        keywords,
                        language: result.language,
                        confidence: result.confidence,
                        nodeLabel,
                        nodeWeight,
                        status: 'processed',
                        processedAt: new Date()
                    }
                })
            }

            stats.withText++
            process.stdout.write('✓')
        }

        // Rate limiting - Google Vision has quotas
        await new Promise(resolve => setTimeout(resolve, 500))
    }

    // 5. Summary
    console.log('\n\n📊 OPERATION ARO COMPLETE')
    console.log('='.repeat(50))
    console.log(`Total images:     ${stats.total}`)
    console.log(`Processed:        ${stats.processed}`)
    console.log(`With text:        ${stats.withText}`)
    console.log(`Skipped (no text): ${stats.skipped}`)
    console.log(`Errors:           ${stats.errors}`)
    console.log('')

    if (!dryRun) {
        console.log('💾 Notes saved to database. Ready for graph integration!')
    } else {
        console.log('🔍 Dry run complete. Run without --dry-run to save results.')
    }
}

// CLI
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const archiveSlug = args.find(arg => !arg.startsWith('--')) || 'feu-humain'

runOperationARO(archiveSlug, dryRun)
    .catch(console.error)
    .finally(() => prisma.$disconnect())
