import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { isPublished } = await request.json()

    const article = await prisma.article.update({
      where: { id: params.id },
      data: { isPublished },
    })

    return NextResponse.json(article)
  } catch (error) {
    console.error('Error updating article:', error)
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get article info first
    const article = await prisma.article.findUnique({
      where: { id: params.id },
    })

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Delete from database
    await prisma.article.delete({
      where: { id: params.id },
    })

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), 'public', article.filePath)
    if (existsSync(filePath)) {
      try {
        await unlink(filePath)
      } catch (error) {
        console.error('Error deleting file:', error)
        // Continue even if file deletion fails
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    )
  }
}