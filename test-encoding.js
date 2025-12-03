const str = 'Ï€Î±Î¹Î´Î¯Î¿Î½' // Greek païdion from user
const str2 = 'Ã©' // é
const str3 = 'cÅ“ur' // cœur
const str4 = 'lâ€™imagination' // l'imagination

function fixEncoding(s) {
  try {
    // Try interpreting the string as Latin-1 (binary) bytes, then reading as UTF-8
    return Buffer.from(s, 'binary').toString('utf-8')
  } catch (e) {
    return s
  }
}

function fixEncodingWindows1252(s) {
  // This is trickier without iconv-lite, but let's try a heuristic
  // If we assume the string is "UTF-8 bytes interpreted as Windows-1252"
  // We need to map the chars back to bytes.
  // Most chars are 1-to-1 (U+00xx -> 0xXX).
  // But 0x80-0x9F are mapped to specific chars in CP1252 (like € for 0x80).

  const cp1252 = {
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

  const bytes = []
  for (let i = 0; i < s.length; i++) {
    const char = s[i]
    const code = char.charCodeAt(0)
    if (code <= 0xff && !cp1252[char]) {
      bytes.push(code)
    } else if (cp1252[char]) {
      bytes.push(cp1252[char])
    } else {
      // Char is > 0xFF and not in CP1252 map?
      // This implies it wasn't a result of CP1252 decoding, or it's already correct?
      // For the purpose of "fixing", we assume the whole string is mojibake.
      bytes.push(code & 0xff) // Fallback
    }
  }
  return Buffer.from(bytes).toString('utf-8')
}

console.log('Original:', str)
console.log('Binary Fix:', fixEncoding(str))
console.log('CP1252 Fix:', fixEncodingWindows1252(str))

console.log('\nOriginal:', str2)
console.log('Binary Fix:', fixEncoding(str2))
console.log('CP1252 Fix:', fixEncodingWindows1252(str2))

console.log('\nOriginal:', str3)
console.log('Binary Fix:', fixEncoding(str3))
console.log('CP1252 Fix:', fixEncodingWindows1252(str3))
