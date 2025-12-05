
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const archive = await prisma.conversationArchive.update({
        where: { slug: 'feu-humain' },
        data: { isPublic: true },
    })
    console.log('Archive updated:', archive)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
