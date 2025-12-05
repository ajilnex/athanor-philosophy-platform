
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const archive = await prisma.conversationArchive.update({
        where: { slug: 'feu-humain' },
        data: { title: "Feu l'humanité" },
    })
    console.log('Archive title fixed:', archive)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
