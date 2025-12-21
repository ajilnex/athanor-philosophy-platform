import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const titles = [
    // Notes 91-100
    { id: 'cmix3m62q005p8o6m5cy1hqjr', title: 'Thomas d\'Aquin • intellect agent • formes intelligibles • De anima • récepteur en puissance' },
    { id: 'cmix3r0j600ap8o6m1r34unpd', title: 'Hegel • Logique essence • réflexion présupposante • être-conditionné • impulsion' },
    { id: 'cmix3nnok00738o6myimlc25r', title: 'Aristote • Infini • « de combien de façons se dit l\'infini » • classification' },
    { id: 'cmix4lzok01i38o6mrtwqfyqn', title: 'Philosophie XVIIe • ratio • classe bourgeoise • ordre spirituel ruiné' },
    { id: 'cmix4l1p601gz8o6m4fqo8na6', title: 'Vérité femme • « déesse nue » • intouchable • ciel intelligible • pudeur métaphysicienne' },
    { id: 'cmix46wjm00tr8o6m1n14ywho', title: 'Déconstruction • excède la logique • jeu, écart à soi • sur-jouer le prédicat' },
    { id: 'cmix3i4so000n8o6mcdouaher', title: 'Bataille • Ma Mère • « ni le soleil ni la mort » • Dieu • fenêtre de l\'Église' },
    { id: 'cmix3mxru006f8o6mnwhugvf7', title: 'Hegel • histoire de la philosophie • esprit sans limites • bornes de la raison' },
]

async function main() {
    console.log('🎨 Titres 91-100...\n')
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
