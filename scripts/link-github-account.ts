import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const userEmail = 'aub.robert@gmail.com'
  
  try {
    console.log('🔗 Liaison du compte GitHub...')
    
    // 1. Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { accounts: true }
    })
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé')
      return
    }
    
    console.log(`👤 Utilisateur trouvé: ${user.name} (${user.email})`)
    console.log(`🔑 Rôle actuel: ${user.role}`)
    
    // 2. Vérifier si un compte GitHub est déjà lié
    const existingGitHubAccount = user.accounts.find(acc => acc.provider === 'github')
    if (existingGitHubAccount) {
      console.log('✅ Compte GitHub déjà lié')
      console.log(`   Provider Account ID: ${existingGitHubAccount.providerAccountId}`)
      return
    }
    
    // 3. Créer la liaison GitHub
    // Note: Vous devrez fournir votre GitHub ID
    const githubUserId = process.argv[2]
    if (!githubUserId) {
      console.log('❌ Usage: npx tsx scripts/link-github-account.ts <github-user-id>')
      console.log('💡 Pour trouver votre GitHub ID, allez sur: https://api.github.com/user (connecté)')
      return
    }
    
    await prisma.account.create({
      data: {
        userId: user.id,
        type: 'oauth',
        provider: 'github',
        providerAccountId: githubUserId,
        // Les autres champs peuvent être null pour une liaison manuelle
      }
    })
    
    console.log('✅ Compte GitHub lié avec succès!')
    console.log(`   GitHub User ID: ${githubUserId}`)
    console.log('🎯 Vous pouvez maintenant vous déconnecter et vous reconnecter')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()