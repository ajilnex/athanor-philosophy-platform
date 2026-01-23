import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// GET /api/wall - Get wall posts (paginated)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const cursor = searchParams.get('cursor')
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
        const parentId = searchParams.get('parentId') // For replies

        const posts = await prisma.wallPost.findMany({
            where: {
                isVisible: true,
                parentId: parentId || null, // Top-level posts if no parentId
            },
            take: limit + 1, // Fetch one extra to check hasMore
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: [
                { isPinned: 'desc' },
                { createdAt: 'desc' },
            ],
            include: {
                author: {
                    select: { id: true, name: true, image: true, role: true },
                },
                reactions: {
                    select: { type: true, userId: true },
                },
                _count: {
                    select: { replies: true },
                },
            },
        })

        const hasMore = posts.length > limit
        const items = hasMore ? posts.slice(0, -1) : posts
        const nextCursor = hasMore ? items[items.length - 1]?.id : null

        // Transform posts for client
        const transformedPosts = items.map(post => ({
            id: post.id,
            content: post.content,
            imageUrl: post.imageUrl,
            linkUrl: post.linkUrl,
            linkPreview: post.linkPreview,
            author: post.author,
            isPinned: post.isPinned,
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString(),
            replyCount: post._count.replies,
            reactions: post.reactions.reduce((acc, r) => {
                acc[r.type] = (acc[r.type] || 0) + 1
                return acc
            }, {} as Record<string, number>),
            userReactions: post.reactions.map(r => ({ type: r.type, userId: r.userId })),
        }))

        return NextResponse.json({
            posts: transformedPosts,
            nextCursor,
            hasMore,
        })
    } catch (error) {
        console.error('Error fetching wall posts:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des posts' },
            { status: 500 }
        )
    }
}

// POST /api/wall - Create a new post
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        // Only ADMIN can post (for now)
        if ((session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Seuls les admins peuvent poster' }, { status: 403 })
        }

        const body = await request.json()
        const { content, imageUrl, linkUrl, linkPreview, parentId } = body

        if (!content?.trim()) {
            return NextResponse.json({ error: 'Le contenu est requis' }, { status: 400 })
        }

        const post = await prisma.wallPost.create({
            data: {
                content: content.trim(),
                imageUrl,
                linkUrl,
                linkPreview,
                parentId,
                authorId: (session.user as any).id,
            },
            include: {
                author: {
                    select: { id: true, name: true, image: true, role: true },
                },
                reactions: true,
                _count: {
                    select: { replies: true },
                },
            },
        })

        revalidatePath('/mur')

        return NextResponse.json({
            id: post.id,
            content: post.content,
            imageUrl: post.imageUrl,
            linkUrl: post.linkUrl,
            linkPreview: post.linkPreview,
            author: post.author,
            isPinned: post.isPinned,
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString(),
            replyCount: 0,
            reactions: {},
            userReactions: [],
        })
    } catch (error) {
        console.error('Error creating wall post:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la création du post' },
            { status: 500 }
        )
    }
}
