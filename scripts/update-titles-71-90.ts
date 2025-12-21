import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const titles = [
    // Notes 71-90 (page 2, suite)
    { id: 'cmix412zw00m38o6m5bkjj6x9', title: 'Hegel • lettre à sa femme • voyage Erfurt • voiture militaire' },
    { id: 'cmix403us00kr8o6mydl0lqig', title: 'Lacan • « ce qui fait trou dans le réel » • nœuds • fonction du trou' },
    { id: 'cmix4lwbe01i18o6m3c18ni4d', title: 'Philosophie antisystématique • liberté • hétérogène • système' },
    { id: 'cmix3mnr300638o6mw1n2l1lp', title: 'Plotin • beauté du simple • parties et tout • beauté véritable' },
    { id: 'cmix45lmk00rx8o6m16bglq24', title: 'Platon • Phédon • corps obstacle • « jamais de répit pour la philosophie »' },
    { id: 'cmix44npi00ql8o6msbzn2g4r', title: 'Feu • lumineux et obscur • conflit • métaphore • brûler, s\'approcher' },
    { id: 'cmix4dj1e01698o6mn3i8qwx6', title: 'Senghor • Art Africain comme Philosophie • rythmes • négritude' },
    { id: 'cmix4ihqb01dz8o6mg9gy9fup', title: 'Lacan • champ de l\'Autre • communication • représentants • diplomates' },
    { id: 'cmix3mp5a00658o6m0dw92ml6', title: 'Plotin • beauté sensible/intelligible • lumière • forme vs matière' },
    { id: 'cmix406tj00kv8o6micymge6p', title: 'Lacan • Sinthome • Joyce • ego • narcissisme • rapport au corps' },
    { id: 'cmix3jsan00358o6md3en9d0b', title: 'Blanchot • voix narrative • neutre • « s\'absenter en celui qui la porte »' },
    { id: 'cmix44icn00qh8o6m1xanfidb', title: 'Taoïsme • feu comme mutation • relation entre êtres • conditionné' },
    { id: 'cmix3nmch00718o6mhiyqvb5h', title: 'Aristote • l\'Infini • division • « toujours quelque chose en dehors »' },
    { id: 'cmix3kjey003x8o6mxsun7ww0', title: 'Nietzsche • Par-delà • da capo éternel • pensée négatrice du monde' },
    { id: 'cmix3plwf009f8o6msxun77tn', title: 'Hegel • Poésie • mode sensible • limitation du fond spécifique' },
    { id: 'cmix3nr4t00778o6md0gir26u', title: 'Deleuze • élément différentiel • sigma • opération • toujours autre' },
    { id: 'cmix49hgs00yh8o6mwn19gl1i', title: 'Freud • pulsion partielle • Schub • « fusée de lave » • déflagration' },
    { id: 'cmix419wx00mb8o6mhn4z1sep', title: 'Lacan • L\'excommunication • science vs expérience mystique' },
    { id: 'cmix3phho009b8o6mub6ru6lf', title: 'Hegel • Poésie • son et expression • phénomène sensible • esprit' },
]

async function main() {
    console.log('🎨 Titres 71-90...\n')
    for (const t of titles) {
        try {
            await prisma.archiveNote.update({
                where: { id: t.id },
                data: { nodeLabel: t.title }
            })
            console.log('✓', t.title)
        } catch (e) {
            console.log('✗', t.id)
        }
    }
    console.log('\n✅ Batch terminé!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
