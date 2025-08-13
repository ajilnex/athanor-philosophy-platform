import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function promoteUser() {
  const email = 'aub.robert@gmail.com'
  
  try {
    console.log(`🔑 Promotion de ${email} au rôle ADMIN...`)
    
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
      include: { accounts: true }
    })
    
    console.log('✅ Utilisateur promu avec succès!')
    console.log(`   Email: ${user.email}`)
    console.log(`   Nouveau rôle: ${user.role}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Comptes liés: ${user.accounts.map(a => `${a.provider}:${a.providerAccountId}`).join(', ')}`)
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

promoteUser()