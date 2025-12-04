import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const msg = await prisma.conversationMessage.findFirst({
    orderBy: {
      createdAt: 'desc',
    },
  })
  console.log('Latest Imported Message:', msg?.content)

  // Also test the repair logic on the raw string
  const raw = 'Chez l\u00e2\u0080\u0099homme'
  console.log('Raw JSON:', raw)

  // Re-implement the logic I used
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
    Ã: 0xc3,
    '©': 0xa9,
    â: 0xe2, // Add some common ones just to be sure
  }

  function cleanString(str: string) {
    const bytes: number[] = []
    for (let i = 0; i < str.length; i++) {
      const char = str[i]
      const code = char.charCodeAt(0)
      if (CP1252_MAP[char]) {
        bytes.push(CP1252_MAP[char])
      } else if (code <= 0xff) {
        bytes.push(code)
      } else {
        bytes.push(code & 0xff)
      }
    }
    return Buffer.from(bytes).toString('utf-8')
  }

  console.log('Repaired:', cleanString(raw))
}

main()
