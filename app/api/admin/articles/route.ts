import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateAdminAccess, createUnauthorizedResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  // 🛡️ PROTECTION: Vérifier l'autorisation admin
  if (!validateAdminAccess(request)) {
    return createUnauthorizedResponse()
  }

  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(articles)
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
  }
}