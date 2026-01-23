import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// GET /api/wall/[id] - Get single post with replies
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const post = await prisma.wallPost.findUnique({
            where: { id, isVisible: true },
            include: {
                author: {
                    select: { id: true, name: true, image: true, role: true },
                },
                reactions: {
                    select: { type: true, userId: true },
                },
                replies: {
                    where: { isVisible: true },
                    orderBy: { createdAt: 'asc' },
                    include: {
                        author: {
                            select: { id: true, name: true, image: true, role: true },
                        },
                        reactions: {
                            select: { type: true, userId: true },
                        },
                    },
                },
            },
        })

        if (!post) {
            return NextResponse.json({ error: 'Post non trouvé' }, { status: 404 })
        }

        return NextResponse.json({
            ...post,
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString(),
            reactions: post.reactions.reduce((acc, r) => {
                acc[r.type] = (acc[r.type] || 0) + 1
                return acc
            }, {} as Record<string, number>),
            replies: post.replies.map(reply => ({
                ...reply,
                createdAt: reply.createdAt.toISOString(),
                updatedAt: reply.updatedAt.toISOString(),
                reactions: reply.reactions.reduce((acc, r) => {
                    acc[r.type] = (acc[r.type] || 0) + 1
                    return acc
                }, {} as Record<string, number>),
            })),
        })
    } catch (error) {
        console.error('Error fetching post:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la récupération du post' },
            { status: 500 }
        )
    }
}

// DELETE /api/wall/[id] - Delete a post (author or admin)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        const { id } = await params
        const userId = (session.user as any).id
        const isAdmin = (session.user as any).role === 'ADMIN'

        const post = await prisma.wallPost.findUnique({
            where: { id },
            select: { authorId: true },
        })

        if (!post) {
            return NextResponse.json({ error: 'Post non trouvé' }, { status: 404 })
        }

        if (post.authorId !== userId && !isAdmin) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
        }

        await prisma.wallPost.delete({ where: { id } })

        revalidatePath('/mur')

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting post:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la suppression' },
            { status: 500 }
        )
    }
}

// PATCH /api/wall/[id] - Update a post (author or admin)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        const { id } = await params
        const userId = (session.user as any).id
        const isAdmin = (session.user as any).role === 'ADMIN'

        const post = await prisma.wallPost.findUnique({
            where: { id },
            select: { authorId: true },
        })

        if (!post) {
            return NextResponse.json({ error: 'Post non trouvé' }, { status: 404 })
        }

        if (post.authorId !== userId && !isAdmin) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
        }

        const body = await request.json()
        const { content, isPinned, isVisible } = body

        const updatedPost = await prisma.wallPost.update({
            where: { id },
            data: {
                ...(content !== undefined && { content: content.trim() }),
                ...(isPinned !== undefined && isAdmin && { isPinned }),
                ...(isVisible !== undefined && isAdmin && { isVisible }),
            },
            include: {
                author: {
                    select: { id: true, name: true, image: true, role: true },
                },
            },
        })

        revalidatePath('/mur')

        return NextResponse.json({
            ...updatedPost,
            createdAt: updatedPost.createdAt.toISOString(),
            updatedAt: updatedPost.updatedAt.toISOString(),
        })
    } catch (error) {
        console.error('Error updating post:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la mise à jour' },
            { status: 500 }
        )
    }
}
