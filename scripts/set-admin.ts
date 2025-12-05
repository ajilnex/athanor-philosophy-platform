
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'aub.robert@gmail.com'
    const user = await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN' },
    })
    console.log('User promoted to ADMIN:', user)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
