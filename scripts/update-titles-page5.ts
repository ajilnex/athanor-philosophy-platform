import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const titles = [
    // Page 5 - notes 201-250
    { id: 'cmix4gztt01bn8o6m57oat063', title: 'Bibliothèque de Babel • « we have already entered » • écriture' },
    { id: 'cmix3m1fi005j8o6m9jaw44yx', title: 'Noétique • question difficile et discutée' },
    { id: 'cmix3utjb00ez8o6mt9lod9fu', title: 'Barthes • Être ascétique • coupable • être aimé' },
    { id: 'cmix3kloi00438o6mn6czk87x', title: '« Depuis les cimes » • bruni brûlé • saisir' },
    { id: 'cmix3iq2a001n8o6mb4ilk5ee', title: 'Blanchot • La Part du Feu • vieux siècles • secrète' },
    { id: 'cmix3vyj800gf8o6ml2gyfd1c', title: 'Fonction essentielle • forme • remplir' },
    { id: 'cmix3vghz00g18o6ml7oqsi34', title: 'Lacan • case vide • défaut • pièce en trop' },
    { id: 'cmix3w07x00gh8o6mp4wej1p6', title: 'Changement de qualité à 0° • question mal posée' },
    { id: 'cmix3vw7200gd8o6mbg6u429d', title: 'Espace ouvert vs fermé • se répartir • nomade' },
    { id: 'cmix45x8e00sb8o6mee12d9jl', title: 'Plotin • êtres intelligibles • vertu • accord et ordre' },
    { id: 'cmix3wq3n00hd8o6mdcvylp6u', title: 'Lacan • génération du graphe • sujet et signifiant' },
    { id: 'cmix3u6wo00dx8o6mamld54x1', title: 'Chat • « miaule, ronronne et me ressemble » • esprit' },
    { id: 'cmix4kr8o01gb8o6meolr9681', title: 'Acoustique • simple et double parois • modèle' },
    { id: 'cmix488mn00w38o6m45a4mdal', title: 'Derrida • Le Parjure et le pardon • séminaire Pantin' },
    { id: 'cmix3qj9300a58o6mpnb93l5h', title: 'Phénoménologie • imaginent • imagination' },
    { id: 'cmix40gi700l98o6muocs8u6l', title: 'Lacan • Réel • élément ajouté • occasion' },
    { id: 'cmix48cn900wb8o6mleh4sjjn', title: 'Framework of givenness • world and mind • cognition' },
    { id: 'cmix461l900sh8o6mwbkbjauo', title: 'Duende • ni demandé ni mérité • 1987' },
    { id: 'cmix408xl00kz8o6ml5fg2jd6', title: 'Lacan • principe du plaisir • par la suite' },
    { id: 'cmix3jz77003b8o6mqyr4y7fh', title: 'Concepts philosophiques • rien d\'erratique • développement' },
    { id: 'cmix46q8200td8o6m5yo215gt', title: 'Denys l\'Aréopagite • théologie mystique • Trinité suressentielle' },
    { id: 'cmix4mp1u01jj8o6mhinh14ie', title: 'Public « constamment son tort » • se sentir' },
    { id: 'cmix4fhx6018r8o6m9zmyojty', title: 'Mike Kelley • The Futurist Ballet • 1973 • happening' },
    { id: 'cmix4gt8a01bh8o6mppf4uu3t', title: 'Histoire • déshonneur • crainte • manifeste' },
    { id: 'cmix48b7u00w98o6mwc25ut91', title: 'Augustin illuminatio • positivist data • Sellars 1963' },
    { id: 'cmix46yft00tv8o6mohaowsxm', title: 'Lacan • libido • énergétique' },
    { id: 'cmix45jvu00rv8o6mmfszpdd2', title: 'Accessoire de l\'analyse • un des fondamentaux' },
    { id: 'cmix3swzf00ch8o6mf73kyrml', title: '« Vieux et charmants fous » • peur devant Eux' },
    { id: 'cmix48l2q00wj8o6mezxajaxu', title: 'McDowell • expérience • conceptuel • extrêmement original' },
    { id: 'cmix4gbyv01an8o6mv9jpy3dg', title: 'Fuite volontaire • discussion • richesse' },
    { id: 'cmix3sbl200bz8o6m21cfgsf5', title: 'Freud • Au-delà • protection anti-stimuli impossible' },
    { id: 'cmix4jzbz01fj8o6mrayavtt8', title: 'Thomas d\'Aquin • verum, bonum • Question 21' },
    { id: 'cmix46xdy00tt8o6mma5wnlih', title: 'Lacan • Symbolique, Imaginaire, Réel • phase • dommages' },
    { id: 'cmix44agj00q58o6mwjvxjr95', title: 'Ideasthesia • art theory • implications' },
    { id: 'cmix3u84t00dz8o6mho0ltz3z', title: 'Voyageur • trompé de chemin • s\'éloigne' },
    { id: 'cmix3w1up00gj8o6mfmxauevm', title: 'Hölderlin • éclair signe d\'élection • 4 décembre 1801 • Böhlendorff' },
    { id: 'cmix4in1w01e58o6mg30a6bgm', title: 'Hegel • suffisamment fait' },
    { id: 'cmix3ud3e00e58o6mgjhp54e1', title: 'Philippe Descola • lieux alternatifs • expérimentations' },
    { id: 'cmix4e0rr016x8o6mq5dc5wpq', title: 'Théorie des catastrophes • carte du sens • Lacan Maître' },
    { id: 'cmix3tms600d58o6m1s5n9igp', title: 'Pline • jour en jour plus évident • Cairn' },
    { id: 'cmix4jilp01f18o6m1x4u3fiz', title: 'Exotisme • chose et envers' },
    { id: 'cmix4fpg9019f8o6mmj8bfgkt', title: 'Philosophie platonicienne • illusion du sensible' },
    { id: 'cmix4b6l2011j8o6md2o2kq0e', title: 'Feelings • no control • responsibility' },
    { id: 'cmix4hvz201d58o6mo396is6p', title: 'Resulting form • success in task • following' },
    { id: 'cmix48w5t00x18o6mh3dj3818', title: 'Bois • tableau • couleur • phonème • œuvre musicale' },
    { id: 'cmix3x4hm00hl8o6mqmpx13r8', title: 'Caïn • offrande • « cela brûle beaucoup » • faces tombent' },
    { id: 'cmix4a6ci00zp8o6mvcdzzjhp', title: 'Victoire défaite • endurance ruine • destinée humaine' },
    { id: 'cmix4j7va01el8o6moryjxlgv', title: '« En toi plus que toi » • position limite • l\'homme ne peut' },
    { id: 'cmix4izpz01ef8o6mvsoj86d4', title: '« En toi plus que toi » • position limite • saisir' },
    { id: 'cmix4ad1s00zz8o6m4ll6jzti', title: 'Feminist struggles • Ghandian ideologies • absurd mystical' },
]

async function main() {
    console.log('🎨 Titres page 5 (201-250)...\n')
    for (const t of titles) {
        try {
            await prisma.archiveNote.update({
                where: { id: t.id },
                data: { nodeLabel: t.title }
            })
            console.log('✓', t.title.substring(0, 50))
        } catch (e) {
            console.log('✗', t.id)
        }
    }
    console.log('\n✅ Batch terminé!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
