import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const author = formData.get('author') as string
    const category = formData.get('category') as string
    const tagsString = formData.get('tags') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }

    // Parse tags
    let tags: string[] = []
    try {
      tags = JSON.parse(tagsString || '[]')
    } catch {
      tags = []
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}_${originalName}`
    const filePath = path.join(uploadsDir, fileName)
    const relativeFilePath = `/uploads/${fileName}`

    // Write file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Save to database
    const article = await prisma.article.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        author: author?.trim() || null,
        fileName: originalName,
        filePath: relativeFilePath,
        fileSize: file.size,
        tags: tags,
        category: category?.trim() || null,
        isPublished: true,
      },
    })

    return NextResponse.json({ 
      success: true, 
      id: article.id,
      message: 'Article uploaded successfully' 
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload article' },
      { status: 500 }
    )
  }
}