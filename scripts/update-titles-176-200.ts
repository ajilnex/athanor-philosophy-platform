import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const titles = [
    // Page 4 suite - notes 176-200
    { id: 'cmix4ku5m01gh8o6mw871n6p7', title: 'Yonatan Levy • Facebook • hébreu' },
    { id: 'cmix3kfwt003t8o6makbu8j7r', title: 'Nietzsche • troisième section • profondeur • mi-chrétien mi-allemand' },
    { id: 'cmix40r9u00ln8o6mpjblvx5u', title: 'Lune noire • mythe à pratique • pas une planète' },
    { id: 'cmix4679q00sr8o6m3v1xxbzm', title: 'Agamben • Le feu et le récit • « nous ne pouvons plus allumer le feu »' },
    { id: 'cmix4iws801ed8o6muybyg2h8', title: 'Lacan • statut subjectif • objet a' },
    { id: 'cmix4gjhk01b38o6mowjn93ma', title: 'Hegel • normative force • bindingness • undercut' },
    { id: 'cmix3qylr00an8o6mdgswzkrp', title: 'Hegel • Abstossen • deux forces • unité essentielle' },
    { id: 'cmix40c1300l38o6mn5s9bw0i', title: 'Lacan • lucus/lucet • jeu de mots latin • petit bois' },
    { id: 'cmix3jpn500338o6m8pksr5zx', title: 'Blanchot • De Kafka à Kafka • extraordinaire passion • Procès' },
    { id: 'cmix46rns00th8o6mmkc737tp', title: 'Babelio • grand mais concis • réflexion remarquable' },
    { id: 'cmix4gml601b78o6mw2h2xxm7', title: 'Hegel • Geist • form of life • recognitive normative' },
    { id: 'cmix468ic00st8o6mki9c0wuw', title: 'Agamben • Le feu et le récit • « cela suffit » énigmatique' },
    { id: 'cmix3ivhj001z8o6mkqjdzelv', title: 'Langage • mensonges • points frappants' },
    { id: 'cmix46qzc00tf8o6mqeof1v4u', title: 'Babelio • extase totale • Suressentielle splendeur' },
    { id: 'cmix3l4zr004n8o6mpc4ebq53', title: 'Nietzsche • Nos vertus • septième section • probable' },
    { id: 'cmix3sf8600c38o6m30v6jmvk', title: 'Tylor • Researches Early History of Mankind • 1878' },
    { id: 'cmix47k0h00ur8o6m9els6fns', title: 'Ceinture de feu • volcans • Océan Pacifique' },
    { id: 'cmix41enb00mh8o6mup335hzx', title: 'Analyticité • philosophe • extrapoler au savoir théorique' },
    { id: 'cmix3oaaj007x8o6mepnvms5c', title: 'Michele Zaza • Simulation d\'incendie • 1970 • tirages' },
    { id: 'cmix3xska00il8o6m6jj56qy7', title: '« Prenons par exemple les oiseaux » • la_releve_et_la_peste' },
    { id: 'cmix3mcnj005x8o6mj9ywmabs', title: 'Empire d\'Akkad • art des sceaux • panthéon • 2350 av. J.-C.' },
    { id: 'cmix4m0n901i58o6mn1i75mj6', title: 'Axiomes • identité • systèmes • complications architectoniques' },
    { id: 'cmix4fcyc018h8o6mqxkavyz9', title: 'AVOIR • langage amoureux • posséder • amant' },
    { id: 'cmix3mtl3006b8o6m0r3ces19', title: 'Wotan • « cœur dur » • vieille saga' },
    { id: 'cmix3j74l002f8o6m5kuhfkbu', title: 'Blanchot • Kafka • idéal vide • présence dans le monde' },
]

async function main() {
    console.log('🎨 Titres 176-200...\n')
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
