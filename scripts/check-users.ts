import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Vérification des utilisateurs existants...\n')

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        hashedPassword: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé')
    } else {
      console.log(`📊 ${users.length} utilisateur(s) trouvé(s):\n`)
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Nom: ${user.name || 'Non défini'}`)
        console.log(`   Rôle: ${user.role}`)
        console.log(`   Mot de passe défini: ${user.hashedPassword ? '✅ Oui' : '❌ Non'}`)
        console.log(`   Créé le: ${user.createdAt.toLocaleString('fr-FR')}`)
        console.log('')
      })
    }
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
