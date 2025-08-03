import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📥 Download request for article:', params.id)
    
    const article = await prisma.article.findUnique({
      where: { id: params.id },
    })

    if (!article || !article.isPublished) {
      console.log('❌ Article not found or not published')
      return new NextResponse('Article not found', { status: 404 })
    }

    console.log('📄 Article found:', article.title)
    console.log('🔗 File URL:', article.filePath)

    // If filePath is a Cloudinary URL, redirect to it
    if (article.filePath && article.filePath.includes('cloudinary.com')) {
      console.log('☁️ Redirecting to Cloudinary URL')
      return NextResponse.redirect(article.filePath)
    }
    
    // If it's a local path or old format, return error for now
    console.log('❌ File not available - not a Cloudinary URL')
    return new NextResponse('File not available. Please re-upload the article.', { 
      status: 404,
      headers: {
        'Content-Type': 'text/plain'
      }
    })
    
  } catch (error) {
    console.error('❌ Download error:', error)
    return new NextResponse('Download failed', { status: 500 })
  }
}