import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const titles = [
    // Notes 41-50
    { id: 'cmix3rt6500bl8o6mgzlnpv6c', title: 'Platon • Timée • âme, cercles divins • tête sphérique • « partie divine et maîtresse »' },
    { id: 'cmix3iazl000z8o6mwrqycsjv', title: 'Fichte • Spinoza • « penser la philosophie, non y croire » • réflexion sur l\'être' },
    { id: 'cmix3rw9200bn8o6m1tvih5j1', title: 'Platon • Timée • œil • feu pur • lumière du jour • courant de la vue' },
    { id: 'cmix4181y00m98o6m3gxocre1', title: 'Lacan • « L\'excommunication » • objet de la science • expérience reproductible' },
    { id: 'cmix4hby501cd8o6m3ttvc3dy', title: 'Cognition animale • états internes • perception-volition • faim et cognition' },
    { id: 'cmix45nr600rz8o6m4bgxkj0e', title: 'Plotin • Intellect • intelligibles • « ni conjecture ni ambiguïté » • vérité' },
    { id: 'cmix3qhev00a38o6mou3g3o8b', title: 'Nietzsche • Gai Savoir • « volonté de vérité à tout prix » • sacrifice des croyances' },
    { id: 'cmix3p0jx008n8o6m00clvxs0', title: 'Deleuze • répétition • fixation régression • déguisements travestis • présent ancien/nouveau' },
    { id: 'cmix3uocp00et8o6mi2iiwm6j', title: 'Lacan • identité • mi-dire • réel et savoir inconscient • phonème et phrase' },
    { id: 'cmix44y5f00qz8o6me1lji27w', title: 'Superintelligence • sapience • universel vs local • conception et transformation' },
]

async function main() {
    console.log('🎨 Titres 41-50...\n')

    for (const t of titles) {
        try {
            await prisma.archiveNote.update({
                where: { id: t.id },
                data: { nodeLabel: t.title }
            })
            console.log('✓', t.title)
        } catch (e) {
            console.log('✗ Erreur pour', t.id)
        }
    }

    console.log('\n✅ Batch terminé!')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
