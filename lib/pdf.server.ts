import pdf from 'pdf-parse'
import { validatePdfUrl, PDF_SECURITY_LIMITS } from '@/lib/security/pdf-url-validator'

// Helper function for secure fetching to avoid code duplication
async function secureFetch(url: string): Promise<Buffer> {
  const validation = validatePdfUrl(url)
  if (!validation.isValid) {
    console.error(`[SECURITY] PDF URL validation failed for ${url}: ${validation.error}`)
    throw new Error('Invalid or disallowed PDF URL')
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), PDF_SECURITY_LIMITS.DOWNLOAD_TIMEOUT)

    const response = await fetch(url, {
      signal: controller.signal,
      // @ts-ignore - `follow` is a Node.js-specific extension to limit redirects
      follow: PDF_SECURITY_LIMITS.MAX_REDIRECTS,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF with status: ${response.statusText}`)
    }

    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > PDF_SECURITY_LIMITS.MAX_FILE_SIZE) {
      throw new Error(
        `PDF file size exceeds the limit of ${PDF_SECURITY_LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB`
      )
    }

    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/pdf')) {
      throw new Error('Response is not a PDF file based on Content-Type header')
    }

    const chunks: Uint8Array[] = []
    let totalSize = 0
    const reader = response.body?.getReader()
    if (!reader) throw new Error('Cannot read response body')

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      totalSize += value.length
      if (totalSize > PDF_SECURITY_LIMITS.MAX_FILE_SIZE) {
        reader.cancel()
        throw new Error(`PDF file exceeds maximum size during download`)
      }
      chunks.push(value)
    }

    return Buffer.concat(chunks)
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`[SECURITY] PDF download timeout for ${url}`)
      throw new Error('PDF download timed out')
    }
    console.error(`Error during secure fetch for ${url}:`, error)
    throw error
  }
}

/**
 * Extrait le contenu textuel d'un fichier PDF à partir de son URL.
 * @param pdfUrl L'URL publique du fichier PDF (ex: sur Cloudinary).
 * @returns Le contenu textuel brut du PDF.
 */
export async function extractTextFromPdfUrl(pdfUrl: string): Promise<string> {
  try {
    const buffer = await secureFetch(pdfUrl)
    const data = await pdf(buffer)
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
    const buffer = await secureFetch(pdfUrl)
    const data = await pdf(buffer)

    // HEURISTIQUE: Divise le texte en pages basé sur les marqueurs typiques
    // Ceci est une approximation car pdf-parse ne donne pas accès au contenu par page
    const fullText = data.text
    const numPages = data.numpages

    // Stratégie simple: diviser le texte par taille approximative
    const textLength = fullText.length
    const averagePageLength = numPages > 0 ? Math.ceil(textLength / numPages) : textLength

    const pages: PdfPage[] = []
    if (numPages > 0) {
      for (let i = 0; i < numPages; i++) {
        const startIndex = i * averagePageLength
        const endIndex = Math.min((i + 1) * averagePageLength, textLength)
        const pageText = fullText.slice(startIndex, endIndex)

        pages.push({
          pageNumber: i + 1,
          text: cleanPdfText(pageText),
        })
      }
    } else {
      pages.push({ pageNumber: 1, text: cleanPdfText(fullText) })
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
      .replace(/[^\w\sàâäéèêëïîôöùûüÿç.,;:!?'"()[\\\]{}@#$%^&*+=<>|~`-]/gi, ' ')
      // Normalise les espaces multiples
      .replace(/\s{2,}/g, ' ')
      .trim()
  )
}
