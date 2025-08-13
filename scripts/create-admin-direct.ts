import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: 'aub.robert@gmail.com' }
    })

    if (existingUser) {
      console.log('👤 Utilisateur existant trouvé, mise à jour du rôle...')
      
      const updated = await prisma.user.update({
        where: { email: 'aub.robert@gmail.com' },
        data: { role: 'ADMIN' }
      })
      
      console.log('✅ Utilisateur promu ADMIN:')
      console.log(`   Email: ${updated.email}`)
      console.log(`   Rôle: ${updated.role}`)
      return
    }

    // Créer un nouveau compte admin
    console.log('🆕 Création d\'un nouveau compte admin...')
    
    // Hash d'un mot de passe temporaire
    const tempPassword = 'admin2025'
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    const newAdmin = await prisma.user.create({
      data: {
        email: 'aub.robert@gmail.com',
        name: 'Aubin Robert',
        role: 'ADMIN',
        hashedPassword: hashedPassword,
      },
    })

    console.log('✅ Nouveau compte admin créé:')
    console.log(`   ID: ${newAdmin.id}`)
    console.log(`   Email: ${newAdmin.email}`)
    console.log(`   Nom: ${newAdmin.name}`)
    console.log(`   Rôle: ${newAdmin.role}`)
    console.log(`   Mot de passe temporaire: ${tempPassword}`)
    console.log('')
    console.log('🔑 Pour te connecter:')
    console.log(`   Email: aub.robert@gmail.com`)
    console.log(`   Mot de passe: ${tempPassword}`)
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()