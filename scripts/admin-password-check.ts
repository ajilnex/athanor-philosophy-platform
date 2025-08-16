import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    const admin = await prisma.user.findFirst({
      where: {
        role: 'ADMIN',
        email: 'admin@athanor.com',
      },
    })

    if (!admin) {
      console.log('❌ Aucun admin trouvé avec cet email')
      return
    }

    if (!admin.hashedPassword) {
      console.log("❌ L'admin n'a pas de mot de passe défini")
      return
    }

    // Tester quelques mots de passe communs
    const commonPasswords = [
      'motdepassesecurise',
      'admin',
      'password',
      'admin123',
      'athanor',
      '123456',
    ]

    console.log('🔑 Test des mots de passe pour admin@athanor.com...\n')

    for (const password of commonPasswords) {
      const isMatch = await bcrypt.compare(password, admin.hashedPassword)
      if (isMatch) {
        console.log(`✅ TROUVÉ! Le mot de passe est: "${password}"`)
        return
      } else {
        console.log(`❌ "${password}" - incorrect`)
      }
    }

    console.log('\n⚠️  Aucun des mots de passe testés ne correspond.')
    console.log('   Essayez de vous souvenir du mot de passe utilisé.')
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
