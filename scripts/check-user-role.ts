import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const userEmail = process.argv[2]

async function main() {
  if (!userEmail) {
    console.error('❌ Usage: npx tsx scripts/check-user-role.ts <email>')
    process.exit(1)
  }

  try {
    console.log(`🔍 Recherche de l'utilisateur: ${userEmail}`)
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        accounts: {
          select: {
            provider: true,
            providerAccountId: true
          }
        }
      }
    })

    if (!user) {
      console.log('❌ Utilisateur non trouvé en base de données')
      return
    }

    console.log('\n✅ Utilisateur trouvé en base:')
    console.log('📧 Email:', user.email)
    console.log('👤 Nom:', user.name || 'Non défini')
    console.log('🔑 Rôle:', user.role)
    console.log('📅 Créé:', user.createdAt.toLocaleDateString('fr-FR'))
    console.log('🔗 Comptes liés:', user.accounts.map(a => `${a.provider} (${a.providerAccountId})`).join(', ') || 'Aucun')
    
    // Vérification spécifique du rôle
    if (user.role === 'ADMIN') {
      console.log('\n🎯 ✅ Le rôle est correctement défini à ADMIN en base')
    } else {
      console.log(`\n⚠️  Le rôle actuel est "${user.role}" - devrait être "ADMIN"`)
      console.log('💡 Commande pour corriger:')
      console.log(`   UPDATE "User" SET role = 'ADMIN' WHERE email = '${userEmail}';`)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()