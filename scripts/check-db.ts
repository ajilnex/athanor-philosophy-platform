
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const archive = await prisma.conversationArchive.findUnique({
        where: { slug: 'feu-humain' },
    })
    console.log('Archive found:', archive)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
