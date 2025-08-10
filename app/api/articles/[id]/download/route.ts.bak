import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📥 Download request for article:', params.id)
    
    // Connect to database first
    await prisma.$connect()
    
    const article = await prisma.article.findFirst({
      where: { 
        id: params.id,
        isPublished: true 
      },
    })

    if (!article) {
      console.log('❌ Article not found or not published')
      console.log('🔍 Searching all articles...')
      
      // Debug: list all articles
      const allArticles = await prisma.article.findMany({
        select: { id: true, title: true, isPublished: true }
      })
      console.log('📋 All articles:', allArticles)
      
      return new NextResponse('Article not found', { status: 404 })
    }

    console.log('📄 Article found:', article.title)
    console.log('🔗 File URL:', article.filePath)

    // If filePath is a Cloudinary URL, redirect to it
    if (article.filePath && article.filePath.includes('cloudinary.com')) {
      console.log('☁️ Redirecting to Cloudinary URL')
      return NextResponse.redirect(article.filePath)
    }
    
    // For non-Cloudinary URLs, still try to serve them
    if (article.filePath) {
      console.log('🔗 Redirecting to file URL:', article.filePath)
      return NextResponse.redirect(article.filePath)
    }
    
    // If no file path at all
    console.log('❌ No file path available')
    return new NextResponse('File not available. Please re-upload the article.', { 
      status: 404,
      headers: {
        'Content-Type': 'text/plain'
      }
    })
    
  } catch (error) {
    console.error('❌ Download error:', error)
    return new NextResponse(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}