#!/usr/bin/env ts-node

/**
 * Sauvegarde complète de l'archive FEU HUMAIN depuis la base de données.
 *
 * Exporte toutes les tables liées (archive, participants, messages, médias,
 * réactions, notes OCR) dans un seul fichier JSON horodaté.
 *
 * Usage :
 *   npm run backup:feu-humain
 *
 * Le fichier est écrit dans data/backups/feu-humain-<timestamp>.json
 * et un lien symbolique data/backups/feu-humain-latest.json pointe
 * toujours vers le dernier backup.
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🔒 Backup FEU HUMAIN — début')

  const archive = await prisma.conversationArchive.findFirst({
    where: { slug: 'feu-humain' },
  })

  if (!archive) {
    console.error('❌ Aucune archive "feu-humain" trouvée en base.')
    process.exit(1)
  }

  console.log(`   📦 Archive : ${archive.title} (${archive.messageCount} messages)`)

  // Export parallèle de toutes les tables liées
  const [participants, messages, media, reactions, notes] = await Promise.all([
    prisma.conversationParticipant.findMany({
      where: { archiveId: archive.id },
      orderBy: { messageCount: 'desc' },
    }),
    prisma.conversationMessage.findMany({
      where: { archiveId: archive.id },
      orderBy: { timestamp: 'asc' },
    }),
    prisma.conversationMedia.findMany({
      where: { message: { archiveId: archive.id } },
    }),
    prisma.conversationReaction.findMany({
      where: { message: { archiveId: archive.id } },
    }),
    prisma.archiveNote.findMany({
      where: { archiveId: archive.id },
    }),
  ])

  const backup = {
    _meta: {
      exportedAt: new Date().toISOString(),
      schema: 'feu-humain-backup-v1',
      counts: {
        participants: participants.length,
        messages: messages.length,
        media: media.length,
        reactions: reactions.length,
        notes: notes.length,
      },
    },
    archive,
    participants,
    // BigInt → string pour la sérialisation JSON
    messages: messages.map((m) => ({
      ...m,
      timestamp: m.timestamp.toString(),
    })),
    media,
    reactions: reactions.map((r) => ({
      ...r,
      timestamp: r.timestamp?.toString() ?? null,
    })),
    notes,
  }

  // Écriture du fichier
  const backupDir = path.join(process.cwd(), 'data', 'backups')
  await fs.mkdir(backupDir, { recursive: true })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const fileName = `feu-humain-${timestamp}.json`
  const filePath = path.join(backupDir, fileName)
  const latestPath = path.join(backupDir, 'feu-humain-latest.json')

  await fs.writeFile(filePath, JSON.stringify(backup, null, 2))

  // Mettre à jour le lien "latest"
  try {
    await fs.unlink(latestPath)
  } catch {
    // Le fichier n'existe pas encore, c'est OK
  }
  await fs.copyFile(filePath, latestPath)

  const stats = await fs.stat(filePath)
  const sizeMB = (stats.size / 1024 / 1024).toFixed(1)

  console.log(`   ✅ Backup écrit : ${filePath}`)
  console.log(`   📊 ${sizeMB} MB — ${backup._meta.counts.messages} messages, ${backup._meta.counts.media} médias, ${backup._meta.counts.notes} notes OCR`)
  console.log(`   🔗 Latest : ${latestPath}`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur backup :', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
