import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/wall/[id]/react - Add/toggle reaction
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        const { id: postId } = await params
        const userId = (session.user as any).id
        const body = await request.json()
        const { type = 'like' } = body

        // Check if post exists
        const post = await prisma.wallPost.findUnique({
            where: { id: postId, isVisible: true },
            select: { id: true },
        })

        if (!post) {
            return NextResponse.json({ error: 'Post non trouvé' }, { status: 404 })
        }

        // Toggle reaction - if exists, remove it; otherwise, add it
        const existingReaction = await prisma.wallReaction.findUnique({
            where: {
                postId_userId_type: { postId, userId, type },
            },
        })

        if (existingReaction) {
            await prisma.wallReaction.delete({
                where: { id: existingReaction.id },
            })
            return NextResponse.json({ action: 'removed', type })
        } else {
            await prisma.wallReaction.create({
                data: { postId, userId, type },
            })
            return NextResponse.json({ action: 'added', type })
        }
    } catch (error) {
        console.error('Error toggling reaction:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la réaction' },
            { status: 500 }
        )
    }
}
