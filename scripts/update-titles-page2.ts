import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const titles = [
    // Page 2 - notes 51-70
    { id: 'cmix3jfy0002t8o6mp237gc1n', title: 'Blanchot • « La Part du Feu » • Le Livre • Mallarmé • « explication orphique de la Terre »' },
    { id: 'cmix4iuff01eb8o6mo90ltkzl', title: 'Rupture monstrueuse • ignorance, indifférence • voile et mystère' },
    { id: 'cmix3lyda005f8o6m521wlbk7', title: 'Thomas d\'Aquin • Somme contre les Gentils • mouvement des bêtes • partie motrice' },
    { id: 'cmix45psn00s18o6mbr0zkzul', title: 'Plotin Hadot • conscience scindée • « point de perspective » • pensée indivisible' },
    { id: 'cmix3puvm009j8o6m3hjzgpeo', title: 'Hegel • Poésie • beauté spirituelle • défaut de l\'art • manière plus spirituelle' },
    { id: 'cmix3k5c6003h8o6mmd9fziq1', title: 'Heidegger • Münchhausen • « s\'arracher au marécage du néant » • existence' },
    { id: 'cmix3s08q00bp8o6m00dmn4kj', title: 'Platon • Timée • affinité • surface polie • mélange des éléments' },
    { id: 'cmix3qpho00a98o6mam628hb0', title: 'Hegel • Phénomène • unité négative • Un du quelque-chose • abstraction extérieure' },
    { id: 'cmix3h1m600018o6ml6zsp4x4', title: 'Deleuze Derrida • différence • « le soi emporté avec la différence » • différer' },
    { id: 'cmix4j6do01ej8o6mn2fcw34w', title: 'Rupture • succomber • mystère sous le voile • détournement du regard' },
    { id: 'cmix4kq4p01g98o6mn02a19m4', title: 'Féminité • envie du pénis • hystérie • « énigme de la femme » • désir' },
    { id: 'cmix3k9we003n8o6mh17wrktb', title: 'Nietzsche • Par-delà • « faire périr la connaissance » • suprême degré' },
    { id: 'cmix4083o00kx8o6muaw0449a', title: 'Lacan • « l\'inconscient structuré comme un langage » • surprise' },
    { id: 'cmix3yi4g00j58o6mi1v3xu7i', title: 'Deleuze Guattari • enfant • impasses politiques • cartes vs calques • dualisme' },
    { id: 'cmix4dwvg016t8o6mkr5y2l0s', title: 'Représentants • dialoguent • fonction de représentation pure' },
    { id: 'cmix44l2800qj8o6mo4dpoq2y', title: 'Yi King • soleil couchant • chaudron • vieillesse • « tension du transitoire »' },
    { id: 'cmix460ib00sf8o6m282v8nwn', title: 'Jankélévitch • pardon • idée du pardon • force d\'implosion' },
    { id: 'cmix4dzi9016v8o6mp1tq8gop', title: 'Lacan • aphanisis • vel aliénation • dialectique hégélienne • surgissement du sujet' },
    { id: 'cmix3nc5i006t8o6mol2zhoyb', title: 'Hegel • Leçons histoire philosophie • mythes et malentendus • Aristote' },
    { id: 'cmix4530q00r38o6m2e3ix0rr', title: 'Philosophie de l\'esprit • vue extérieure • expérimental • problèmes, concepts, modèles' },
]

async function main() {
    console.log('🎨 Titres page 2 (51-70)...\n')

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

    console.log('\n✅ Page 2 terminée!')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
