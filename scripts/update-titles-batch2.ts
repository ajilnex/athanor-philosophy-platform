import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const titles = [
    // Page 3 notes
    { id: 'cmix41tkd00n18o6m260enghs', title: 'Lacan • phallus symbolique • objet=x • passé pur qui ne fut jamais présent • fragment déplacé • castration • fixation, régression, trauma, scène originelle • « automatisme de répétition »' },
    { id: 'cmix3oyx0008l8o6mj654oyei', title: 'Deleuze • Différence et Répétition • objet virtuel • point complexe • répétition du même vs répétition de la différence • pulsion fixée • modèle brut vs constitutif' },
    { id: 'cmix3m8b9005r8o6mr7r1ozp8', title: 'Thomas d\'Aquin • Somme contre les Gentils • Avicenne • intentio, mana, ma\'qul, logos • intellect agent • abstraction • sens internes • arbre de Porphyre • intentions premières et secondes • béatitude' },
    { id: 'cmix434kg00op8o6m7o3vndk5', title: 'Butoh • Hijikata, Ohno • « réhabilitation humaine » • corps japonais • Hiroshima, Perry 1853 • surréalisme, expressionnisme • Neue Tanz • métamorphose • « non-produit sans but » vs capitalisme' },
    { id: 'cmix3qebz00a18o6m71qiymqy', title: 'Kant • Sublime • évaluation des grandeurs • appréhension vs compréhension • progression et régression • « l\'insuffisance de ce pouvoir lui-même sans limites »' },
    { id: 'cmix45trm00s58o6m3dgof8dh', title: 'Réflexion • conscience de soi • retour sur soi • médiation • immédiateté perdue' },
    { id: 'cmix3zlue00jz8o6mytya4ige', title: 'Deleuze Guattari • Géologie de la morale • strates • territorialisation • agencements machiniques • double articulation' },
    { id: 'cmix3omft008f8o6ms8i9a36s', title: 'Deleuze • Différence et Répétition • « la répétition pour elle-même » • éternel retour • synthèse du temps • passif vs actif' },
    { id: 'cmix41rmh00mz8o6mtvxo0wfv', title: 'Lacan • le désir et son sujet • signifiant • chaîne signifiante • manque • Autre • phallus • loi symbolique' },
    { id: 'cmix3r4se00av8o6mi5fy32xy', title: 'Kant • Analytique du Sublime • jugement esthétique • mathématique vs dynamique • nature • imagination • raison • suprasensible' },
]

async function main() {
    console.log('🎨 Mise à jour des titres OCR - Page 3...\n')

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

    console.log('\n✅ Batch page 3 terminé!')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
