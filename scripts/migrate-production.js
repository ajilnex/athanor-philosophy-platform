#!/usr/bin/env node

/**
 * Script de migration production pour Vercel
 * Usage: node scripts/migrate-production.js
 */

const { exec } = require('child_process')
const path = require('path')

async function runCommand(command, description) {
  console.log(`🔄 ${description}...`)

  return new Promise((resolve, reject) => {
    const child = exec(command, {
      cwd: process.cwd(),
      env: { ...process.env },
    })

    child.stdout.on('data', data => {
      console.log(data.toString())
    })

    child.stderr.on('data', data => {
      console.error(data.toString())
    })

    child.on('close', code => {
      if (code === 0) {
        console.log(`✅ ${description} completed successfully`)
        resolve()
      } else {
        console.error(`❌ ${description} failed with code ${code}`)
        reject(new Error(`Command failed: ${command}`))
      }
    })
  })
}

async function main() {
  console.log('🚀 Starting production database migration...')
  console.log('📍 Current working directory:', process.cwd())

  // Vérifier les variables d'environnement
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set')
    process.exit(1)
  }

  console.log('🔗 Database URL:', process.env.DATABASE_URL.replace(/:([^@]+)@/, ':***@'))

  try {
    // 1. Générer le client Prisma
    await runCommand('npx prisma generate', 'Generating Prisma client')

    // 2. Appliquer les migrations
    await runCommand('npx prisma migrate deploy', 'Applying database migrations')

    // 3. Vérifier le statut
    await runCommand('npx prisma migrate status', 'Checking migration status')

    console.log('🎉 Production database migration completed successfully!')
  } catch (error) {
    console.error('💥 Migration failed:', error.message)
    process.exit(1)
  }
}

// Exécuter seulement si appelé directement
if (require.main === module) {
  main()
}

module.exports = { main }
