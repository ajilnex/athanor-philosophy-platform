import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const titles = [
    // Pages 10-12 - notes 451-500
    { id: 'cmix3v2if00fh8o6ma30bcht1', title: 'Platon Théétète • nom • celui-ci' },
    { id: 'cmix48ngb00wl8o6m14sl1i6y', title: 'Symboles cryptiques' },
    { id: 'cmix4fmg201998o6m3a016v3j', title: 'Onelove sacredcenter • Hill • Bless' },
    { id: 'cmix3rkzy00bb8o6mxyds3g73', title: 'Capture d\'écran' },
    { id: 'cmix4m92v01iz8o6me0llxfib', title: 'Meme • « checking to see if the... »' },
    { id: 'cmix4dguz01678o6mqmgv011r', title: '« Mon ambiguïté sur la Négritude »' },
    { id: 'cmix4krw801gd8o6mu6xujnod', title: 'James B L Hollands • commentaire' },
    { id: 'cmix3ofdh00898o6mzj6p6ghg', title: '« Coup de tonnerre dans la tech »' },
    { id: 'cmix4fq87019h8o6m3w2n51kb', title: 'Goose Blues • Belleruc' },
    { id: 'cmix4absd00zx8o6mdb4e4c8r', title: 'Nature of what is beyond appearance' },
    { id: 'cmix3z38l00jn8o6mjk7fzunj', title: 'Réalité • Cryptique' },
    { id: 'cmix3umpi00er8o6mh3et02fm', title: 'Rechercher' },
    { id: 'cmix3zq2w00k38o6m28yl1jmo', title: '« Séduction qu\'exerce le narcissisme »' },
    { id: 'cmix4ma2n01j18o6m9pe7y75b', title: 'Meme • checking' },
    { id: 'cmix49esk00yb8o6m0octixbo', title: 'Publications en Dionysiaque' },
    { id: 'cmix4jgg901ez8o6mchhyyqyr', title: 'Détails' },
    { id: 'cmix4jf6001ex8o6mhffcefia', title: 'SHOTGUN Conf' },
    { id: 'cmix3tohx00db8o6mdpoydkp4', title: 'Climat • Rechercher' },
    { id: 'cmix49aai00xr8o6msi9spp5g', title: 'Moloko • Sing It Back' },
    { id: 'cmix4fx6i019t8o6m9049l3y7', title: 'Luce • 13-11' },
    { id: 'cmix3p6ly008x8o6m0hi04rp5', title: 'CNRS EDITIONS • MITA' },
    { id: 'cmix47v4h00v38o6mc3ztwhsu', title: 'TEA • Capture' },
    { id: 'cmix4dgd101658o6mj6rp9t8y', title: 'Christian Jaccard • « Par le feu tout change »' },
    { id: 'cmix49wy900z98o6my2f7o7w3', title: 'Aya Koda • Wikipédia' },
    { id: 'cmix3iovc001l8o6m571l8pt2', title: 'Hölderlin • « Aux mortels il convient de parler avec retenue »' },
    { id: 'cmix3ug7c00ed8o6m6sopvw61', title: '« Notre mère hochait la tête »' },
    { id: 'cmix47lbp00uv8o6mubo2iubq', title: '« Cela m\'a réveillée! J\'ai pris... »' },
    { id: 'cmix4gddb01ap8o6mlambnhjh', title: 'Symboles cryptiques' },
    { id: 'cmix44f1w00qf8o6mbamdc5ht', title: 'Interface cryptique' },
    { id: 'cmix48wmw00x38o6m604dwxqc', title: 'Heidegger • Holz = Wald • « vieux nom pour forêt »' },
    { id: 'cmix4248w00nb8o6mccqkbyga', title: 'Suggestions' },
    { id: 'cmix4gega01ar8o6mkdl9w0ku', title: '« Et si les trous noirs... »' },
    { id: 'cmix465vd00sn8o6m2giq6jaz', title: 'Bergson • « L\'intuition c\'est voir d\'un seul coup »' },
    { id: 'cmix49vjg00z78o6m0qu5jecj', title: '« Avant de se suicider, un couple... »' },
    { id: 'cmix492z700x98o6m4k45ya8z', title: 'Suicide couple • jeudi' },
    { id: 'cmix47d3b00ud8o6m9eeh06nb', title: '« Plaines autrefois verdoyantes »' },
    { id: 'cmix3j1za00278o6mt4cwitj4', title: 'Durkheim • Principes sociologie générale • Esprit' },
    { id: 'cmix3vkpl00g58o6mgkfkn3ar', title: 'Traduction • Français-Latin' },
    { id: 'cmix3tqvl00df8o6ms4q4k34l', title: 'Plus d\'articles' },
    { id: 'cmix4bti6013h8o6mimfgc906', title: 'Interface' },
    { id: 'cmix4bngt01358o6mjf2uorcq', title: 'Interface' },
    { id: 'cmix3ttdm00dj8o6m2din34er', title: 'Cryptique • vues' },
    { id: 'cmix4bzq6013t8o6mkmd44olt', title: 'Interface' },
    { id: 'cmix4h84x01c78o6m8atxqac5', title: 'Femina • étymologie grecque' },
    { id: 'cmix47fxu00uh8o6mf3mbuakk', title: 'Capture' },
]

async function main() {
    console.log('🎨 Titres pages 10-12 (451-500)...\n')
    for (const t of titles) { try { await prisma.archiveNote.update({ where: { id: t.id }, data: { nodeLabel: t.title } }); console.log('✓') } catch (e) { console.log('✗') } }
    console.log('\n✅ Batch terminé!')
}
main().catch(console.error).finally(() => prisma.$disconnect())
