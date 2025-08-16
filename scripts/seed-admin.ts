import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    // Vérifier si un admin existe déjà
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    })

    if (existingAdmin) {
      console.log('Un administrateur existe déjà.')
      return
    }

    // Créer le hash du mot de passe
    const hashedPassword = await bcrypt.hash('motdepassesecurise', 12)

    // Créer l'utilisateur admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@athanor.app',
        hashedPassword: hashedPassword,
        role: 'ADMIN',
        name: 'Administrateur',
      },
    })

    console.log('✅ Utilisateur administrateur créé:')
    console.log('   Email:', admin.email)
    console.log('   Mot de passe: motdepassesecurise')
    console.log('   ID:', admin.id)
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'administrateur:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
