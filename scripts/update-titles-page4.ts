import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const titles = [
    // Page 4 - notes 151-175
    { id: 'cmix3pjqw009d8o6m270f4ud5', title: 'Hegel • Poésie • couleur et son • peinture' },
    { id: 'cmix3khgq003v8o6mytse0x1j', title: 'Nietzsche • da capo • paragraphes 61-62 • fin du texte' },
    { id: 'cmix4ffep018l8o6mkcld5fhl', title: 'Platon Aristote • emploi analogique • sens métaphysique vs matériel' },
    { id: 'cmix4fb4n018f8o6m99e5n53c', title: 'AVOIR • définition CNRTL • relation concrète/abstraite' },
    { id: 'cmix4gl8201b58o6m0dbml23r', title: 'Pardon • practices of recognition • magnanimous recollection' },
    { id: 'cmix45yj600sd8o6mhku5nb98', title: 'Plotin Lacan • « position de Sujet » • responsabilité • enjeu éthique' },
    { id: 'cmix4jwm701fb8o6ml4ms5sag', title: 'Klossowski • Sade mon prochain • feu du ciel • agressivité de Justine' },
    { id: 'cmix3ld3c004x8o6mtdb4r4on', title: 'Conte • « Dépêche-toi alors » • poisson pas cuit • humour' },
    { id: 'cmix46caz00sz8o6me1o4qcq6', title: 'Mysterium burocraticum • langage • faute et peine • irrecusable' },
    { id: 'cmix3s2sa00br8o6m48quyacs', title: 'Freud • Au-delà • système Cs • modification impossible' },
    { id: 'cmix3ifvu00158o6m40jda5tm', title: 'Fichte • idéalisme transcendantal • liberté morale • point de vue' },
    { id: 'cmix414h000m58o6m44uvz4ej', title: 'Castoriadis • chaos • écart • supprimer la relation' },
    { id: 'cmix47i4u00up8o6m5391ln75', title: 'Babelio • médecin • culture intellectuelle • haut point' },
    { id: 'cmix3lbcv004v8o6mmprrwlc7', title: 'Grecs • bonnes intentions • imaginaire' },
    { id: 'cmix4g51b01a78o6mmggnh0ck', title: 'Hegel • Phénoménologie de l\'esprit • vérité inclut le négatif' },
    { id: 'cmix3s7nv00bv8o6mzwsctej7', title: 'Freud • Au-delà • stimuli extérieurs • direction et nature' },
    { id: 'cmix3kty200498o6ml8fo2r0v', title: 'Hegel • philosophie et religion • lien • chose même' },
    { id: 'cmix3n8gu006p8o6mpr1f6u5f', title: 'Mystères • initiation • Athéniens • philosophie et religion' },
    { id: 'cmix485k300vx8o6mvu9j61is', title: 'Catégories universelles • isation progressive' },
    { id: 'cmix40d2y00l58o6m1nc4ko3w', title: 'Lacan • sinthome • nouveau symbolique, imaginaire' },
    { id: 'cmix4gih801b18o6m5rey55bb', title: 'Grecs • période étendue • pace accéléré • incomplet' },
    { id: 'cmix3vcxr00fx8o6m26n65t3a', title: 'Prêtresse • feu sacré • grotte • volonté proclamée' },
    { id: 'cmix4j2fm01eh8o6mqtjpfw2z', title: 'Lacan • objet a • statut subjectif • l\'homme depuis' },
    { id: 'cmix46bi800sx8o6muz7ex7lm', title: 'Agamben • Le feu et le récit • faute • « s\'être trouvé là »' },
    { id: 'cmix4jq3i01f78o6mv2xayyz9', title: 'Sade • désirs • « pourquoi me priverais-je » • créature' },
]

async function main() {
    console.log('🎨 Titres page 4 (151-175)...\n')
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
