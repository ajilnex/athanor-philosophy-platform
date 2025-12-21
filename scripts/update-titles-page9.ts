import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const titles = [
    // Page 9 - notes 401-450
    { id: 'cmix4ddyt015x8o6mc36ci9mo', title: '« Comment aimer quand on a les mains enflammées » • liste' },
    { id: 'cmix3tl3z00d18o6mbit5co0b', title: 'Frankenstein • histoire littéraire' },
    { id: 'cmix3wcjc00gz8o6mciwhj2ke', title: 'Surface reprend • quelque' },
    { id: 'cmix3oamk007z8o6mdmuksqo1', title: 'Mallarmé • « chevelure vol d\'une flamme » • désirs' },
    { id: 'cmix425ga00nd8o6mzou1pkdw', title: 'Inconnu s\'apprête à disparaître' },
    { id: 'cmix45fxm00rp8o6m0ckk07g2', title: 'Symboles mathématiques' },
    { id: 'cmix4496v00q38o6motpl4cog', title: 'Catelyn Renvile • Conclusion • page 61/65' },
    { id: 'cmix46ef400t38o6mfvlsismx', title: 'Luigi Pareyson • Google' },
    { id: 'cmix3p2ug008t8o6makt1xdxh', title: 'Monde mythique primordial • ne faudrait-il pas' },
    { id: 'cmix46uqb00tn8o6mb94blpgm', title: 'Essence le visuel • rapport de l\'apparent' },
    { id: 'cmix3nv31007d8o6mubzjbcnt', title: 'La logique est donc elle • § 98' },
    { id: 'cmix3v52l00fn8o6mnjd22esh', title: 'Platon L\'Étranger • « ce que nous disons être réellement »' },
    { id: 'cmix44onb00qn8o6mn0vdwmiv', title: 'Mediapart • Proche-Orient • « On ne »' },
    { id: 'cmix448f300q18o6mugzrctdf', title: 'Conclusion • My proposal retains important' },
    { id: 'cmix41f5e00mj8o6mpillb4rp', title: '« La manière dont nous hypostasions » • § 31' },
    { id: 'cmix3v7d400fr8o6mwp65f0fn', title: 'Platon Théétète • L\'Étranger • technique' },
    { id: 'cmix4k1xb01fn8o6m1vfwebok', title: 'Nietzsche • « Ne suis-je plus qu\'oreille »' },
    { id: 'cmix3v98f00ft8o6mfy0qapq9', title: 'Capture d\'écran' },
    { id: 'cmix43zv900pj8o6m4vw93u5e', title: '« Formuler adéquatement » • dans la mesure où' },
    { id: 'cmix4b7n0011n8o6ma9g9h6dl', title: 'Render his motivation • out' },
    { id: 'cmix4g9b401ad8o6mcbrmej6a', title: 'Quête d\'identité • découverte sexualité • traditions' },
    { id: 'cmix47f6600uf8o6mwitq4ec6', title: 'ENFERS • ARMES • INFERNAL' },
    { id: 'cmix447sp00pz8o6mwg2ystvn', title: 'To sum up, our analysis • Catelyn Renvile' },
    { id: 'cmix3lht500558o6mnvowuy76', title: 'Héraclite • « Pour les âmes, devenir humides - plaisir »' },
    { id: 'cmix4l5p301h58o6mzo0kreme', title: 'Prométhée • représenté • première au Théâtre' },
    { id: 'cmix3rp8r00bh8o6mw20yrdvm', title: 'Instagram • Mediapart' },
    { id: 'cmix4i8a301dt8o6mqf4cv2ul', title: 'Philosophie bouddhiste • jeune garçon moine' },
    { id: 'cmix4fv36019p8o6mimktfp0w', title: 'Tel Quel • premier regard • esprit' },
    { id: 'cmix4dmy1016h8o6m4z0mvavl', title: '« Ce qui est écrit sur mes papiers »' },
    { id: 'cmix3u9ep00e18o6m4fgiy4lw', title: 'Nowspacetime • suggestions' },
    { id: 'cmix3v42k00fl8o6mvf0nqlkc', title: '« Celui qui n\'est pas réfuté, même Roi »' },
    { id: 'cmix3yv8j00jh8o6muc1phr0g', title: 'Ancien • premier texte probablement' },
    { id: 'cmix4dfle01638o6m8idno41z', title: '« Ils ne sauront plus ce que ça veut dire la mort »' },
    { id: 'cmix4jndn01f58o6mfr5htw2c', title: '« Les fausses idées que nous avons des créatures »' },
    { id: 'cmix3ihz000198o6m5yej3mir', title: 'Fire of Love • docu • Télé/Cinéma' },
    { id: 'cmix3rjae00b78o6mvavi4hdz', title: 'Plus d\'articles NTSC' },
    { id: 'cmix4jx0v01fd8o6mm1gaw0dx', title: 'Kant • Logique transcendantale • Introduction' },
    { id: 'cmix3iqxx001p8o6mjsjgspdl', title: 'Zeus laser surpuissant' },
    { id: 'cmix49sm900yp8o6m0wzhqk65', title: 'Cryptique' },
    { id: 'cmix3lh2000538o6m5ixtxgjs', title: 'Héraclite • « L\'un, le Sage, ne veut pas » • nom' },
    { id: 'cmix3t2n000cn8o6m323d8vm9', title: 'Breaking Bad • drame heideggérien' },
    { id: 'cmix40q0n00ll8o6m0myl4li7', title: '« Runes, des Barres pleines de sens »' },
    { id: 'cmix4debv015z8o6m6j1atyox', title: 'Génération d\'humains • cicatrices' },
    { id: 'cmix4jxg801ff8o6mwtor3b7x', title: 'Entendement • naissance • la manière dont nous' },
    { id: 'cmix3xktg00i98o6mw5u4oitb', title: 'Rhétorique • vérité en personne' },
    { id: 'cmix4g6y501a98o6mul3kl8rh', title: 'Techno • Plus d\'articles' },
    { id: 'cmix3xbn600hv8o6m73tkjx9d', title: 'Détour par la voie de l\'intellect' },
    { id: 'cmix3iudv001x8o6m4mm4vwyi', title: 'Blanchot • La Part du Feu • « attirance supérieure » • jeu' },
    { id: 'cmix3v35n00fj8o6m153hgtx9', title: 'Platon L\'Étranger • clair • je ne vois' },
    { id: 'cmix446dv00pv8o6mntphwnwm', title: 'Meaning of the word "red" • once some general' },
]

async function main() {
    console.log('🎨 Titres page 9 (401-450)...\n')
    for (const t of titles) { try { await prisma.archiveNote.update({ where: { id: t.id }, data: { nodeLabel: t.title } }); console.log('✓') } catch (e) { console.log('✗') } }
    console.log('\n✅ Batch terminé!')
}
main().catch(console.error).finally(() => prisma.$disconnect())
