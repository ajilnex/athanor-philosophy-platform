import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const titles = [
    // Notes 7-12 manquantes
    { id: 'cmix3zzpk00kj8o6m7rxxs4eo', title: 'Miller • « pièce détachée » • jouissance • esthétisation de l\'art' },
    { id: 'cmix3ygdp00j38o6mpe9d7rqw', title: 'Deleuze Guattari • Rhizome • dé/re-territorialisation • orchidée-guêpe • devenir' },
    { id: 'cmix43rc200p98o6mxyxv4e8u', title: 'Hegel • le Concept • singularité • universel concret • syllogisme' },
    { id: 'cmix41dpg00mf8o6mm1xilnmg', title: 'Lacan Lévi-Strauss Sartre • « matérialisme primaire » • dialectique et structure • signifiant' },
    { id: 'cmix3z60o00jp8o6mup6u239l', title: 'Deleuze Guattari • Géologie de la morale • double articulation • contenu/expression • strates' },
    { id: 'cmix3w6h000gr8o6m4s3z6u7w', title: 'Empédocle • μεταφορά • « Elle transforme le monde » • langage, prière, malédiction' },
    // Notes 13-18 manquantes  
    { id: 'cmix3ykrf00j78o6mrsypgq98', title: 'Strate • sédimentation • code • territoire' },
    { id: 'cmix3okc0008d8o6m86jmeoru', title: 'Deleuze • Différence et Répétition • synthèse passive • habitude' },
    { id: 'cmix3y1q700ix8o6m3b533jzl', title: 'Deleuze Guattari • Mille Plateaux • Corps sans Organes • intensité' },
    { id: 'cmix3xy9s00iv8o6mbdz3i7w1', title: 'Deleuze Guattari • Mille Plateaux • machine abstraite • diagramme' },
    { id: 'cmix41vs200n58o6mvi4uuzez', title: 'Lacan • désir et sujet • signifiant-maître • S1-S2' },
    { id: 'cmix3ysp500jb8o6m15pefgak', title: 'Lalangue • équivoque • jouissance du signifiant' },
]

async function main() {
    console.log('🎨 Rattrapage titres manquants 7-18...\n')

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

    console.log('\n✅ Rattrapage terminé!')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
