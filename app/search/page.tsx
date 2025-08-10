import { SearchClient } from '@/components/SearchClient'
import { getAllBillets } from '@/lib/billets'

// Transformer les billets en format compatible avec SearchClient
async function getBilletsForSearch() {
  try {
    const billets = await getAllBillets()
    
    // Mapper les billets vers le format Article attendu par SearchClient
    return billets.map(billet => ({
      id: billet.slug, // Utiliser le slug comme ID
      title: billet.title || 'Sans titre',
      description: billet.excerpt || billet.content.substring(0, 200) + '...',
      author: null, // Les billets n'ont pas d'auteur pour l'instant
      fileName: `${billet.slug}.md`,
      tags: billet.tags || [],
      publishedAt: billet.date || new Date().toISOString().split('T')[0],
      fileSize: billet.content ? billet.content.length : 0, // Approximation basée sur la longueur du contenu
    }))
  } catch (error) {
    console.error('Error fetching billets:', error)
    return []
  }
}

export default async function SearchPage() {
  const articles = await getBilletsForSearch()

  return <SearchClient articles={articles} />
}