/**
 * Utilitaires pour la gestion de la bibliographie
 */

export interface BibliographyEntry {
  key: string
  type: string
  title: string
  authors: {
    family: string
    given: string
  }[]
  year: string
  container: string
  DOI: string
  URL: string
  ISBN: string
  tags: string[]
  volume?: string
  issue?: string
  pages?: string
  publisher?: string
  place?: string
}

/**
 * Charge la bibliographie depuis le fichier statique
 */
export async function loadBibliography(): Promise<BibliographyEntry[]> {
  try {
    const response = await fetch('/bibliography.json')
    if (!response.ok) {
      console.warn('Bibliographie non disponible')
      return []
    }
    return await response.json()
  } catch (error) {
    console.error('Erreur lors du chargement de la bibliographie:', error)
    return []
  }
}

/**
 * Trouve une entrée par sa clé
 */
export function findEntry(
  bibliography: BibliographyEntry[],
  key: string
): BibliographyEntry | null {
  return bibliography.find(entry => entry.key === key) || null
}

/**
 * Formate une entrée en citation courte (Auteur, année)
 */
export function formatShortCitation(entry: BibliographyEntry): string {
  const author = entry.authors[0] ? entry.authors[0].family : 'Auteur inconnu'

  return `${author}, ${entry.year || 's.d.'}`
}

/**
 * Formate une entrée en citation complète
 */
export function formatFullCitation(entry: BibliographyEntry): string {
  const authors =
    entry.authors.length > 0
      ? entry.authors.map(author => `${author.family}, ${author.given}`).join(', ')
      : 'Auteur inconnu'

  let citation = `${authors}. ${entry.title}.`

  if (entry.container) {
    citation += ` ${entry.container}`

    if (entry.volume) citation += `, vol. ${entry.volume}`
    if (entry.issue) citation += `, no ${entry.issue}`
    if (entry.pages) citation += `, p. ${entry.pages}`
  }

  if (entry.publisher) {
    citation += ` ${entry.publisher}`
  }

  if (entry.year) {
    citation += `, ${entry.year}`
  }

  citation += '.'

  return citation
}
