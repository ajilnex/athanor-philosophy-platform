import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const article = await prisma.article.findUnique({
      where: { id: params.id },
    })

    if (!article || !article.isPublished) {
      return new NextResponse('Article not found', { status: 404 })
    }

    const filePath = path.join(process.cwd(), 'public', article.filePath)
    
    if (!existsSync(filePath)) {
      return new NextResponse('PDF file not found', { status: 404 })
    }

    const fileBuffer = await readFile(filePath)
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${article.fileName}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    console.error('Error serving PDF:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}