import pdf from 'pdf-parse'

/**
 * Extrait le contenu textuel d'un fichier PDF à partir de son URL.
 * @param pdfUrl L'URL publique du fichier PDF (ex: sur Cloudinary).
 * @returns Le contenu textuel brut du PDF.
 */
export async function extractTextFromPdfUrl(pdfUrl: string): Promise<string> {
  try {
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`)
    }
    const buffer = await response.arrayBuffer()
    const data = await pdf(Buffer.from(buffer))
    return data.text
  } catch (error) {
    console.error(`Error processing PDF from URL ${pdfUrl}:`, error)
    return '' // Retourne une chaîne vide en cas d'erreur
  }
}

/**
 * Extrait le contenu textuel d'un fichier PDF à partir d'un buffer.
 * @param buffer Le buffer du fichier PDF.
 * @returns Le contenu textuel brut du PDF.
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer)
    return data.text
  } catch (error) {
    console.error('Error processing PDF from buffer:', error)
    return '' // Retourne une chaîne vide en cas d'erreur
  }
}

/**
 * Structure pour un élément indexable dans la recherche unifiée
 */
export interface SearchIndexItem {
  id: string
  type: 'billet' | 'publication'
  title: string
  content: string
  date: string
  url: string
  excerpt?: string
  tags?: string[]
}

/**
 * Structure pour une page de PDF avec son contenu textuel
 */
export interface PdfPage {
  pageNumber: number
  text: string
}

/**
 * Extrait le texte par page d'un PDF (approximation basée sur pdf-parse)
 * Note: pdf-parse ne fournit pas l'extraction par page native, nous utilisons une heuristique
 */
export async function extractPagesFromPdfUrl(pdfUrl: string): Promise<PdfPage[]> {
  try {
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`)
    }
    const buffer = await response.arrayBuffer()
    const data = await pdf(Buffer.from(buffer))

    // HEURISTIQUE: Divise le texte en pages basé sur les marqueurs typiques
    // Ceci est une approximation car pdf-parse ne donne pas accès au contenu par page
    const fullText = data.text
    const numPages = data.numpages

    // Stratégie simple: diviser le texte par taille approximative
    const textLength = fullText.length
    const averagePageLength = Math.ceil(textLength / numPages)

    const pages: PdfPage[] = []
    for (let i = 0; i < numPages; i++) {
      const startIndex = i * averagePageLength
      const endIndex = Math.min((i + 1) * averagePageLength, textLength)
      const pageText = fullText.slice(startIndex, endIndex)

      pages.push({
        pageNumber: i + 1,
        text: cleanPdfText(pageText),
      })
    }

    return pages
  } catch (error) {
    console.error(`Error extracting pages from PDF ${pdfUrl}:`, error)
    return []
  }
}

/**
 * Trouve la première occurrence d'un terme dans un PDF et retourne la page + contexte
 */
export async function findInPdf(
  pdfUrl: string,
  searchQuery: string
): Promise<{
  found: boolean
  pageNumber?: number
  snippet?: string
  context?: string
} | null> {
  try {
    const pages = await extractPagesFromPdfUrl(pdfUrl)
    const query = searchQuery.toLowerCase()

    for (const page of pages) {
      const pageTextLower = page.text.toLowerCase()
      const index = pageTextLower.indexOf(query)

      if (index !== -1) {
        // Extrait un contexte de 200 caractères autour du terme trouvé
        const contextStart = Math.max(0, index - 100)
        const contextEnd = Math.min(page.text.length, index + query.length + 100)
        const context = page.text.slice(contextStart, contextEnd)

        // Crée un snippet plus court pour l'affichage
        const snippetStart = Math.max(0, index - 50)
        const snippetEnd = Math.min(page.text.length, index + query.length + 50)
        const snippet = page.text.slice(snippetStart, snippetEnd)

        return {
          found: true,
          pageNumber: page.pageNumber,
          snippet: snippet.trim(),
          context: context.trim(),
        }
      }
    }

    return { found: false }
  } catch (error) {
    console.error(`Error searching in PDF ${pdfUrl}:`, error)
    return null
  }
}

/**
 * Nettoie et normalise le texte extrait d'un PDF pour l'indexation
 */
export function cleanPdfText(rawText: string): string {
  return (
    rawText
      // Supprime les caractères de contrôle et les lignes vides multiples
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      // Supprime les caractères spéciaux problématiques
      .replace(/[^\w\sàâäéèêëïîôöùûüÿç.,;:!?'"()[\]{}@#$%^&*+=<>|~`-]/gi, ' ')
      // Normalise les espaces multiples
      .replace(/\s{2,}/g, ' ')
      .trim()
  )
}
