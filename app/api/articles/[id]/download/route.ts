import { NextRequest, NextResponse } from 'next/server'
import { getPublishedArticleById, getPublishedArticlesSummary } from '@/lib/articles'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  try {
    console.log('📥 Download request for article:', resolvedParams.id)

    const article = await getPublishedArticleById(resolvedParams.id)

    if (!article) {
      console.log('❌ Article not found or not published')
      console.log('🔍 Searching all articles...')

      // Debug: list all articles avec select optimisé
      const allArticles = await getPublishedArticlesSummary()
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
        'Content-Type': 'text/plain',
      },
    })
  } catch (error) {
    console.error('❌ Download error:', error)
    return new NextResponse(
      `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    )
  }
}
