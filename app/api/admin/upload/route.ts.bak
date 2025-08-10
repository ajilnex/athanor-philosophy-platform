import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import cloudinary from '@/lib/cloudinary'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  // 🛡️ PROTECTION: Vérifier l'autorisation admin
  const session = await getServerSession(authOptions)
  
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

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

    // 🛡️ PROTECTION: Limite de taille (50MB max)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      console.log('❌ File too large:', file.size)
      return NextResponse.json({ error: 'File size must be less than 50MB' }, { status: 400 })
    }

    // 🛡️ PROTECTION: Vérifier le nom de fichier
    if (!file.name.match(/^[a-zA-Z0-9._-]+\.pdf$/)) {
      console.log('❌ Invalid filename:', file.name)
      return NextResponse.json({ error: 'Invalid filename. Use only letters, numbers, dots, hyphens and underscores.' }, { status: 400 })
    }

    // Parse tags
    let tags: string[] = []
    try {
      tags = JSON.parse(tagsString || '[]')
    } catch {
      tags = tagsString ? tagsString.split(',').map(t => t.trim()) : []
    }

    console.log('🏷️ Tags parsed:', tags)
    
    // Convert file to buffer for Cloudinary upload
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    console.log('☁️ Uploading to Cloudinary...')
    
    // Upload to Cloudinary with public access
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw', // For PDF files
          folder: 'athanor-articles', // Organize in folder
          public_id: `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
          use_filename: true,
          access_mode: 'public', // Make files publicly accessible
          type: 'upload' // Ensure upload type
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    })

    const cloudinaryResult = uploadResult as any
    console.log('✅ Cloudinary upload successful:', cloudinaryResult.public_id)
    
    // Save to database with Cloudinary URL
    const article = await prisma.article.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        author: author?.trim() || null,
        fileName: file.name,
        filePath: cloudinaryResult.secure_url, // Store Cloudinary URL
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
      message: 'Article uploaded successfully to Cloudinary!',
      article: {
        id: article.id,
        title: article.title,
        fileName: article.fileName,
        fileUrl: cloudinaryResult.secure_url
      }
    })
  } catch (error) {
    console.error('❌ Upload error:', error)
    
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