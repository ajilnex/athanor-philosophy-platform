import path from 'path'
import fs from 'fs/promises'
import matter from 'gray-matter'
import { isFileInTrash } from '@/lib/github.server'

const CONTENT_DIR = path.join(process.cwd(), 'content', 'billets')

export interface Billet {
  slug: string
  title: string
  // ISO datetime string (up to seconds)
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

function dateFrom(front: any, slug: string, mtime?: Date): string {
  // 1) Frontmatter (priorité): publishedAt/published/created/date
  const dateFields = ['publishedAt', 'published', 'created', 'date']
  for (const field of dateFields) {
    const raw = front?.[field]
    if (raw) {
      const parsed = new Date(raw)
      if (!isNaN(parsed.getTime())) {
        // Si frontmatter est date-only (YYYY-MM-DD), compléter avec mtime si dispo
        if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw) && mtime) {
          const y = parsed.getUTCFullYear()
          const mo = parsed.getUTCMonth()
          const d = parsed.getUTCDate()
          return new Date(
            Date.UTC(y, mo, d, mtime.getUTCHours(), mtime.getUTCMinutes(), mtime.getUTCSeconds())
          ).toISOString()
        }
        return parsed.toISOString()
      }
    }
  }

  // 2) Slug avec horodatage (YYYY-MM-DD[-HH-MM[-SS]])
  const m = slug.match(/^(\d{4})-(\d{2})-(\d{2})(?:-(\d{2})-(\d{2})(?:-(\d{2}))?)?/)
  if (m) {
    const [_, yy, mm, dd, hh = '00', mi = '00', ss = '00'] = m
    const dt = new Date(
      Date.UTC(Number(yy), Number(mm) - 1, Number(dd), Number(hh), Number(mi), Number(ss))
    )
    if (!isNaN(dt.getTime())) return dt.toISOString()
  }

  // 3) Fallback: utiliser mtime si dispo, sinon maintenant
  if (mtime && !isNaN(mtime.getTime())) return mtime.toISOString()
  return new Date().toISOString()
}

async function fsAll(): Promise<Billet[]> {
  try {
    const entries = await fs.readdir(CONTENT_DIR)
    const files = entries.filter(f => f.toLowerCase().endsWith('.mdx'))
    const items: Billet[] = []
    for (const file of files) {
      const slug = slugFromFilename(file)
      const fullPath = path.join(CONTENT_DIR, file)
      const [raw, stat] = await Promise.all([
        fs.readFile(fullPath, 'utf8'),
        fs.stat(fullPath).catch(() => null as any),
      ])
      const { data, content } = matter(raw)
      items.push({
        slug,
        title: (data?.title as string) || slug,
        date: dateFrom(data, slug, stat?.mtime),
        tags: Array.isArray(data?.tags) ? (data.tags as string[]) : [],
        content, // brut pour la liste
        excerpt: (data?.excerpt as string) || undefined,
        isMdx: isMdxFile(file),
      })
    }
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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
    const [raw, stat] = await Promise.all([
      fs.readFile(filePath, 'utf8'),
      fs.stat(filePath).catch(() => null as any),
    ])
    const { data, content } = matter(raw)
    const contentWithBacklinks = await transformBacklinks(content)
    return {
      slug,
      title: (data?.title as string) || slug,
      date: dateFrom(data, slug, stat?.mtime),
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
