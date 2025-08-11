#!/usr/bin/env tsx

/**
 * Script utilitaire pour extraire le texte d'un PDF via son URL
 * Usage: node scripts/extract-pdf-text.ts <pdf-url>
 * Retourne le texte nettoyé sur stdout
 */

import { extractTextFromPdfUrl, cleanPdfText } from '../lib/pdf.server'

async function main() {
  const pdfUrl = process.argv[2]
  
  if (!pdfUrl) {
    console.error('Usage: node extract-pdf-text.ts <pdf-url>')
    process.exit(1)
  }

  try {
    console.error(`Extracting text from: ${pdfUrl}`) // Log sur stderr pour ne pas polluer stdout
    const rawText = await extractTextFromPdfUrl(pdfUrl)
    const cleanText = cleanPdfText(rawText)
    
    // Résultat sur stdout pour être capturé par execSync
    console.log(cleanText)
  } catch (error) {
    console.error(`Error extracting PDF text: ${error}`)
    process.exit(1)
  }
}

main()