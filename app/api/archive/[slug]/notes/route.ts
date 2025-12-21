import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/archive/[slug]/notes
 * 
 * Returns OCR notes that are worth displaying in the graph:
 * - Only notes with substantial text (likely book photos, screenshots)
 * - Filtered by confidence and text length
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params

        // Get the archive
        const archive = await prisma.conversationArchive.findUnique({
            where: { slug }
        })

        if (!archive) {
            return NextResponse.json({ error: 'Archive not found' }, { status: 404 })
        }

        // Get notes that are worth displaying (limit to 100 for performance)
        const notes = await prisma.archiveNote.findMany({
            where: {
                archiveId: archive.id,
                status: 'processed',
                extractedText: { not: null },
                confidence: { gte: 50 } // Higher threshold for quality
            },
            include: {
                media: {
                    select: {
                        id: true,
                        cloudinaryUrl: true,
                        thumbnailUrl: true,
                        originalUri: true
                    }
                }
            },
            orderBy: { nodeWeight: 'desc' },
            take: 100 // Limit for graph performance
        })

        // Filter in JS for text length
        // We want notes with substantial text content (book pages, screenshots, etc.)
        const filteredNotes = notes.filter(note => {
            if (!note.extractedText) return false

            // Minimum 100 characters to be considered "real" text content
            if (note.extractedText.length < 100) return false

            // Check for word count - at least 15 words suggests real text
            const wordCount = note.extractedText.split(/\s+/).filter(w => w.length > 1).length
            if (wordCount < 15) return false

            // High confidence or very substantial text
            if (note.confidence && note.confidence < 50 && note.extractedText.length < 200) {
                return false
            }

            return true
        })

        // Transform for graph display
        const graphNodes = filteredNotes.map(note => ({
            id: `note:${note.id}`,
            mediaId: note.mediaId,
            label: note.nodeLabel || note.extractedText?.substring(0, 40) + '...',
            type: 'BILLET' as const,
            weight: note.nodeWeight,
            degree: note.nodeWeight,
            keywords: note.keywords,
            confidence: note.confidence,
            textLength: note.extractedText?.length || 0,
            imageUrl: note.media.cloudinaryUrl || `/FEU HUMAIN/photos/${note.media.originalUri?.split('/').pop()}`
        }))

        // Skip edge computation for now (O(n²) is too slow)
        // TODO: Pre-compute edges in database or use keyword index
        const edges: { source: string; target: string; type: string }[] = []

        return NextResponse.json({
            total: notes.length,
            filtered: filteredNotes.length,
            nodes: graphNodes,
            edges
        })
    } catch (error) {
        console.error('Error fetching archive notes:', error)
        return NextResponse.json(
            { error: 'Failed to fetch notes' },
            { status: 500 }
        )
    }
}
