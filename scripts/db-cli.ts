#!/usr/bin/env npx tsx
/**
 * Unified Database CLI
 * Replaces: check-db.ts, check-users.ts, check-user-role.ts, check-github-user.ts,
 *           check-articles.ts, check-encoding.ts
 * 
 * Usage:
 *   npx tsx scripts/db-cli.ts status       # Check DB connection
 *   npx tsx scripts/db-cli.ts users        # List users
 *   npx tsx scripts/db-cli.ts articles     # List articles
 *   npx tsx scripts/db-cli.ts archives     # List archives with stats
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkStatus() {
    try {
        await prisma.$queryRaw`SELECT 1`
        console.log('✅ Database connection OK')

        const counts = await Promise.all([
            prisma.user.count(),
            prisma.article.count(),
            prisma.conversationArchive.count(),
            prisma.conversationMessage.count(),
        ])

        console.log('\n📊 Database Stats:')
        console.log(`   Users: ${counts[0]}`)
        console.log(`   Articles: ${counts[1]}`)
        console.log(`   Archives: ${counts[2]}`)
        console.log(`   Messages: ${counts[3].toLocaleString()}`)
    } catch (e) {
        console.log('❌ Database connection failed:', e)
    }
}

async function listUsers() {
    const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true, accounts: { select: { provider: true } } },
        orderBy: { createdAt: 'desc' }
    })

    console.log('\n👥 Users:')
    users.forEach(u => {
        const providers = u.accounts.map(a => a.provider).join(', ') || 'credentials'
        const roleIcon = u.role === 'ADMIN' ? '👑' : '👤'
        console.log(`${roleIcon} ${u.email?.padEnd(30) || 'no-email'} [${providers}] ${u.name || ''}`)
    })
}

async function listArticles() {
    const articles = await prisma.article.findMany({
        select: { id: true, title: true, isPublished: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 20
    })

    console.log('\n📄 Recent Articles (max 20):')
    articles.forEach(a => {
        const status = a.isPublished ? '🟢' : '🟡'
        console.log(`${status} ${a.title.substring(0, 50).padEnd(52)} ${a.createdAt.toLocaleDateString()}`)
    })
}

async function listArchives() {
    const archives = await prisma.conversationArchive.findMany({
        select: {
            id: true,
            title: true,
            slug: true,
            isPublic: true,
            _count: { select: { messages: true, participants: true } }
        }
    })

    console.log('\n📦 Archives:')
    archives.forEach(a => {
        const visibility = a.isPublic ? '🌍' : '🔒'
        console.log(`${visibility} ${a.title.padEnd(30)} ${a._count.participants} participants, ${a._count.messages.toLocaleString()} messages`)
    })
}

function showHelp() {
    console.log('\n🔧 Database CLI\n')
    console.log('Commands:')
    console.log('  status     Check DB connection and show stats')
    console.log('  users      List all users')
    console.log('  articles   List recent articles')
    console.log('  archives   List archives with stats\n')
}

async function main() {
    const command = process.argv[2]

    try {
        switch (command) {
            case 'status': await checkStatus(); break
            case 'users': await listUsers(); break
            case 'articles': await listArticles(); break
            case 'archives': await listArchives(); break
            default: showHelp()
        }
    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
