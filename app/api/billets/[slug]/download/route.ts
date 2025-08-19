import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const safe = slug.replace(/[^a-zA-Z0-9_-]/g, '')
    const filePath = path.join(process.cwd(), 'content', 'billets', `${safe}.mdx`)
    const content = await fs.readFile(filePath, 'utf8')

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${safe}.md"`,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'Billet introuvable' }, { status: 404 })
  }
}
