import path from 'path'
import fs from 'fs/promises'
import matter from 'gray-matter'

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
  return file.replace(/\.(mdx|md)$/i, '')
}

function isMdxFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.mdx')
}

function dateFrom(front: any, slug: string): string {
  // Essayez le frontmatter en premier (date, created)
  const dateFields = ['date', 'created']
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
    const slugDate = new Date(slug.slice(0,10))
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
    const files = entries.filter(f => f.toLowerCase().endsWith('.mdx') || f.toLowerCase().endsWith('.md'))
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
        isMdx: isMdxFile(file),
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
  // Essaye .mdx en premier, puis .md en fallback
  const extensions = ['.mdx', '.md']
  
  for (const ext of extensions) {
    try {
      const filePath = path.join(CONTENT_DIR, `${slug}${ext}`)
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
        isMdx: ext === '.mdx',
      }
    } catch (e) {
      // Continue vers l'extension suivante
      continue
    }
  }
  
  console.error(`Error: No billet found for slug ${slug} (.mdx or .md)`)
  return null
}

export async function getBilletSlugs(): Promise<string[]> {
  // Billets = 100% statiques, toujours depuis le filesystem
  try {
    const entries = await fs.readdir(CONTENT_DIR)
    return entries.filter(f => f.toLowerCase().endsWith('.mdx') || f.toLowerCase().endsWith('.md')).map(slugFromFilename)
  } catch (e) {
    console.error('Error reading billet slugs from FS:', e)
    return []
  }
}
