const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    const email = 'admin@athanor.com'
    const password = 'admin123'
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      console.log('✅ Utilisateur admin existe déjà:', email)
      return
    }
    
    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Créer l'utilisateur admin
    const admin = await prisma.user.create({
      data: {
        email,
        name: 'Admin',
        hashedPassword,
        role: 'ADMIN'
      }
    })
    
    console.log('✅ Utilisateur admin créé avec succès!')
    console.log('📧 Email:', email)
    console.log('🔑 Mot de passe:', password)
    console.log('⚠️  Changez ce mot de passe après la première connexion!')
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()