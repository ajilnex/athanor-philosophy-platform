import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const titles = [
    // Page 7 - notes 301-350
    { id: 'cmix42swa00o98o6mw4xoaov2', title: 'Boule de feu • fumée • explosion' },
    { id: 'cmix3jol200318o6mkoswwi9g', title: 'Meilleur • puisqu\'elle' },
    { id: 'cmix3scql00c18o6m6d1nrgab', title: 'Pierre Troullier • S\'ENFLAMME' },
    { id: 'cmix4hdk401cj8o6mv5jvofv2', title: 'Feedback • concept crucial • understand' },
    { id: 'cmix3rfqn00b38o6mywl75dez', title: 'Freud • Le mot d\'esprit • relation à l\'inconscient' },
    { id: 'cmix3syom00cj8o6muq1xgzks', title: 'Conflit • contenu • pourtant indis' },
    { id: 'cmix4h24401br8o6m0ogsvegv', title: 'Stendhal • divine impatience • livres' },
    { id: 'cmix4ht0e01d18o6m0ktbc4lt', title: 'Inquiétude • certaine' },
    { id: 'cmix4hri101cx8o6mo8451m9h', title: 'Résister à la pente de la n... • tard s\'appuyer' },
    { id: 'cmix4gqjs01bd8o6mpsn8qm7x', title: 'Groupe • s\'exprimer • faire quelque chose ensemble' },
    { id: 'cmix3msdb00698o6mqnuom8ya', title: 'Image de lui-même • immédiatement substance' },
    { id: 'cmix4470z00px8o6m80zzkyod', title: 'Identity of a general item • new picture' },
    { id: 'cmix42hct00nz8o6m3itjdlnr', title: '« Je me suis demandé aujourd\'hui » • en clair' },
    { id: 'cmix45czz00rj8o6m2blkvw37', title: 'Tillich • connaissance de soi essentielle' },
    { id: 'cmix4008500kl8o6mwp6ht6hb', title: '« J\'en reparlerais cette année » • effort' },
    { id: 'cmix3vb8300fv8o6m6e0wvmrv', title: 'Correspondances • cryptique' },
    { id: 'cmix441mf00pn8o6mw3st571w', title: 'Lacan • côté homme • « il existe un x » • phi de x' },
    { id: 'cmix3ul4700en8o6ml834hvg1', title: 'Turbulence des fluides • mise en abîme tourbillonnaire' },
    { id: 'cmix3x11900hh8o6mu94d1jv5', title: 'Genèse • « poussière tu retourneras » • Adam appela' },
    { id: 'cmix3hzay000h8o6mmv634v1z', title: 'Philosophie supérieure • plus facile de réfuter' },
    { id: 'cmix4grfz01bf8o6mtj5y8kdz', title: 'Nuit • fin de l\'été • goûter la succession' },
    { id: 'cmix4h0pq01bp8o6mj2biqm55', title: 'Souvenir confus • elle-même • ne peut trouver' },
    { id: 'cmix4h6l101c18o6mwrhykquq', title: 'Maine de Biran • beaux-arts • glisser de la réalité' },
    { id: 'cmix3itql001v8o6m09t4z06s', title: 'Mallarmé • « épars frémissement d\'une page »' },
    { id: 'cmix3xd2200hx8o6mylq2ccuk', title: 'Théorie sexuelle • étage du bas • succéder' },
    { id: 'cmix3v6ht00fp8o6mkul28ejg', title: 'Rêves • illusions qui surgissent' },
    { id: 'cmix3zuyu00kd8o6m6jj2pjcz', title: '« Jeu de flamme et de feu » • bien comprendre' },
    { id: 'cmix4h4rn01bx8o6maaw9alqv', title: 'Couleurs les plus brillantes • début' },
    { id: 'cmix3ueoo00e78o6mzft6d5zg', title: 'Le Monde • Adaptation Forêt • science se penche' },
    { id: 'cmix3u5fe00dv8o6m1ybyj7kx', title: 'Harvard-Smithsonian • chercheurs • « que se passe-t-il »' },
    { id: 'cmix3tpt000dd8o6mt0dbbz3r', title: 'ChatGPT • réponse courte • 36 caractères' },
    { id: 'cmix45bn500rh8o6mvjozdvhz', title: 'Théorie du concept • développement • dépendre' },
    { id: 'cmix47xha00vb8o6m8chudyzh', title: 'Décennie 2020 • dernier chapitre • seulement' },
    { id: 'cmix4ezos017x8o6mu0j0cwgh', title: 'Mort • valeur en soi • « ne se laisse pas jauger »' },
    { id: 'cmix3k34d003f8o6m4e59au7a', title: 'Spinoza • causa sui • « belle contradiction interne »' },
    { id: 'cmix3v1r500ff8o6msxwdwlya', title: 'Esprit de la forêt • sept jours sept nuits • tambours' },
    { id: 'cmix3l8zj004r8o6m05u7946j', title: 'Hiérarchie céleste • manuscrit médiéval 1400' },
    { id: 'cmix4eys5017v8o6mezl7va5e', title: 'Spiritualisation de la mort • phénomène naturel' },
    { id: 'cmix4jbzv01er8o6mze4jweqp', title: 'Cryptique • caractères' },
    { id: 'cmix3liuz00578o6mcvesufgg', title: 'Zénon • impossibilité du mouvement • Aristote rejette' },
    { id: 'cmix4fo8v019b8o6m04tsjd4j', title: 'Kelly Blaser • dharmabridge • audio' },
    { id: 'cmix42c1800nr8o6m0a6ht46u', title: 'Changement essentiel • se jeter encore' },
    { id: 'cmix41gra00mn8o6mcyxzsb6z', title: 'Structures • on parle mal dans l\'analyse' },
    { id: 'cmix4h5kc01bz8o6mtzy4zqmk', title: 'Harmonie suave • beautés • il nomme lui-même' },
    { id: 'cmix3irow001r8o6mzn9lf4d9', title: 'Incendie mortel à Vincennes • Le Monde' },
    { id: 'cmix4fy52019v8o6mbm3a2g68', title: 'Il Fuoco • Le Feu • note' },
    { id: 'cmix4hs4f01cz8o6mzhl00v85', title: 'Univers liquide • encore quelque temps' },
    { id: 'cmix4extf017t8o6mm8f51btm', title: 'Mort naturelle • fin d\'un cycle • esprit' },
    { id: 'cmix4dlp7016f8o6mu8heysmd', title: 'Gender • Female Male Agender Androgyne Bigender' },
    { id: 'cmix45dt500rn8o6my679fsn8', title: 'Connaissance de soi • lettre à Tillich • concepts' },
]

async function main() {
    console.log('🎨 Titres page 7 (301-350)...\n')
    for (const t of titles) {
        try {
            await prisma.archiveNote.update({ where: { id: t.id }, data: { nodeLabel: t.title } })
            console.log('✓', t.title.substring(0, 40))
        } catch (e) { console.log('✗', t.id) }
    }
    console.log('\n✅ Batch terminé!')
}
main().catch(console.error).finally(() => prisma.$disconnect())
