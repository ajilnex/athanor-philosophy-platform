import path from 'path'
import fs from 'fs/promises'
import matter from 'gray-matter'
import { isFileInTrash } from '@/lib/github.server'

const CONTENT_DIR = path.join(process.cwd(), 'content', 'billets')

export interface Billet {
  slug: string
  title: string
  date: string
  tags: string[]
  content: string
  excerpt?: string
  isMdx: boolean // Indique si le fichier est .mdx ou .md
}

function slugFromFilename(file: string) {
  return file.replace(/\.mdx$/i, '')
}

function isMdxFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.mdx')
}

function dateFrom(front: any, slug: string): string {
  // Priorité : date de première publication (published, created, puis date)
  const dateFields = ['published', 'created', 'date']
  for (const field of dateFields) {
    if (front?.[field]) {
      const frontDate = new Date(front[field])
      if (!isNaN(frontDate.getTime())) {
        return frontDate.toISOString().split('T')[0]
      }
    }
  }

  // Ensuite le slug (format YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}/.test(slug)) {
    const slugDate = new Date(slug.slice(0, 10))
    if (!isNaN(slugDate.getTime())) {
      return slugDate.toISOString().split('T')[0]
    }
  }

  // Fallback : aujourd'hui
  return new Date().toISOString().split('T')[0]
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
        tags: Array.isArray(data?.tags) ? (data.tags as string[]) : [],
        content, // brut pour la liste
        excerpt: (data?.excerpt as string) || undefined,
        isMdx: isMdxFile(file),
      })
    }
    items.sort((a, b) => (a.date < b.date ? 1 : -1))
    return items
  } catch (e) {
    console.error('FS fallback failed:', e)
    return []
  }
}

// Fonction utilitaire pour vérifier si un billet est dans trash
export async function isBilletInTrash(slug: string): Promise<boolean> {
  try {
    const trashDir = path.join(process.cwd(), 'content', 'trash')
    const trashPath = path.join(trashDir, `${slug}.mdx`)
    await fs.access(trashPath)
    return true
  } catch {
    return false
  }
}

// Ne traite QUE les backlinks [[...]] en sécurité avec support alias [[slug|alias]]
async function transformBacklinks(content: string): Promise<string> {
  const allSlugs = await getBilletSlugs()
  return content.replace(/\[\[([^|]+)(?:\|([^\]]+))?\]\]/g, (_m, slug, alias) => {
    // slug = partie avant |, alias = partie après | (optionnel)
    const targetSlug = String(slug)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const found = allSlugs.find(
      s =>
        s.includes(targetSlug) ||
        s.endsWith(targetSlug) ||
        s.replace(/^\d{4}-\d{2}-\d{2}-/, '') === targetSlug
    )

    const href = `/billets/${found ?? targetSlug}`
    const missing = !found
    const displayText = alias || slug // Utilise l'alias si présent, sinon le slug

    return `<a href="${href}" className="backlink" data-backlink="${slug}" ${missing ? 'data-missing="true"' : ''}>${displayText}</a>`
  })
}

export async function getAllBillets(): Promise<Billet[]> {
  // Billets = 100% statiques, toujours depuis le filesystem
  // Note: La vérification du trash se fait uniquement au niveau des pages individuelles
  // pour éviter trop d'appels API GitHub lors du listage
  return fsAll()
}

export async function getBilletBySlug(slug: string) {
  // Billets = 100% statiques, toujours depuis le filesystem (uniquement .mdx)
  try {
    const filePath = path.join(CONTENT_DIR, `${slug}.mdx`)
    const raw = await fs.readFile(filePath, 'utf8')
    const { data, content } = matter(raw)
    const contentWithBacklinks = await transformBacklinks(content)
    return {
      slug,
      title: (data?.title as string) || slug,
      date: dateFrom(data, slug),
      tags: Array.isArray(data?.tags) ? (data.tags as string[]) : [],
      content: contentWithBacklinks,
      excerpt: (data?.excerpt as string) || undefined,
      isMdx: true,
    }
  } catch (e) {
    console.error(`Error: No billet found for slug ${slug}.mdx`)
    return null
  }
}

export async function getBilletSlugs(): Promise<string[]> {
  // Billets = 100% statiques, toujours depuis le filesystem
  // Note: La vérification du trash se fait uniquement au niveau des pages individuelles
  try {
    const entries = await fs.readdir(CONTENT_DIR)
    return entries.filter(f => f.toLowerCase().endsWith('.mdx')).map(slugFromFilename)
  } catch (e) {
    console.error('Error reading billet slugs from FS:', e)
    return []
  }
}
