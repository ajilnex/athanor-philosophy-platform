import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseTags } from '@/lib/utils'

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        author: true,
        fileName: true,
        tags: true,
        publishedAt: true,
        fileSize: true,
      },
    })

    // Parse tags from JSON strings
    const articlesWithParsedTags = articles.map(article => ({
      ...article,
      tags: parseTags(article.tags)
    }))

    return NextResponse.json(articlesWithParsedTags)
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}