
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
    console.log('📚 Synchronisation des publications locales...')

    // Liste des dossiers à scanner
    const folders = [
        'public/uploads',
        'public/FEU HUMAIN/files'
    ]

    let count = 0

    for (const folder of folders) {
        const fullPath = path.join(process.cwd(), folder)
        if (!fs.existsSync(fullPath)) continue

        const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.pdf'))

        for (const file of files) {
            // Nettoyer le nom pour le titre
            // Enlever le timestamp initial (ex: 1754233845270_)
            const cleanName = file.replace(/^\d+_/, '').replace(/_/g, ' ').replace('.pdf', '')
            const filePath = `/${folder.replace('public/', '')}/${file}`
            const stats = fs.statSync(path.join(fullPath, file))

            // Vérifier existence
            const existing = await prisma.article.findFirst({
                where: { fileName: file }
            })

            if (!existing) {
                await prisma.article.create({
                    data: {
                        title: cleanName,
                        description: `Document importé automatiquement depuis ${folder}`,
                        author: 'Aubin Robert',
                        fileName: file,
                        filePath: filePath,
                        fileSize: stats.size,
                        tags: ['import-local'],
                        publishedAt: new Date(stats.mtime),
                        isPublished: true
                    }
                })
                console.log(`✅ Importé: ${cleanName}`)
                count++
            } else {
                // console.log(`ℹ️ Déjà présent: ${cleanName}`)
            }
        }
    }

    console.log(`\n✨ ${count} nouvelles publications importées.`)
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect()
    })
