import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const titles = [
    // Page 3 suite - notes 126-150
    { id: 'cmix3na9o006r8o6ma2lh8e4q', title: 'Hegel • Platon Jacobi • mythes • idées sublimes' },
    { id: 'cmix46g2j00t58o6mcitzqh3y', title: 'Lacan • « analyse profane » • Sainte-Anne • lieu de séminaire' },
    { id: 'cmix3kz97004f8o6m9gkzr1ya', title: 'Hegel • philosophie = pensée de l\'esprit • véritable vie' },
    { id: 'cmix45vp600s78o6mpdlcydko', title: 'Julius Bissier • Carl Einstein • Georg Scholz • art abstrait' },
    { id: 'cmix4mo2r01jh8o6my6dke70b', title: 'Radicalisation de l\'écriture • thèses féroces • sans concession' },
    { id: 'cmix43uvd00pd8o6myidmqd5l', title: 'Corps • désirs • « crime contre Dieu » • vérité vivante' },
    { id: 'cmix43yzx00ph8o6m8z8u6ji8', title: '« Je serai qui je serai » • désir éternel d\'être • âme' },
    { id: 'cmix44ue600qt8o6mxhg8h8bk', title: 'Eco • L\'Œuvre ouverte • crise civilisation bourgeoise • création' },
    { id: 'cmix4f5xd018b8o6mp8b13pzy', title: 'Heidegger • eonta • présent • séjour • contrée de l\'éclosion' },
    { id: 'cmix4klot01g38o6mtc1eigjn', title: 'Interdiction de penser • origine religieuse • loyauté aveugle • sujets' },
    { id: 'cmix4iltg01e38o6m1r2sddj5', title: 'Lacan • champ de l\'Autre • vel • « ni l\'un ni l\'autre »' },
    { id: 'cmix3iz5e00238o6mejlw9gzd', title: 'Platon • mathématiques vers dialectique • savoir supérieur' },
    { id: 'cmix4aq1b010r8o6mc5zbmfz8', title: 'Beckett • Molloy • tendresse • ongles • baume Bengué • idylle' },
    { id: 'cmix3tf5300cr8o6mi4umjecs', title: 'Confiance • trahison • « il n\'est pas fiable »' },
    { id: 'cmix4jugk01f98o6moxhlp732', title: 'Cruauté • impulsion naturelle • revendication agressive' },
    { id: 'cmix4ghcy01az8o6m0i67j134', title: 'Intentional agency • historical-recollective • conceptual content' },
    { id: 'cmix4163100m78o6m76cvwo4s', title: 'Castoriadis • imagination radicale • schemes et figures • représentation' },
    { id: 'cmix480ii00vf8o6mea6mi9ol', title: 'Nietzsche • Werke kritische • Google Books' },
    { id: 'cmix3mfi8005z8o6mkguve1fd', title: 'Varakhsha • Boukhara • Bukhar-khudat • monument hybride' },
    { id: 'cmix3np0p00758o6mtlzc0joy', title: 'Aristote • Infini • « toujours encore » • acceptions' },
    { id: 'cmix3l1gf004h8o6mnk395il0', title: 'Histoire • peintre • réel • philosophie' },
    { id: 'cmix3t15j00cl8o6msfkv574w', title: 'Dessication conceptuelle • art de plaire • réciprocité sympathique' },
    { id: 'cmix3rq7900bj8o6md09nb59v', title: 'Freud • Au-delà • décharge • prise de conscience • modification' },
    { id: 'cmix3q1j4009n8o6mwc2cacsy', title: 'Léonie Marion • accident • enterrement • dysfonctionnements' },
    { id: 'cmix4kxfq01gn8o6mc4k31itg', title: 'Énergie sexuelle • feu sacré • orgasme océanique • révélation' },
]

async function main() {
    console.log('🎨 Titres 126-150...\n')
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
