const { execSync } = require('child_process')

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database tables...')

    // Push the database schema
    execSync('npx prisma db push', { stdio: 'inherit' })

    console.log('✅ Database setup completed successfully!')
  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    // Don't exit with error - let the build continue
    console.log('⚠️  Continuing build without database setup...')
  }
}

setupDatabase()
