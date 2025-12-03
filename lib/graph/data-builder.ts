import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'

const BILLETS_DIR = path.join(process.cwd(), 'content', 'billets')

export interface GraphNode {
  id: string
  label: string
  type: 'BILLET' | 'AUTHOR' | 'TAG'
  val: number // Size/Importance
  color?: string
}

export interface GraphEdge {
  source: string
  target: string
  type: 'REFERENCES' | 'WROTE' | 'TAGGED'
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphEdge[]
}

export async function buildGraphData(): Promise<GraphData> {
  const nodes = new Map<string, GraphNode>()
  const links: GraphEdge[] = []

  // 1. Read all files
  let files: string[] = []
  try {
    files = (await fs.readdir(BILLETS_DIR)).filter(f => f.endsWith('.mdx'))
  } catch (e) {
    console.error('Error reading billets directory:', e)
    return { nodes: [], links: [] }
  }

  for (const file of files) {
    const slug = file.replace(/\.mdx$/, '')
    const filePath = path.join(BILLETS_DIR, file)
    const raw = await fs.readFile(filePath, 'utf8')
    const { data, content } = matter(raw)

    // Skip sealed or draft if needed (optional, for now we include everything public)
    if (data.sealed) continue

    // --- NODE: BILLET ---
    const billetId = `billet:${slug}`
    if (!nodes.has(billetId)) {
      nodes.set(billetId, {
        id: billetId,
        label: data.title || slug,
        type: 'BILLET',
        val: 5, // Base size
        color: '#3b82f6', // Blue
      })
    }

    // --- NODE: AUTHOR ---
    // Author can be in frontmatter 'author' or 'authors'
    const authors = Array.isArray(data.authors)
      ? data.authors
      : data.author
        ? [data.author]
        : ['Inconnu']

    for (const author of authors) {
      const authorId = `author:${author}`
      if (!nodes.has(authorId)) {
        nodes.set(authorId, {
          id: authorId,
          label: author,
          type: 'AUTHOR',
          val: 10, // Bigger size for authors
          color: '#ef4444', // Red
        })
      }
      // EDGE: WROTE
      links.push({
        source: authorId,
        target: billetId,
        type: 'WROTE',
      })
    }

    // --- NODE: TAGS ---
    const tags = data.tags || []
    for (const tag of tags) {
      const tagId = `tag:${tag}`
      if (!nodes.has(tagId)) {
        nodes.set(tagId, {
          id: tagId,
          label: `#${tag}`,
          type: 'TAG',
          val: 3, // Smaller size
          color: '#10b981', // Green
        })
      }
      // EDGE: TAGGED
      links.push({
        source: billetId,
        target: tagId,
        type: 'TAGGED',
      })
    }

    // --- EDGES: REFERENCES (Wikilinks) ---
    const wikiMatches = [...content.matchAll(/\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g)]
    for (const m of wikiMatches) {
      const targetSlug = m[1].trim()
      const targetId = `billet:${targetSlug}`

      // We add the edge even if the target node doesn't exist yet (it might be created later loop)
      // Ideally we should check existence, but for a robust graph we can filter dangling edges later
      // or just assume they point to valid potential billets.
      // For visualization safety, we will filter links at the end.

      links.push({
        source: billetId,
        target: targetId,
        type: 'REFERENCES',
      })
    }

    // --- EDGES: REFERENCES (Markdown links) ---
    const mdMatches = [...content.matchAll(/\]\(\/billets\/([^)#?\s/]+)\)/g)]
    for (const m of mdMatches) {
      const targetSlug = m[1].trim()
      const targetId = `billet:${targetSlug}`
      links.push({
        source: billetId,
        target: targetId,
        type: 'REFERENCES',
      })
    }
  }

  // Filter dangling links (edges pointing to non-existent nodes)
  // This is important because wikilinks might point to non-existent files
  const validLinks = links.filter(link => {
    // We only check if target exists if it's a BILLET reference
    // WROTE and TAGGED are always valid by construction (we created the nodes above)
    if (link.type === 'REFERENCES') {
      // Check if target exists in our nodes map
      // Note: We need to be careful about the order.
      // Since we iterate all files, by the end of the loop, all valid billets are in `nodes`.
      return nodes.has(link.target)
    }
    return true
  })

  return {
    nodes: Array.from(nodes.values()),
    links: validLinks,
  }
}
