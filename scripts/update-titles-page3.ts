import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const titles = [
    // Page 3 - notes 101-125
    { id: 'cmix3ihiw00178o6mk2bf9453', title: 'Fichte • genèse théorique/pratique • unité de la raison • activité' },
    { id: 'cmix3s5xu00bt8o6m3wb0sx2a', title: 'Freud • Au-delà du principe de plaisir • processus excitatif' },
    { id: 'cmix3p1tl008p8o6m9bab5wyp', title: 'Attouchement • appel hors expérience • succession temporelle' },
    { id: 'cmix4ldgp01hf8o6m9q0wp8cw', title: 'Lacan • désir dans le rêve • symbolique • relation imaginaire • érotique' },
    { id: 'cmix42quw00o58o6m98km0xpm', title: '« L\'ultime évidence » • misérables • monde pure poésie • mort' },
    { id: 'cmix3m3gb005l8o6mkacnabbn', title: 'Alexandre d\'Aphrodise • intellect corruptible • matérialisme contesté' },
    { id: 'cmix439wh00ot8o6muxypmvm6', title: 'Lacan • Imaginaire, Symbolique, Réel • sujet défaille • désigner' },
    { id: 'cmix40m3p00lf8o6mahl7utcx', title: 'Trous noirs • invisible • champ gravitationnel • astrophysique' },
    { id: 'cmix46ivr00t78o6mtpue28en', title: 'Récit personnel • juif • Tariq Alfortville • « chut »' },
    { id: 'cmix4dumr016r8o6mh1p5prp3', title: 'Médiation • représentation • faux mouvement • « tout le monde reconnaît »' },
    { id: 'cmix3kvw1004b8o6m447t9nz3', title: 'Hegel • histoire de la philosophie • branches d\'un arbre • Esprit un' },
    { id: 'cmix4056s00kt8o6m44w3lf6z', title: 'Lacan • « L\'avenir de cette illusion » • invention du réel • au-delà du sujet' },
    { id: 'cmix3jncg002z8o6mn2i1u2lr', title: 'Blanchot • De Kafka à Kafka • demi-sommeil • interstices de la loi • Bürgel' },
    { id: 'cmix43wx800pf8o6mzp49a01k', title: 'YHVH • éhyéh acher éhyéh • « Je serai qui je serai » • Nom' },
    { id: 'cmix4k87901ft8o6meuk5ahmr', title: 'Freud • She • « éternel féminin » • sens caché • femme' },
    { id: 'cmix3kxnk004d8o6mly96r4fi', title: 'Hegel • dignité de l\'homme • savoir penser ce qu\'il est' },
    { id: 'cmix3sa5g00bx8o6m4fa1fiux', title: 'Freud • Au-delà • inconscient atemporel • hors chronologie' },
    { id: 'cmix3icpz00118o6mwgqeglgj', title: 'Fichte • Reinhold, Maimon • sens purement transcendantal' },
    { id: 'cmix45rk700s38o6musudjgi4', title: 'Plotin • « percevoir notre pensée » • affaiblissement • Nous' },
    { id: 'cmix3k7et003l8o6mmz49sw5g', title: 'Nietzsche • Par-delà • « coups de oui et de non » • expier' },
    { id: 'cmix3n3qz006j8o6m6j5h23bg', title: 'Hegel • mythologies • images signifiant des pensées' },
    { id: 'cmix487sd00w18o6mhq234ofx', title: 'Philosophie • « burning in the mind » • problème qui hante' },
    { id: 'cmix4ds49016p8o6mq076hft6', title: 'Deleuze • incompossibilités • crime et vertu • éternel retour' },
    { id: 'cmix3iedr00138o6mcgneusn1', title: 'Fichte • idéalisme expression de la vie • impensable pensé • Kant' },
    { id: 'cmix3ndn5006v8o6mvhy8t20q', title: 'Lacan • « la nature a horreur du vide » • le vide a horreur' },
]

async function main() {
    console.log('🎨 Titres page 3 (101-125)...\n')
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
