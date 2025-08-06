import { remark } from 'remark'
import html from 'remark-html'
import { prisma } from '@/lib/prisma'

export interface Billet {
  slug: string
  title: string
  date: string
  tags: string[]
  content: string
  excerpt?: string
}

// Transformer les backlinks [[mot]] en liens
async function transformBacklinks(content: string): Promise<string> {
  const allSlugs = await getBilletSlugs()
  
  return content.replace(
    /\[\[([^\]]+)\]\]/g, 
    (match, linkText) => {
      // Essayer de trouver un slug existant qui correspond
      const targetSlug = linkText
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      
      // Chercher un slug qui contient le terme recherché
      const foundSlug = allSlugs.find(slug => 
        slug.includes(targetSlug) || 
        slug.endsWith(targetSlug) ||
        slug.replace(/^\d{4}-\d{2}-\d{2}-/, '') === targetSlug
      )
      
      const href = foundSlug ? `/billets/${foundSlug}` : `/billets/${targetSlug}`
      const missing = !foundSlug
      
      return `<a href="${href}" class="backlink" data-backlink="${linkText}" ${missing ? 'data-missing="true"' : ''}>${linkText}</a>`
    }
  )
}

export async function getAllBillets(): Promise<Billet[]> {
  try {
    const dbBillets = await prisma.billet.findMany({
      orderBy: { date: 'desc' }
    })

    return dbBillets.map(dbBillet => ({
      slug: dbBillet.slug,
      title: dbBillet.title,
      date: dbBillet.date.toISOString().split('T')[0], // Format YYYY-MM-DD
      tags: dbBillet.tags,
      content: dbBillet.content,
      excerpt: dbBillet.excerpt || undefined
    }))
  } catch (error) {
    console.error('Error reading billets from database:', error)
    return []
  }
}

export async function getBilletBySlug(slug: string): Promise<Billet | null> {
  try {
    const dbBillet = await prisma.billet.findUnique({
      where: { slug }
    })

    if (!dbBillet) {
      return null
    }

    // Transformer les backlinks avant le rendu Markdown
    const contentWithBacklinks = await transformBacklinks(dbBillet.content)
    
    // Convertir en HTML
    const processedContent = await remark()
      .use(html, { sanitize: false })
      .process(contentWithBacklinks)

    return {
      slug: dbBillet.slug,
      title: dbBillet.title,
      date: dbBillet.date.toISOString().split('T')[0], // Format YYYY-MM-DD
      tags: dbBillet.tags,
      content: processedContent.toString(),
      excerpt: dbBillet.excerpt || undefined
    }
  } catch (error) {
    console.error(`Error reading billet ${slug} from database:`, error)
    return null
  }
}

export async function getBilletSlugs(): Promise<string[]> {
  try {
    const billets = await prisma.billet.findMany({
      select: { slug: true }
    })
    return billets.map(billet => billet.slug)
  } catch (error) {
    console.error('Error reading billet slugs from database:', error)
    return []
  }
}