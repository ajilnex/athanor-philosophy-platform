import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/archive/[slug]/feuilleter
 * 
 * Returns OCR notes with pagination.
 * Query params: page (default 1), limit (default 50)
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1', 10)
        const limit = parseInt(searchParams.get('limit') || '50', 10)
        const skip = (page - 1) * limit

        const archive = await prisma.conversationArchive.findUnique({
            where: { slug },
            select: { id: true }
        })

        if (!archive) {
            return NextResponse.json({ error: 'Archive not found' }, { status: 404 })
        }

        // Count total
        const total = await prisma.archiveNote.count({
            where: {
                archiveId: archive.id,
                status: 'processed'
            }
        })

        // Get paginated notes
        const notes = await prisma.archiveNote.findMany({
            where: {
                archiveId: archive.id,
                status: 'processed'
            },
            select: {
                id: true,
                mediaId: true,
                nodeLabel: true,
                extractedText: true,
                confidence: true,
                keywords: true,
                media: {
                    select: {
                        cloudinaryUrl: true,
                        originalUri: true
                    }
                }
            },
            orderBy: { nodeWeight: 'desc' },
            skip,
            take: limit
        })

        // Filter and transform
        const result = notes
            .filter(n => (n.extractedText && n.extractedText.length > 50) || ((n.confidence || 0) >= 90))
            .map(note => ({
                id: note.id,
                mediaId: note.mediaId,
                nodeLabel: note.nodeLabel || 'Sans titre',
                extractedText: note.extractedText,
                confidence: note.confidence,
                keywords: note.keywords || [],
                imageUrl: note.media.cloudinaryUrl || `/FEU/photos/${note.media.originalUri?.split('/').pop()}`
            }))

        return NextResponse.json({
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            notes: result
        })
    } catch (error) {
        console.error('FEUilleter error:', error)
        return NextResponse.json({ error: 'Failed', notes: [] }, { status: 500 })
    }
}
