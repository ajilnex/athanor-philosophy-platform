import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Vérification des utilisateurs GitHub...\n')
    
    // Voir tous les utilisateurs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        accounts: {
          select: {
            provider: true,
            providerAccountId: true
          }
        }
      }
    })
    
    console.log(`📊 Total: ${users.length} utilisateur(s)\n`)
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Utilisateur:`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Nom: ${user.name || 'Non défini'}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Rôle: ${user.role}`)
      console.log(`   Créé: ${user.createdAt.toLocaleDateString('fr-FR')}`)
      
      if (user.accounts.length > 0) {
        console.log(`   Comptes connectés:`)
        user.accounts.forEach(account => {
          console.log(`     - ${account.provider} (ID: ${account.providerAccountId})`)
        })
      }
      console.log('')
    })
    
    // Trouver l'utilisateur GitHub spécifique
    const githubUser = users.find(u => u.email === 'aub.robert@gmail.com')
    
    if (githubUser) {
      console.log('🎯 Utilisateur GitHub trouvé:')
      console.log(`   Email: ${githubUser.email}`)
      console.log(`   Rôle actuel: ${githubUser.role}`)
      
      if (githubUser.role !== 'ADMIN') {
        console.log('\n⚠️  Cet utilisateur n\'est pas ADMIN')
        console.log('📝 Commande pour le promouvoir:')
        console.log(`UPDATE "User" SET role = 'ADMIN' WHERE email = '${githubUser.email}';`)
      } else {
        console.log('\n✅ Cet utilisateur est déjà ADMIN')
      }
    } else {
      console.log('❌ Utilisateur aub.robert@gmail.com non trouvé')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()