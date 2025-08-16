/**
 * Utilitaires avancés pour la recherche contextuelle
 * Génération de snippets intelligents avec surlignage sécurisé
 */

/**
 * Échappe les caractères HTML pour éviter les injections XSS
 */
function escapeHtml(text: string): string {
  if (typeof window === 'undefined') {
    // Version serveur - échappement manuel
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
  }

  // Version client - utilise le DOM
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Convertit le markdown basique en texte plain avec nettoyage
 */
function toPlainText(markdown: string): string {
  return (
    markdown
      // Supprime les titres markdown (### Titre)
      .replace(/^#{1,6}\s+(.+)$/gm, '$1')
      // Supprime le gras/italique (**bold**, *italic*)
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      // Supprime les liens [texte](url)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Supprime les blocs de code ```
      .replace(/```[\s\S]*?```/g, '')
      // Supprime le code inline `code`
      .replace(/`([^`]+)`/g, '$1')
      // Supprime les citations >
      .replace(/^>\s+(.+)$/gm, '$1')
      // Normalise les espaces multiples
      .replace(/\s+/g, ' ')
      .trim()
  )
}

/**
 * Parse une requête de recherche en mots individuels avec support des opérateurs
 */
function parseQuery(query: string): {
  required: string[]
  optional: string[]
  phrases: string[]
} {
  const required: string[] = []
  const optional: string[] = []
  const phrases: string[] = []

  // Trouve les phrases entre guillemets
  const phraseMatches = query.match(/"([^"]+)"/g)
  if (phraseMatches) {
    phraseMatches.forEach(phrase => {
      phrases.push(phrase.slice(1, -1)) // Supprime les guillemets
    })
  }

  // Supprime les phrases de la requête pour traiter le reste
  let remainingQuery = query.replace(/"[^"]+"/g, '')

  // Trouve les mots requis (+mot)
  const requiredMatches = remainingQuery.match(/\+\w+/g)
  if (requiredMatches) {
    requiredMatches.forEach(word => {
      required.push(word.slice(1)) // Supprime le +
    })
  }

  // Supprime les mots requis et divise le reste en mots optionnels
  remainingQuery = remainingQuery.replace(/\+\w+/g, '')
  const words = remainingQuery.split(/\s+/).filter(word => word.trim().length > 0)
  optional.push(...words)

  return { required, optional, phrases }
}

/**
 * Génère un snippet contextuel intelligent avec surlignage sécurisé
 */
export function makeSnippet(content: string, query: string, maxLength: number = 300): string {
  if (!content || !query.trim()) {
    return escapeHtml(content.substring(0, maxLength) + '...')
  }

  // Nettoie le contenu markdown
  const plainText = toPlainText(content)
  const { required, optional, phrases } = parseQuery(query.trim())

  // Combine tous les termes à rechercher
  const allTerms = [...required, ...optional, ...phrases]

  if (allTerms.length === 0) {
    return escapeHtml(plainText.substring(0, maxLength) + '...')
  }

  // Normalise le texte pour la recherche (insensible aux accents et casse)
  const normalizedText = plainText
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents

  // Trouve la première occurrence de n'importe quel terme
  let bestMatch = -1
  let bestTerm = ''

  for (const term of allTerms) {
    const normalizedTerm = term
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    const index = normalizedText.indexOf(normalizedTerm)
    if (index !== -1 && (bestMatch === -1 || index < bestMatch)) {
      bestMatch = index
      bestTerm = term
    }
  }

  // Si aucun terme trouvé, retourne le début du texte
  if (bestMatch === -1) {
    return escapeHtml(plainText.substring(0, maxLength) + '...')
  }

  // Calcule la fenêtre contextuelle
  const contextPadding = Math.floor((maxLength - bestTerm.length) / 2)
  const start = Math.max(0, bestMatch - contextPadding)
  const end = Math.min(plainText.length, bestMatch + bestTerm.length + contextPadding)

  // Extrait le snippet
  let snippet = plainText.substring(start, end)

  // Ajoute des ellipses si tronqué
  if (start > 0) snippet = '...' + snippet
  if (end < plainText.length) snippet = snippet + '...'

  // Échappe le HTML d'abord
  snippet = escapeHtml(snippet)

  // Puis surligne tous les termes de recherche
  for (const term of allTerms) {
    if (!term.trim()) continue

    // Échappe le terme pour la regex
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escapedTerm})`, 'gi')
    snippet = snippet.replace(regex, '<strong>$1</strong>')
  }

  return snippet
}
