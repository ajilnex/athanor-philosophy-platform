const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function seedTestUser() {
  try {
    // Hash pour le mot de passe "admin123"
    const hashedPassword = '$2b$10$K8pF7JlWl.Qn7oI5gKQCa.5pPP5LbqWG9r9vQOJQOi5hGkVH5fMXm'

    const user = await prisma.user.upsert({
      where: { email: 'admin@athanor.com' },
      update: { role: 'ADMIN' },
      create: {
        id: 'admin-test-user',
        email: 'admin@athanor.com',
        role: 'ADMIN',
        hashedPassword: hashedPassword,
        name: 'Admin Test',
      },
    })

    console.log('✅ Test admin user created:', user.email)
  } catch (error) {
    console.error('❌ Error creating test user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedTestUser()
