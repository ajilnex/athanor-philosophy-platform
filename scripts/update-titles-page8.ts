import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const titles = [
    // Page 8 - notes 351-400
    { id: 'cmix4h7fu01c38o6m1yjgz8mr', title: 'Peinture • « empâtement » • épaisseur des couleurs' },
    { id: 'cmix3ts4v00dh8o6mp7wvqrxf', title: 'Minecraft Wiki • fandom' },
    { id: 'cmix3ztut00k98o6mlqvdxw7i', title: '« Nous ne pensons pas » • êtres pensants • ils disent' },
    { id: 'cmix40w9v00lt8o6mhrcgxu2t', title: 'Lilith • Plaie • aussi' },
    { id: 'cmix4h3yu01bv8o6momwxgnsq', title: 'Énigme • contrats • hasard' },
    { id: 'cmix3w2ia00gl8o6ms1l496xy', title: '« Sa colère s\'enflamme » • signe qui touche terre' },
    { id: 'cmix3ths900cv8o6mfnmm7msl', title: 'Philomag • « le recours au feu »' },
    { id: 'cmix3sv7w00cd8o6m1nmlr0pu', title: 'Lorgnon • bout du nez • pince' },
    { id: 'cmix4b5pp011h8o6m4usgcu0k', title: 'Peck\'s definition • flourish • difficulty' },
    { id: 'cmix3ytm900jd8o6mu53o64qa', title: 'Processus • départ • tout ce' },
    { id: 'cmix3zuf700kb8o6mscefvifb', title: 'Freud • moi = succession d\'identifications' },
    { id: 'cmix4h95w01c98o6msprlmvgg', title: 'Ornée de diamants • ils ne voient pas' },
    { id: 'cmix3zxr500kh8o6mkg1n9xar', title: 'Reporterre • forêt • crainte et invasive' },
    { id: 'cmix44bc200q78o6m20stf86v', title: 'Independence Day • computer game' },
    { id: 'cmix3zvyo00kf8o6m4v7df4vx', title: 'Freud • registre religieux • ce que montre' },
    { id: 'cmix459rg00rd8o6mtofn4o0v', title: 'Réflexivité de l\'esprit • définir une machine' },
    { id: 'cmix3xk4o00i78o6m7c82yndq', title: 'Lacan • « D\'un discours qui ne serait pas du semblant »' },
    { id: 'cmix4jaoo01ep8o6mmkumk9bd', title: 'Cryptique • caractères divers' },
    { id: 'cmix41ftx00ml8o6mpdjpagnj', title: 'Context-dependence • massive and complex phenomenon' },
    { id: 'cmix3qb3z009z8o6mlgsu04nw', title: 'Esprit • juger et apprécier esthétiquement' },
    { id: 'cmix3wd9q00h38o6mklnvorrn', title: 'Soubassements culture occidentale • explorer' },
    { id: 'cmix47gq900un8o6mij78avd9', title: 'Biologist • perceive evolutionary • distinct perception' },
    { id: 'cmix3xtdu00in8o6mvyhbbqaj', title: 'Maître interrompt le silence • arcaïsme' },
    { id: 'cmix3uat100e38o6mkxae1lpo', title: 'Capture d\'écran • interface' },
    { id: 'cmix42dvz00nv8o6mk63h0vtv', title: 'Ressouvenir • tout entière qui existe a existé' },
    { id: 'cmix3xvqj00it8o6mngrsezeq', title: 'Freud lui-même • nous en • venons' },
    { id: 'cmix4g8ey01ab8o6mudmtbbp9', title: '« Incandescences » • récit choral galvanisant' },
    { id: 'cmix4b8ok011p8o6m0awygjkj', title: 'Account for our particular' },
    { id: 'cmix48ydc00x58o6mqhhdgpy5', title: 'Zarathoustra • « chemin du créateur » • se créer un dieu' },
    { id: 'cmix4k5hi01fr8o6msk1jl5ou', title: 'Derrida • Éperons • « bêtise » • n\'admirons' },
    { id: 'cmix4mdec01j78o6mshyyc5v2', title: '« La souffrance de la vie » • moment de jeunesse fleuri' },
    { id: 'cmix4epkz017l8o6mdlv4wr0g', title: 'Divan • poèmes • disparition' },
    { id: 'cmix4dezz01618o6modivpbhg', title: 'Enfants se traitent • du mieux qu\'ils peuvent' },
    { id: 'cmix4gv6n01bj8o6mc6bfz5aj', title: 'Wiz Khalifa • Cardo Got Wings' },
    { id: 'cmix3jbam002l8o6mflzlhuhp', title: 'The Phoenix Complex • Amazon' },
    { id: 'cmix4598900rb8o6mykztirx1', title: 'Cryptique • symboles' },
    { id: 'cmix445j500pr8o6mmxu025qi', title: 'Contextualism • where does content come from' },
    { id: 'cmix41oxt00mv8o6mi65hi2xa', title: '« On n\'épuise jamais le sens de nos interactions »' },
    { id: 'cmix4j8jh01en8o6md0riv2bf', title: '« I wanted someone to tell me things were going to be fine »' },
    { id: 'cmix440kg00pl8o6modiahxz2', title: 'Valeur quand il accepte • refuse = n\'est pas' },
    { id: 'cmix44swy00qr8o6mr0qw5diz', title: 'Symboles mathématiques' },
    { id: 'cmix44by700q98o6m1o0w8l4o', title: 'Matière vers esprit • « contre l\'esprit du temps »' },
    { id: 'cmix3uxaf00f58o6m4mddfmlu', title: 'Reprendre d\'un autre déduit • intérêt' },
    { id: 'cmix4l7ai01h78o6mezbkyywx', title: 'BIA • « extrémité du monde » • désert' },
    { id: 'cmix3w7tp00gt8o6m7fyhgjki', title: '« Fête où se fiancent les dieux et les hommes »' },
    { id: 'cmix43b5x00ov8o6mx3qhvh8o', title: 'Caractères cryptiques' },
    { id: 'cmix3yubj00jf8o6m82361obp', title: 'Klein • besoin de compagnon • coin réduit' },
    { id: 'cmix42anm00nn8o6m3aakeudv', title: 'Lettres d\'affaires • bourrer une pipe' },
    { id: 'cmix4861000vz8o6m8pxe1ilg', title: 'After Kant, Sellars • Fabio Gironi • Contents' },
    { id: 'cmix3ulw700ep8o6moqe0r9ka', title: 'Résultats • reconnaître tous les types' },
]

async function main() {
    console.log('🎨 Titres page 8 (351-400)...\n')
    for (const t of titles) {
        try { await prisma.archiveNote.update({ where: { id: t.id }, data: { nodeLabel: t.title } }); console.log('✓') } catch (e) { console.log('✗') }
    }
    console.log('\n✅ Batch terminé!')
}
main().catch(console.error).finally(() => prisma.$disconnect())
