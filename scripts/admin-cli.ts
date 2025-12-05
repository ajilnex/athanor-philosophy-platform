#!/usr/bin/env npx tsx
/**
 * Unified Admin CLI
 * Replaces: set-admin.ts, promote-admin.ts, seed-admin.ts, create-admin-direct.ts, 
 *           promote-user-admin.ts, github-admin-fix.ts
 * 
 * Usage:
 *   npx tsx scripts/admin-cli.ts list              # List all users
 *   npx tsx scripts/admin-cli.ts promote <email>   # Promote user to ADMIN
 *   npx tsx scripts/admin-cli.ts demote <email>    # Demote user to USER
 *   npx tsx scripts/admin-cli.ts create <email> <password>  # Create new admin
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const COMMANDS = {
    list: 'List all users with their roles',
    promote: 'Promote a user to ADMIN by email',
    demote: 'Demote an ADMIN to USER by email',
    create: 'Create a new admin user with email and password',
    help: 'Show this help message'
}

async function listUsers() {
    const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
    })

    console.log('\n📋 All Users:')
    console.log('─'.repeat(80))
    users.forEach(u => {
        const roleIcon = u.role === 'ADMIN' ? '👑' : '👤'
        console.log(`${roleIcon} ${u.email.padEnd(30)} ${u.role.padEnd(8)} ${u.name || 'No name'}`)
    })
    console.log('─'.repeat(80))
    console.log(`Total: ${users.length} users\n`)
}

async function promoteUser(email: string) {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
        console.log(`❌ User "${email}" not found`)
        return
    }

    if (user.role === 'ADMIN') {
        console.log(`✅ User "${email}" is already ADMIN`)
        return
    }

    const updated = await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN' }
    })

    console.log(`✅ SUCCESS! ${email} is now ADMIN`)
}

async function demoteUser(email: string) {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
        console.log(`❌ User "${email}" not found`)
        return
    }

    if (user.role === 'USER') {
        console.log(`✅ User "${email}" is already USER`)
        return
    }

    await prisma.user.update({
        where: { email },
        data: { role: 'USER' }
    })

    console.log(`✅ ${email} demoted to USER`)
}

async function createAdmin(email: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { email } })

    if (existing) {
        console.log(`❌ User "${email}" already exists`)
        return
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const admin = await prisma.user.create({
        data: {
            email,
            hashedPassword,
            role: 'ADMIN',
            name: email.split('@')[0]
        }
    })

    console.log(`✅ Admin created:`)
    console.log(`   Email: ${admin.email}`)
    console.log(`   ID: ${admin.id}`)
}

function showHelp() {
    console.log('\n🔧 Admin CLI - Unified user management\n')
    console.log('Commands:')
    Object.entries(COMMANDS).forEach(([cmd, desc]) => {
        console.log(`  ${cmd.padEnd(12)} ${desc}`)
    })
    console.log('\nExamples:')
    console.log('  npx tsx scripts/admin-cli.ts list')
    console.log('  npx tsx scripts/admin-cli.ts promote user@example.com')
    console.log('  npx tsx scripts/admin-cli.ts create admin@app.com securepass123\n')
}

async function main() {
    const [command, ...args] = process.argv.slice(2)

    if (!command || command === 'help') {
        showHelp()
        return
    }

    try {
        switch (command) {
            case 'list':
                await listUsers()
                break
            case 'promote':
                if (!args[0]) {
                    console.log('❌ Usage: admin-cli.ts promote <email>')
                    return
                }
                await promoteUser(args[0])
                break
            case 'demote':
                if (!args[0]) {
                    console.log('❌ Usage: admin-cli.ts demote <email>')
                    return
                }
                await demoteUser(args[0])
                break
            case 'create':
                if (!args[0] || !args[1]) {
                    console.log('❌ Usage: admin-cli.ts create <email> <password>')
                    return
                }
                await createAdmin(args[0], args[1])
                break
            default:
                console.log(`❌ Unknown command: ${command}`)
                showHelp()
        }
    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
