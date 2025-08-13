import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Correction du rôle admin pour GitHub user...\n')
  
  const email = 'aub.robert@gmail.com'
  
  try {
    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true }
    })
    
    if (!existingUser) {
      console.log(`❌ Utilisateur ${email} non trouvé`)
      console.log('💡 Connectez-vous d\'abord avec GitHub pour créer le compte')
      return
    }
    
    console.log(`✅ Utilisateur trouvé: ${existingUser.name} (${existingUser.email})`)
    console.log(`📝 Rôle actuel: ${existingUser.role}`)
    console.log(`🔗 Comptes liés: ${existingUser.accounts.map(a => a.provider).join(', ')}`)
    
    if (existingUser.role === 'ADMIN') {
      console.log(`✅ L'utilisateur est déjà ADMIN`)
    } else {
      // Promouvoir au rôle ADMIN
      const updatedUser = await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN' }
      })
      
      console.log(`🎉 Utilisateur promu au rôle ADMIN`)
      console.log(`📊 Nouveau rôle: ${updatedUser.role}`)
    }
    
    console.log('\n📝 Étapes suivantes:')
    console.log('1. Déconnectez-vous complètement')
    console.log('2. Videz les cookies du navigateur')
    console.log('3. Reconnectez-vous avec GitHub')
    console.log('4. Accédez à /admin')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()