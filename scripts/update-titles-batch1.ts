import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const titles = [
    // Page 2 notes
    { id: 'cmix4hqnl01cv8o6mqqhz7072', title: 'Kerslake • intentional stance • asymétrie parent-enfant • attribution d\'intentionnalité • comportement humain • Descartes, Kant • stance épistémique' },
    { id: 'cmix3wlnk00jh8o6mpthqpelw', title: 'Deleuze Guattari • Mille Plateaux • rhizome vs arbre • inconscient acentré • schizo-analyse • « produire de l\'inconscient » • automates finis • « société de mots » • Rosenstiehl Petitot • général Freud • théorème Firing Squad' },
    { id: 'cmix4282r00nf8o6m0kgggpv7', title: 'Lacan • sujet de l\'inconscient = sujet cartésien • Cogito • « Je suis, j\'existe » • res cogitans • articulation signifiante • castration • parole adressée à l\'Autre • désir, jouissance' },
    { id: 'cmix423kg00n98o6mm1i917le', title: 'Lacan • désir et loi de castration • chaîne signifiante • signifié du signifiant • phallus comme signifiant non-verbal • batterie signifiante • l\'Autre • être-selon-le-signifiant • « la plénitude de la Chose »' },
]

async function main() {
    console.log('🎨 Mise à jour des titres OCR...\n')

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

    console.log('\n✅ Batch terminé!')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
