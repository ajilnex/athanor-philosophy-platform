import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const titles = [
    // Notes avec titres problématiques - dernière correction
    { id: 'cmix46dap00t18o6mq0zkpkcz', title: 'Symboles numériques' },
    { id: 'cmix49u1k00yt8o6m72lq3vd3', title: '« You always make me smile »' },
    { id: 'cmix3ufnf00eb8o6mfqrcwd2p', title: 'Paris 1 • Sorbonne • étudiant' },
    { id: 'cmix4bxtv013p8o6mlh1hv5nu', title: 'Interface cryptique' },
    { id: 'cmix4c3yn01418o6mel035jx7', title: 'Interface' },
    { id: 'cmix4fzl801a18o6moduic9f4', title: 'Lecture à partir de la page' },
    { id: 'cmix4c5s901458o6mrk5w5bl2', title: 'Interface' },
    { id: 'cmix3xpp100ih8o6m66tp2mkp', title: '« Voir la » • Juillet' },
    { id: 'cmix44dv000qd8o6mgupirj7c', title: 'Hofstadter • Surfaces and Essences • Analogie' },
    { id: 'cmix4c6v401478o6mkmctr9h9', title: 'Interface 2008' },
    { id: 'cmix400hv00kn8o6mbca014hh', title: '« Virage virgule » • lucidité' },
    { id: 'cmix4c4ri01438o6mjojr39sp', title: 'Interface 2008' },
    { id: 'cmix4bx5t013n8o6m8ojw4sr5', title: 'Big • interface' },
    { id: 'cmix3rjt600b98o6mge3hrfm8', title: 'Adrian Thaw' },
    { id: 'cmix4c0us013v8o6mbkka7ifd', title: 'Interface graphique' },
    { id: 'cmix3tv5a00dp8o6m3qzqhlz5', title: 'Echo Editions • Axél' },
    { id: 'cmix3qqkd00ab8o6mnb423hns', title: 'Instagram • @heyguillaume' },
    { id: 'cmix4byke013r8o6mx8ebc2z4', title: 'Interface design' },
    { id: 'cmix3rlfv00bd8o6m7q3x509h', title: 'Gonzaï • magazine' },
    { id: 'cmix4doe9016l8o6mltwitc1y', title: 'ChatGPT tricks' },
    { id: 'cmix4dpb2016n8o6mh8s5xskb', title: 'Pour vous' },
    { id: 'cmix4dnpc016j8o6mu3fsue71', title: 'ChatGPT tricks' },
    { id: 'cmix3tj1g00cx8o6m8zeywg93', title: 'Philomag • Livres' },
    { id: 'cmix3qacp009x8o6moh971wsc', title: 'Mix titre • Der Weg Zu Zweit' },
    { id: 'cmix489yj00w78o6msxs1nqdc', title: 'Lecture à partir de l\'album' },
]

async function main() {
    console.log('🎨 Correction des 25 derniers titres...\n')
    let count = 0
    for (const t of titles) {
        try {
            await prisma.archiveNote.update({ where: { id: t.id }, data: { nodeLabel: t.title } })
            count++
        } catch (e) { }
    }
    console.log(`✅ ${count} titres corrigés!`)
}
main().catch(console.error).finally(() => prisma.$disconnect())
