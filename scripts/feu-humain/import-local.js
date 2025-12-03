#!/usr/bin/env node

/**
 * Script d'import local pour FEU HUMAIN
 *
 * Ce script lit le fichier message_1.json localement et l'importe
 * progressivement dans la base de données via l'API, en contournant
 * les limites de timeout de Vercel.
 *
 * Usage: node scripts/feu-humain/import-local.js [chemin-vers-message_1.json]
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')
const https = require('https')

// Configuration
const CONFIG = {
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  batchSize: 100, // Messages par batch
  progressFile: './scripts/feu-humain/.progress.json',
  maxRetries: 3,
  retryDelay: 2000,
}

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

// Classe principale d'import
class FeuHumainImporter {
  constructor(filePath) {
    this.filePath = filePath
    this.progress = this.loadProgress()
    this.stats = {
      total: 0,
      imported: 0,
      skipped: 0,
      failed: 0,
      startTime: Date.now(),
    }
  }

  // Charge la progression sauvegardée
  loadProgress() {
    try {
      if (fs.existsSync(CONFIG.progressFile)) {
        const data = fs.readFileSync(CONFIG.progressFile, 'utf8')
        return JSON.parse(data)
      }
    } catch (error) {
      console.log(
        `${colors.yellow}⚠ Pas de fichier de progression trouvé, démarrage depuis le début${colors.reset}`
      )
    }
    return {
      lastProcessedIndex: 0,
      importedTimestamps: new Set(),
      archiveId: null,
    }
  }

  // Sauvegarde la progression
  saveProgress() {
    const progressData = {
      ...this.progress,
      importedTimestamps: Array.from(this.progress.importedTimestamps),
    }
    fs.writeFileSync(CONFIG.progressFile, JSON.stringify(progressData, null, 2))
  }

  // Affiche la barre de progression
  displayProgress() {
    const percentage = Math.round((this.stats.imported / this.stats.total) * 100)
    const barLength = 40
    const filled = Math.round(barLength * (this.stats.imported / this.stats.total))
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled)

    const elapsed = Date.now() - this.stats.startTime
    const rate = this.stats.imported / (elapsed / 1000)
    const remaining = (this.stats.total - this.stats.imported) / rate

    process.stdout.clearLine(0)
    process.stdout.cursorTo(0)
    process.stdout.write(
      `${colors.cyan}Progress: [${bar}] ${percentage}% | ` +
        `${this.stats.imported}/${this.stats.total} messages | ` +
        `${Math.round(rate)} msg/s | ` +
        `ETA: ${this.formatTime(remaining)}${colors.reset}`
    )
  }

  // Formate le temps en format lisible
  formatTime(seconds) {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`
  }

  // Demande confirmation à l'utilisateur
  async askConfirmation(message) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    return new Promise(resolve => {
      rl.question(`${colors.yellow}${message} (y/n): ${colors.reset}`, answer => {
        rl.close()
        resolve(answer.toLowerCase() === 'y')
      })
    })
  }

  // Charge et parse le fichier JSON
  async loadMessengerData() {
    console.log(`${colors.blue}📂 Chargement du fichier: ${this.filePath}${colors.reset}`)

    const fileContent = fs.readFileSync(this.filePath, 'utf8')
    const data = JSON.parse(fileContent)

    console.log(`${colors.green}✓ Fichier chargé avec succès${colors.reset}`)
    console.log(`  - Titre: ${data.title || 'Sans titre'}`)
    console.log(`  - Messages: ${data.messages.length}`)
    console.log(`  - Participants: ${data.participants.length}`)

    // Trier les messages par timestamp pour un import chronologique
    data.messages.sort((a, b) => a.timestamp_ms - b.timestamp_ms)

    return data
  }

  // Analyse le fichier avant import
  async analyzeFile(data) {
    console.log(`\n${colors.blue}🔍 Analyse du fichier...${colors.reset}`)

    const response = await this.makeApiCall('/api/admin/feu-humain/chunks/analyze', {
      totalMessages: data.messages.length,
      participants: data.participants,
      title: data.title,
      dateRange: {
        start: new Date(Math.min(...data.messages.map(m => m.timestamp_ms))),
        end: new Date(Math.max(...data.messages.map(m => m.timestamp_ms))),
      },
    })

    if (response.existingArchive) {
      console.log(`${colors.yellow}⚠ Archive existante détectée${colors.reset}`)
      console.log(`  - Messages existants: ${response.existingMessages}`)
      console.log(`  - Nouveaux messages: ${response.newMessages}`)

      if (response.newMessages === 0) {
        console.log(`${colors.green}✓ Tous les messages sont déjà importés${colors.reset}`)
        return false
      }

      const proceed = await this.askConfirmation("Voulez-vous continuer l'import incrémental?")
      if (!proceed) {
        console.log(`${colors.red}✗ Import annulé${colors.reset}`)
        return false
      }
    } else {
      console.log(`${colors.green}✓ Nouvelle archive à créer${colors.reset}`)
    }

    this.progress.archiveId = response.archiveId
    return true
  }

  // Fait un appel API avec retry
  async makeApiCall(endpoint, data, retries = CONFIG.maxRetries) {
    const url = `${CONFIG.apiUrl}${endpoint}`

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // TODO: Ajouter l'authentification si nécessaire
            // 'Authorization': `Bearer ${process.env.AUTH_TOKEN}`,
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const error = await response.text()
          throw new Error(`API Error (${response.status}): ${error}`)
        }

        return await response.json()
      } catch (error) {
        if (attempt === retries) {
          throw error
        }
        console.log(
          `\n${colors.yellow}⚠ Tentative ${attempt}/${retries} échouée, retry dans ${CONFIG.retryDelay}ms${colors.reset}`
        )
        await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay))
      }
    }
  }

  // Importe un batch de messages
  async importBatch(messages, batchNumber, totalBatches) {
    console.log(`\n${colors.blue}📦 Import du batch ${batchNumber}/${totalBatches}${colors.reset}`)

    const response = await this.makeApiCall('/api/admin/feu-humain/chunks/import', {
      messages,
      archiveId: this.progress.archiveId,
    })

    // Marquer les messages comme importés
    messages.forEach(msg => {
      this.progress.importedTimestamps.add(msg.timestamp_ms)
    })

    this.stats.imported += response.imported
    this.stats.skipped += response.skipped || 0
    this.progress.lastProcessedIndex += messages.length

    // Sauvegarder la progression après chaque batch
    this.saveProgress()

    return response
  }

  // Fonction principale d'import
  async import() {
    try {
      // Charger les données
      const data = await this.loadMessengerData()
      this.stats.total = data.messages.length

      // Analyser le fichier
      const shouldProceed = await this.analyzeFile(data)
      if (!shouldProceed) {
        return
      }

      // Filtrer les messages déjà importés
      const messagesToImport = data.messages.filter(
        msg => !this.progress.importedTimestamps.has(msg.timestamp_ms)
      )

      if (messagesToImport.length === 0) {
        console.log(`${colors.green}✓ Tous les messages sont déjà importés${colors.reset}`)
        return
      }

      console.log(
        `\n${colors.bright}🚀 Démarrage de l'import de ${messagesToImport.length} messages${colors.reset}`
      )

      // Découper en batches
      const batches = []
      for (let i = 0; i < messagesToImport.length; i += CONFIG.batchSize) {
        batches.push(messagesToImport.slice(i, i + CONFIG.batchSize))
      }

      // Importer batch par batch
      for (let i = 0; i < batches.length; i++) {
        await this.importBatch(batches[i], i + 1, batches.length)
        this.displayProgress()
      }

      // Finaliser l'import
      await this.finalizeImport(data)

      console.log(
        `\n\n${colors.green}${colors.bright}✅ Import terminé avec succès!${colors.reset}`
      )
      console.log(`  - Messages importés: ${this.stats.imported}`)
      console.log(`  - Messages ignorés: ${this.stats.skipped}`)
      console.log(`  - Temps total: ${this.formatTime((Date.now() - this.stats.startTime) / 1000)}`)

      // Nettoyer le fichier de progression
      if (fs.existsSync(CONFIG.progressFile)) {
        fs.unlinkSync(CONFIG.progressFile)
      }
    } catch (error) {
      console.error(`\n${colors.red}❌ Erreur lors de l'import:${colors.reset}`, error)
      console.log(
        `${colors.yellow}💾 Progression sauvegardée. Relancez le script pour reprendre.${colors.reset}`
      )
      process.exit(1)
    }
  }

  // Finalise l'import (met à jour les stats, etc.)
  async finalizeImport(data) {
    console.log(`\n${colors.blue}📊 Finalisation de l'import...${colors.reset}`)

    await this.makeApiCall('/api/admin/feu-humain/chunks/finalize', {
      archiveId: this.progress.archiveId,
      participants: data.participants,
      title: data.title,
    })
  }
}

// Point d'entrée principal
async function main() {
  console.log(`${colors.bright}${colors.cyan}
╔═══════════════════════════════════════╗
║     FEU HUMAIN - Import Local         ║
║     Archive Messenger → Athanor       ║
╚═══════════════════════════════════════╝
${colors.reset}`)

  // Vérifier les arguments
  const filePath = process.argv[2]
  if (!filePath) {
    console.error(
      `${colors.red}❌ Usage: node scripts/feu-humain/import-local.js [chemin-vers-message_1.json]${colors.reset}`
    )
    process.exit(1)
  }

  // Vérifier que le fichier existe
  if (!fs.existsSync(filePath)) {
    console.error(`${colors.red}❌ Fichier non trouvé: ${filePath}${colors.reset}`)
    process.exit(1)
  }

  // Lancer l'import
  const importer = new FeuHumainImporter(filePath)
  await importer.import()
}

// Gestion des interruptions
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}⚠ Import interrompu. Progression sauvegardée.${colors.reset}`)
  process.exit(0)
})

// Lancer le script
main()
