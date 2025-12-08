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

        // Get notes that are worth displaying:
        // - Status = processed (has text)
        // - Text length > 50 chars (filters out random OCR noise from photos)
        // - Confidence > 40% (reasonable quality)
        const notes = await prisma.archiveNote.findMany({
            where: {
                archiveId: archive.id,
                status: 'processed',
                // Only substantial text content
                extractedText: {
                    not: null
                },
                // Reasonable confidence
                confidence: {
                    gte: 40
                }
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
            orderBy: {
                nodeWeight: 'desc'
            }
        })

        // Filter in JS for text length (Prisma can't easily filter on string length)
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

        // Create edges between notes that share keywords
        const edges: { source: string; target: string; type: string }[] = []

        for (let i = 0; i < graphNodes.length; i++) {
            for (let j = i + 1; j < graphNodes.length; j++) {
                const nodeA = graphNodes[i]
                const nodeB = graphNodes[j]

                // Check for shared keywords
                const sharedKeywords = nodeA.keywords.filter(k => nodeB.keywords.includes(k))

                if (sharedKeywords.length >= 2) {
                    edges.push({
                        source: nodeA.id,
                        target: nodeB.id,
                        type: 'KEYWORD_LINK'
                    })
                }
            }
        }

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
