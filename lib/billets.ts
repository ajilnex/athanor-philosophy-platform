import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

const billetsDirectory = path.join(process.cwd(), 'content/billets')

export interface Billet {
  slug: string
  title: string
  date: string
  tags: string[]
  content: string
  excerpt?: string
}

// Transformer les backlinks [[mot]] en liens
function transformBacklinks(content: string): string {
  return content.replace(
    /\[\[([^\]]+)\]\]/g, 
    (match, linkText) => {
      const slug = linkText
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      
      return `<a href="/billets/${slug}" class="backlink" data-backlink="${linkText}">${linkText}</a>`
    }
  )
}

export async function getAllBillets(): Promise<Billet[]> {
  try {
    const fileNames = fs.readdirSync(billetsDirectory)
    const billets = await Promise.all(
      fileNames
        .filter(name => name.endsWith('.md'))
        .map(async (fileName) => {
          const slug = fileName.replace(/\.md$/, '')
          return await getBilletBySlug(slug)
        })
    )

    return billets
      .filter(Boolean)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error('Error reading billets:', error)
    return []
  }
}

export async function getBilletBySlug(slug: string): Promise<Billet | null> {
  try {
    const fullPath = path.join(billetsDirectory, `${slug}.md`)
    
    if (!fs.existsSync(fullPath)) {
      return null
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)

    // Transformer les backlinks avant le rendu Markdown
    const contentWithBacklinks = transformBacklinks(content)
    
    // Convertir en HTML
    const processedContent = await remark()
      .use(html, { sanitize: false })
      .process(contentWithBacklinks)

    // Générer un extrait
    const plainText = content.replace(/[#*`\[\]]/g, '').substring(0, 200)
    const excerpt = plainText.length === 200 ? plainText + '...' : plainText

    return {
      slug,
      title: data.title || slug,
      date: data.date || '',
      tags: data.tags || [],
      content: processedContent.toString(),
      excerpt
    }
  } catch (error) {
    console.error(`Error reading billet ${slug}:`, error)
    return null
  }
}

export function getBilletSlugs(): string[] {
  try {
    const fileNames = fs.readdirSync(billetsDirectory)
    return fileNames
      .filter(name => name.endsWith('.md'))
      .map(name => name.replace(/\.md$/, ''))
  } catch (error) {
    console.error('Error reading billet slugs:', error)
    return []
  }
}