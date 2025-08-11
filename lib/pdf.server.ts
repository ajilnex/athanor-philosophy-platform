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
 * Nettoie et normalise le texte extrait d'un PDF pour l'indexation
 */
export function cleanPdfText(rawText: string): string {
  return rawText
    // Supprime les caractères de contrôle et les lignes vides multiples
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    // Supprime les caractères spéciaux problématiques
    .replace(/[^\w\sàâäéèêëïîôöùûüÿç.,;:!?'"()[\]{}@#$%^&*+=<>|~`-]/gi, ' ')
    // Normalise les espaces multiples
    .replace(/\s{2,}/g, ' ')
    .trim()
}