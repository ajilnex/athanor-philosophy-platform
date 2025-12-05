/**
 * Script pour corriger l'encodage des noms des participants
 * Les noms sont en Mojibake (UTF-8 mal interprété comme Latin-1)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Dictionnaire de corrections Mojibake -> UTF-8
const mojibakeFixMap: Record<string, string> = {
    'Ã©': 'é',
    'Ã¨': 'è',
    'Ã ': 'à',
    'Ã¯': 'ï',
    'Ã«': 'ë',
    'Ã¢': 'â',
    'Ã®': 'î',
    'Ã´': 'ô',
    'Ã»': 'û',
    'Ã¼': 'ü',
    'Ã§': 'ç',
    'Ã': 'À', // Attention: peut aussi être 'Ã' seul
    'Ã€': 'À',
    'Ã‰': 'É',
    'Ãˆ': 'È',
}

function fixMojibake(text: string): string {
    let fixed = text
    for (const [mojibake, correct] of Object.entries(mojibakeFixMap)) {
        fixed = fixed.replace(new RegExp(mojibake, 'g'), correct)
    }
    return fixed
}

async function main() {
    console.log('🔧 Correction des noms de participants...\n')

    const participants = await prisma.conversationParticipant.findMany({
        select: { id: true, name: true }
    })

    let fixedCount = 0

    for (const participant of participants) {
        const originalName = participant.name
        const fixedName = fixMojibake(originalName)

        if (originalName !== fixedName) {
            console.log(`  ❌ "${originalName}"`)
            console.log(`  ✅ "${fixedName}"\n`)

            await prisma.conversationParticipant.update({
                where: { id: participant.id },
                data: { name: fixedName }
            })

            fixedCount++
        }
    }

    console.log(`\n✨ ${fixedCount} noms corrigés sur ${participants.length} participants.`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
