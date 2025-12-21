import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const titles = [
    // Pages 5-10 notes
    // Page 5
    { id: 'cmix3lqnr005a8o6m0n6qpxqq', title: 'Blanchot • voix narrative • neutre • parole oblique • distance irréciprocité dissymétrie • « on ne peut neutraliser le neutre » • signifier autrement que visible-invisible • métaphore lumière' },
    { id: 'cmix4ijlm01e18o6m4w0lmony', title: 'Lacan • aphanisis du sujet • vel aliénation • Hegel dialectique • surgissement du sujet dans l\'Autre • Cogito cartésien • « Dimanche de la vie » • savoir absolu • inconscient' },

    // Page 10
    { id: 'cmix3p97g00918o6mjug642p0', title: 'Lévi-Strauss • mythe langue et parole • structure permanente • passé présent futur • Révolution française • Michelet « ce jour-là tout était possible » • objet absolu troisième niveau linguistique' },
    { id: 'cmix3qmq600a78o6maxcgvldr', title: 'Hegel • Phénoménologie • voie royale de la philosophie • bon sens vs concept • travail du négatif • universalité du savoir • « feux de Bengale ne sont pas l\'empyrée » • génie vs pensées vraies' },
]

async function main() {
    console.log('🎨 Mise à jour des titres OCR - Pages 5-10...\n')

    for (const t of titles) {
        try {
            await prisma.archiveNote.update({
                where: { id: t.id },
                data: { nodeLabel: t.title }
            })
            console.log('✓', t.title.substring(0, 70) + '...')
        } catch (e) {
            console.log('✗ Erreur pour', t.id)
        }
    }

    console.log('\n✅ Batch pages 5-10 terminé!')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
