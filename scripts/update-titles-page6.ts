import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const titles = [
    // Page 6 - notes 251-300
    { id: 'cmix444wr00pp8o6m2oy95cgj', title: 'RN • « exprimer à haute voix » • politique' },
    { id: 'cmix4g37z01a58o6mba8ttnsp', title: 'Langage • mots et combinaisons • emploi' },
    { id: 'cmix4d9s4015r8o6mgpw5hrs3', title: 'Folie de l\'ami • cours et publications • silence' },
    { id: 'cmix4es6d017n8o6mj9isrk87', title: '« Toi par qui le soleil est humilié » • âme • regarder' },
    { id: 'cmix3jcvl002p8o6molxb1ru2', title: 'Feu et Cendres • succès et échec • politique • PhilPapers' },
    { id: 'cmix3x5op00hn8o6mbarm78b2', title: 'Psychanalyse • efficacité • n\'avait pas calmé' },
    { id: 'cmix3v0vo00fd8o6m5imjwksi', title: 'Réel = vrai • mot fabriqué • sens complet' },
    { id: 'cmix4a7br00zr8o6muk0ao7h4', title: 'Apparition • épanouissement • totalité' },
    { id: 'cmix489hu00w58o6mi3z06o1t', title: 'Post-Kantian thought • principle of thinking' },
    { id: 'cmix3webn00h58o6m2vsudjdv', title: 'Nietzsche • État grec • phantasme' },
    { id: 'cmix401n700kp8o6mqsqwvh9u', title: 'Lacan • Séminaire Sinthome • Joyce • interprétation' },
    { id: 'cmix3tjts00cz8o6mnhnh0bv0', title: 'Philosophe italien • quitte le terrain de la philosophie' },
    { id: 'cmix3uye700f78o6mv6tm9wsl', title: 'Lacan • « écrire le rapport sexuel » • effet du discours' },
    { id: 'cmix3uwdp00f38o6mdvjoog03', title: 'RAID BRI • savoir faire • adapter' },
    { id: 'cmix3uvdc00f18o6mo7njka27', title: 'Syndicats de police • « guerre » contre' },
    { id: 'cmix4kjiv01g18o6m6tfeomvh', title: 'Derrida • « J\'ai oublié mon parapluie » • dissimuler la vérité' },
    { id: 'cmix46sdq00tj8o6mjw01s2lp', title: 'Babelio • intelligible • analogies hypothétiques' },
    { id: 'cmix4jdgc01et8o6mcmpc9aib', title: 'Contaminated diversity • troubled stories • telling' },
    { id: 'cmix47kpf00ut8o6mmje0ur7e', title: 'Quentin Meillassoux • réalisme spéculatif • vertu' },
    { id: 'cmix3iswz001t8o6ma4bke051', title: 'Achever • superflu • tant il est' },
    { id: 'cmix43cx800oz8o6mqlmv7y67', title: 'Tartare • actions • prochaine vie • sous le' },
    { id: 'cmix4l9z801h98o6mimtmwb0f', title: 'Thémis • voûté par le travail • supporter' },
    { id: 'cmix45it600rt8o6mpqi3x7tp', title: 'Esprits humains • ensembles • Je humains' },
    { id: 'cmix3pbec00958o6m65lji62o', title: 'Taminiaux • jouissance de la beauté • tout au plus' },
    { id: 'cmix3uzc600f98o6m305u6qq4', title: 'Aristote • étant hors philosophie première • nombre' },
    { id: 'cmix3u2v700dt8o6m4vfmbrya', title: 'Laser à bord • informatique • idée' },
    { id: 'cmix4kne701g58o6mjq8i7f7c', title: 'Sarah Kofman • Derrida lecteur • Cairn' },
    { id: 'cmix45arm00rf8o6mktqrr1m2', title: 'Tillich • lettre • n\'ai répondu qu\'à vos questions' },
    { id: 'cmix48phv00wn8o6mfgep88d3', title: 'Jeu à somme nulle • puissance économique' },
    { id: 'cmix4m6ae01ip8o6mr02psb96', title: '« Si tu veux tu peux » • innombrables analyses' },
    { id: 'cmix3vim100g38o6mpr25mzmt', title: '« Pardonne ton œuvre » • Dieu clémence • courroucé' },
    { id: 'cmix3x2f100hj8o6mfh8wa3xw', title: 'Elohims • glébeux • « connaître le bien et le mal »' },
    { id: 'cmix3jdrf002r8o6mjvvi72db', title: 'Terre, Feu, Eau, Air • Mary Hoffman • PhilPapers' },
    { id: 'cmix3wfg100h78o6m1iv0g6a4', title: 'Servitude du grand nombre • affects • déplacement' },
    { id: 'cmix3w3ho00gn8o6mip8o393x', title: 'Solution cachée dans l\'énigme • pensée orientée' },
    { id: 'cmix3wbht00gx8o6mg8lg2nle', title: 'Deleuze • Logique du Sens • singularités • impassibilité genèse' },
    { id: 'cmix3pa9a00938o6mg2686ul1', title: 'Taminiaux • manifestation de la vérité' },
    { id: 'cmix41hvv00mp8o6mmaf3wd8e', title: 'Concept de l\'inconscient • relation • fonction • originel' },
    { id: 'cmix4leex01hh8o6mgwscd9pa', title: 'Lacan • médiation phallique du désir • rapport femme' },
    { id: 'cmix3lzic005h8o6m5mouci6q', title: 'Tout et partie • se comprendre mutuellement • ch. 49' },
    { id: 'cmix49tfg00yr8o6mjk6gsji8', title: 'Secret de l\'aventure inachevée • confusion • regarder' },
    { id: 'cmix3q5in009r8o6mqb5heg6e', title: 'Kant • Critique Faculté de Juger • objets beaux vs belles visions' },
    { id: 'cmix46tch00tl8o6m2c22pbsc', title: 'Lacan • prochaine fois • essentiel de la satisfaction' },
    { id: 'cmix3p7ox008z8o6mpq4lfg4f', title: 'Vienne • Lunes • accord nécessaire' },
    { id: 'cmix3la37004t8o6me7mt31a8', title: 'Sens historique • plébéien • incompréhensible' },
    { id: 'cmix3w9mu00gv8o6mctdhvjib', title: 'Intelligibles • véritable • principe d\'existence • homme' },
    { id: 'cmix3l27o004j8o6mv76jbv1f', title: 'Charles Ramond • Comptoir.org' },
    { id: 'cmix3i93h000v8o6mzkea1pd6', title: 'Italien en France • solitude • se plait' },
    { id: 'cmix4fdx3018j8o6mt7cp77nm', title: 'Dérivé important • attique • paragraphe' },
    { id: 'cmix3zb5400jt8o6mhxhb6zi5', title: 'Khôra = symbolique, metaxu • aperception de l\'absolu' },
]

async function main() {
    console.log('🎨 Titres page 6 (251-300)...\n')
    for (const t of titles) {
        try {
            await prisma.archiveNote.update({
                where: { id: t.id },
                data: { nodeLabel: t.title }
            })
            console.log('✓', t.title.substring(0, 45))
        } catch (e) {
            console.log('✗', t.id)
        }
    }
    console.log('\n✅ Batch terminé!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
