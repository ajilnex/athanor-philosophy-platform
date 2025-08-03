import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import path from 'path'

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

    console.log('📄 Article found:', article.title, 'File:', article.fileName)

    // For now, return a response that indicates the file would be downloaded
    // In production, this would serve the actual PDF file
    const fileName = article.fileName || `${article.title}.pdf`
    
    // Create a simple PDF placeholder response
    const pdfContent = `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 24 Tf
50 700 Td
(${article.title}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
300
%%EOF`

    return new NextResponse(pdfContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('❌ Download error:', error)
    return new NextResponse('Download failed', { status: 500 })
  }
}