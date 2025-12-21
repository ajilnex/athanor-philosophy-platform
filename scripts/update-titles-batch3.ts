import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const titles = [
    // Page 4 notes
    { id: 'cmix3mvrj006d8o6mzekzu5n9', title: 'Nietzsche Deleuze • éternel retour • Différence au centre, Même au pourtour • cercle décentré tortueux • négation comme ombre de l\'affirmation • « ceux qui portent le négatif ne savent pas ce qu\'ils font » • épiphénomène vs essence' },
    { id: 'cmix3q8w9009t8o6mxt1mspt1', title: 'Husserl Derrida • « Genèse et structure » • exactitude vs rigueur • idéalisation • multiplicité définie • eidétique abstraite • clôture axiomatique • « définitude » mathématique • essences et phénomènes' },
    { id: 'cmix41blq00md8o6mdpclpjd8', title: 'Lévi-Strauss Lacan • paradigme galiléen appliqué à l\'homme • chaîne de signifiant • méthode phonologique • séméiologie • mathème • Sartre dialectique subjective vs objective • « dissolution de l\'homme » • sujet de la science' },
    { id: 'cmix454rj00r58o6mjavpru2b', title: 'Structure • signifiant • anthropologie structurale • Milner • point hors structure • néant du sujet • science et humanisme' },
    { id: 'cmix3pdi200978o6mrigxku9h', title: 'Langage • parole • signification • expression • sens • référence • énonciation' },
    { id: 'cmix40ilm00lb8o6mbb9uthak', title: 'Signifiant • chaîne • métonymie • métaphore • condensation et déplacement • inconscient structuré comme un langage' },
    { id: 'cmix40fam00l78o6m0zbcinm3', title: 'Parole • acte de parole • performatif • Austin • illocutoire • perlocutoire • énonciation' },
    { id: 'cmix3pfer00998o6ma2gau1qt', title: 'Langage • signe • Saussure • arbitraire du signe • paradigme et syntagme • valeur différentielle' },
    { id: 'cmix4kcav01fv8o6meti3pit5', title: 'Logique • proposition • vérité • sens et dénotation • Frege • concept et objet' },
    { id: 'cmix43fhu00p58o6m126a205y', title: 'Pensée • concept • idée • représentation • jugement • raisonnement • entendement' },
]

async function main() {
    console.log('🎨 Mise à jour des titres OCR - Page 4...\n')

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

    console.log('\n✅ Batch page 4 terminé!')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
