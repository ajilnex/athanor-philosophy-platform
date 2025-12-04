/**
 * Unified encoding utilities for Feu Humain archive
 * Provides a robust Mojibake repair algorithm that handles mixed encoding.
 */

// Map des caractères Windows-1252 (0x80-0x9F) vers Unicode
const CP1252_MAP: Record<string, number> = {
  '€': 0x80,
  '‚': 0x82,
  ƒ: 0x83,
  '„': 0x84,
  '…': 0x85,
  '†': 0x86,
  '‡': 0x87,
  ˆ: 0x88,
  '‰': 0x89,
  Š: 0x8a,
  '‹': 0x8b,
  Œ: 0x8c,
  Ž: 0x8e,
  '‘': 0x91,
  '’': 0x92,
  '“': 0x93,
  '”': 0x94,
  '•': 0x95,
  '–': 0x96,
  '—': 0x97,
  '˜': 0x98,
  '™': 0x99,
  š: 0x9a,
  '›': 0x9b,
  œ: 0x9c,
  ž: 0x9e,
  Ÿ: 0x9f,
}

// Remplir les trous de la map (0x80-0x9F) qui sont indéfinis en CP1252 mais existent en ISO-8859-1
// (et apparaissent souvent comme des caractères de contrôle U+008x dans les Mojibake)
for (let i = 0x80; i <= 0x9f; i++) {
  const char = String.fromCharCode(i)
  if (CP1252_MAP[char] === undefined) {
    CP1252_MAP[char] = i
  }
}

// Remplir le reste de la map (0xA0-0xFF) qui correspond à Latin-1 / Unicode
for (let i = 0xa0; i <= 0xff; i++) {
  CP1252_MAP[String.fromCharCode(i)] = i
}

/**
 * Smart encoding cleaner that repairs Mojibake (double-encoded UTF-8).
 * Handles mixed content (valid UTF-8 + Mojibake) and control characters.
 *
 * @param str - String to clean
 * @returns Cleaned string with proper encoding
 */
export function cleanString(str: string | null | undefined): string | null | undefined {
  if (!str) return str

  // Étape 1: Convertir la chaîne en une séquence d'items (byte ou char)
  const items: Array<{ char: string; byte?: number }> = []
  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    const code = char.charCodeAt(0)

    if (code <= 0x7f) {
      items.push({ char, byte: code }) // ASCII
    } else if (CP1252_MAP[char]) {
      items.push({ char, byte: CP1252_MAP[char] }) // CP1252
    } else {
      items.push({ char }) // Non-mappable (ex: Emoji, ou char > 0xFF hors map)
    }
  }

  // Étape 2: Tenter de décoder les séquences d'octets valides en UTF-8
  let result = ''
  let i = 0
  while (i < items.length) {
    const item = items[i]

    // Si pas d'octet, on garde le caractère tel quel
    if (item.byte === undefined) {
      result += item.char
      i++
      continue
    }

    // Tentative de consommation d'une séquence UTF-8 valide
    const byte = item.byte
    let sequenceLength = 0

    if ((byte & 0x80) === 0) {
      sequenceLength = 1 // ASCII
    } else if ((byte & 0xe0) === 0xc0) {
      sequenceLength = 2
    } else if ((byte & 0xf0) === 0xe0) {
      sequenceLength = 3
    } else if ((byte & 0xf8) === 0xf0) {
      sequenceLength = 4
    }

    // Vérifier si la séquence est valide
    let isValidSequence = false
    if (sequenceLength > 1 && i + sequenceLength <= items.length) {
      isValidSequence = true
      const bytes = [byte]
      for (let j = 1; j < sequenceLength; j++) {
        const nextItem = items[i + j]
        if (nextItem.byte === undefined || (nextItem.byte & 0xc0) !== 0x80) {
          isValidSequence = false
          break
        }
        bytes.push(nextItem.byte)
      }

      if (isValidSequence) {
        // Décoder la séquence
        try {
          const decoded = Buffer.from(bytes).toString('utf-8')
          // Vérifier si le décodage a produit un caractère de remplacement (cas limites)
          if (decoded.includes('\uFFFD')) {
            isValidSequence = false
          } else {
            result += decoded
            i += sequenceLength
            continue
          }
        } catch (e) {
          isValidSequence = false
        }
      }
    }

    // Si séquence invalide ou ASCII, on traite le byte courant
    // Si c'était ASCII, on le garde (c'est déjà fait par le décodage UTF-8 implicite, mais ici on peut juste append le char)
    // Si c'était un byte > 0x7F qui ne forme pas de séquence valide, c'est probablement un caractère valide (ex: 'à' -> 0xE0)
    // Donc on garde le caractère original.

    result += item.char
    i++
  }

  return result.replace(/\s{2,}/g, ' ').trim()
}
