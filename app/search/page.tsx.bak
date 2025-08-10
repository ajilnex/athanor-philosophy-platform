import { SearchClient } from '@/components/SearchClient'
import { prisma } from '@/lib/prisma'

async function getPublishedArticles() {
  try {
    return await prisma.article.findMany({
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
  } catch (error) {
    console.error('Error fetching articles:', error)
    return []
  }
}

export default async function SearchPage() {
  const articles = await getPublishedArticles()

  return <SearchClient articles={articles} />
}