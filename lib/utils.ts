import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseTags(tagsString: string | null): string[] {
  if (!tagsString) return []
  try {
    const parsed = JSON.parse(tagsString)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Nettoie et sanitize un titre pour l'affichage.
 * Supprime les caractères décoratifs (box-drawing), tronque si nécessaire.
 * @param title - Le titre à nettoyer
 * @param maxLength - Longueur maximale avant troncature (défaut: 80)
 * @returns Le titre nettoyé
 */
export function sanitizeTitle(title: string, maxLength: number = 80): string {
  // Supprimer les caractères décoratifs (box-drawing, blocs Unicode)
  let cleaned = title
    .replace(/[═─━┃│┌┐└┘├┤┬┴┼╔╗╚╝╠╣╦╩╬▀▄█▌▐░▒▓]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Si après nettoyage le titre est vide ou trop court, utiliser un fallback
  if (cleaned.length < 2) {
    cleaned = 'Sans titre'
  }

  // Tronquer si trop long
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength).trim() + '…'
  }

  return cleaned
}

/**
 * Vérifie si une chaîne contient du texte significatif
 * (au moins N caractères alphabétiques)
 */
export function hasSignificantText(text: string, minAlphaChars: number = 3): boolean {
  const cleaned = text
    .replace(/[═─━┃│┌┐└┘├┤┬┴┼╔╗╚╝╠╣╦╩╬▀▄█▌▐░▒▓*_~\`#>|+-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  const alphaCount = (cleaned.match(/[a-zA-ZÀ-ÿ]/g) || []).length
  return alphaCount >= minAlphaChars
}
