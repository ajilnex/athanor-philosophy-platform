import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Upload request received')
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const author = formData.get('author') as string
    const category = formData.get('category') as string
    const tagsString = formData.get('tags') as string

    console.log('📋 Form data:', { 
      hasFile: !!file, 
      title, 
      author, 
      category,
      fileSize: file?.size,
      fileType: file?.type 
    })

    if (!file) {
      console.log('❌ No file provided')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!title?.trim()) {
      console.log('❌ No title provided')
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      console.log('❌ File is not PDF:', file.type)
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }

    // Parse tags
    let tags: string[] = []
    try {
      tags = JSON.parse(tagsString || '[]')
    } catch {
      tags = tagsString ? tagsString.split(',').map(t => t.trim()) : []
    }

    console.log('🏷️ Tags parsed:', tags)
    
    // Generate unique filename  
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}_${originalName}`
    
    // For MVP: just store metadata, not actual file
    // Note: File upload would need external storage (S3, Cloudinary, etc.)
    const filePath = `/pdfs/${fileName}`
    
    console.log('💾 Creating article in database...')
    
    // Save to database
    const article = await prisma.article.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        author: author?.trim() || null,
        fileName: originalName,
        filePath: filePath,
        fileSize: file.size,
        tags: tags,
        category: category?.trim() || null,
        isPublished: true,
      },
    })

    console.log('✅ Article created:', article.id)

    return NextResponse.json({ 
      success: true, 
      id: article.id,
      message: 'Article metadata saved successfully! Note: File storage requires external service for production.',
      article: {
        id: article.id,
        title: article.title,
        fileName: article.fileName
      }
    })
  } catch (error) {
    console.error('❌ Upload error:', error)
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    
    return NextResponse.json(
      { 
        error: `Failed to upload article`, 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}