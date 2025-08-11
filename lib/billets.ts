import path from 'path'
import fs from 'fs/promises'
import matter from 'gray-matter'
import { prisma } from '@/lib/prisma'

const CONTENT_DIR = path.join(process.cwd(), 'content', 'billets')

export interface Billet {
  slug: string
  title: string
  date: string
  tags: string[]
  content: string
  excerpt?: string
}

function slugFromFilename(file: string) {
  return file.replace(/\.mdx$/i, '')
}

function dateFrom(front: any, slug: string): string {
  const d =
    (front?.date ? new Date(front.date) : null)
    || (/^\d{4}-\d{2}-\d{2}/.test(slug) ? new Date(slug.slice(0,10)) : null)
    || new Date()
  return d.toISOString().split('T')[0]
}

async function fsAll(): Promise<Billet[]> {
  try {
    const entries = await fs.readdir(CONTENT_DIR)
    const files = entries.filter(f => f.toLowerCase().endsWith('.mdx'))
    const items: Billet[] = []
    for (const file of files) {
      const slug = slugFromFilename(file)
      const raw = await fs.readFile(path.join(CONTENT_DIR, file), 'utf8')
      const { data, content } = matter(raw)
      items.push({
        slug,
        title: (data?.title as string) || slug,
        date: dateFrom(data, slug),
        tags: Array.isArray(data?.tags) ? data.tags as string[] : [],
        content, // brut pour la liste
        excerpt: (data?.excerpt as string) || undefined,
      })
    }
    items.sort((a,b) => (a.date < b.date ? 1 : -1))
    return items
  } catch (e) {
    console.error('FS fallback failed:', e)
    return []
  }
}

// Ne traite QUE les backlinks [[...]] en sécurité
async function transformBacklinks(content: string): Promise<string> {
  const allSlugs = await getBilletSlugs()
  return content.replace(/\[\[([^\]]+)\]\]/g, (_m, linkText) => {
    const targetSlug = String(linkText)
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    const found = allSlugs.find(s =>
      s.includes(targetSlug) ||
      s.endsWith(targetSlug) ||
      s.replace(/^\d{4}-\d{2}-\d{2}-/,'') === targetSlug
    )
    const href = `/billets/${found ?? targetSlug}`
    const missing = !found
    return `<a href="${href}" className="backlink" data-backlink="${linkText}" ${missing ? 'data-missing="true"' : ''}>${linkText}</a>`
  })
}

export async function getAllBillets(): Promise<Billet[]> {
  // Billets = 100% statiques, toujours depuis le filesystem
  return fsAll()
}

export async function getBilletBySlug(slug: string) {
  // Billets = 100% statiques, toujours depuis le filesystem
  try {
    const filePath = path.join(CONTENT_DIR, `${slug}.mdx`)
    const raw = await fs.readFile(filePath, 'utf8')
    const { data, content } = matter(raw)
    const contentWithBacklinks = await transformBacklinks(content)
    return {
      slug,
      title: (data?.title as string) || slug,
      date: dateFrom(data, slug),
      tags: Array.isArray(data?.tags) ? data.tags as string[] : [],
      content: contentWithBacklinks,
      excerpt: (data?.excerpt as string) || undefined,
    }
  } catch (e) {
    console.error(`Error reading billet ${slug} from FS:`, e)
    return null
  }
}

export async function getBilletSlugs(): Promise<string[]> {
  try {
    const billets = await prisma.billet.findMany({ select: { slug: true } })
    if (billets.length) return billets.map(b => b.slug)
  } catch {}
  try {
    const entries = await fs.readdir(CONTENT_DIR)
    return entries.filter(f => f.toLowerCase().endsWith('.mdx')).map(slugFromFilename)
  } catch (e) {
    console.error('Error reading billet slugs from FS:', e)
    return []
  }
}
