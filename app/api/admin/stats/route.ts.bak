import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  // 🛡️ PROTECTION: Vérifier l'autorisation admin
  const session = await getServerSession(authOptions)
  
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const [totalArticles, publishedArticles, totalSize] = await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { isPublished: true } }),
      prisma.article.aggregate({
        _sum: { fileSize: true },
      }),
    ])

    return NextResponse.json({
      total: totalArticles,
      published: publishedArticles,
      totalSize: totalSize._sum.fileSize || 0,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}