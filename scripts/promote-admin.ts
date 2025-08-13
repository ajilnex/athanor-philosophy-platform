import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  
  if (!email) {
    console.log('❌ Usage: npx ts-node scripts/promote-admin.ts <email>')
    process.exit(1)
  }

  try {
    console.log(`🔍 Recherche de l'utilisateur: ${email}`)
    
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.log(`❌ Utilisateur avec l'email "${email}" non trouvé`)
      console.log('💡 Assure-toi de te connecter une première fois via GitHub')
      return
    }

    if (user.role === 'ADMIN') {
      console.log(`✅ L'utilisateur "${email}" est déjà ADMIN`)
      return
    }

    console.log(`📊 Utilisateur trouvé:`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Nom: ${user.name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Rôle actuel: ${user.role}`)
    
    // Promotion
    console.log(`\n🚀 Promotion en ADMIN...`)
    
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    })

    console.log(`✅ SUCCESS! ${email} est maintenant ADMIN`)
    console.log(`   Nouveau rôle: ${updatedUser.role}`)
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()