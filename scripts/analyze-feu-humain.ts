/**
 * Script utilitaire pour analyser et optimiser l'archive FEU HUMAIN
 *
 * Usage:
 * npm run analyze:feu-humain
 */

import fs from 'fs'
import path from 'path'

interface ConversationData {
  participants: Array<{ name: string }>
  messages: Array<{
    sender_name: string
    timestamp_ms: number
    content?: string
    photos?: Array<{ uri: string }>
    videos?: Array<{ uri: string }>
    audio_files?: Array<{ uri: string }>
    reactions?: Array<{ reaction: string; actor: string }>
  }>
  title: string
}

class FeuHumainAnalyzer {
  private data: ConversationData | null = null
  private basePath: string

  constructor(basePath: string = './public/FEU HUMAIN') {
    this.basePath = basePath
  }

  /**
   * Charge les données de la conversation
   */
  async load(): Promise<void> {
    const jsonPath = path.join(this.basePath, 'message_1.json')

    try {
      const rawData = await fs.promises.readFile(jsonPath, 'utf-8')
      this.data = JSON.parse(rawData)
      console.log('✅ Données chargées avec succès')
    } catch (error) {
      console.error('❌ Erreur lors du chargement:', error)
      throw error
    }
  }

  /**
   * Analyse les statistiques de la conversation
   */
  analyzeStats(): void {
    if (!this.data) {
      console.error('❌ Aucune donnée chargée')
      return
    }

    const stats = {
      totalMessages: this.data.messages.length,
      participants: this.data.participants.length,
      participantsList: this.data.participants.map(p => p.name),
      timeRange: this.getTimeRange(),
      mediaStats: this.getMediaStats(),
      topContributors: this.getTopContributors(),
      messagesByHour: this.getMessagesByHour(),
      messagesByDay: this.getMessagesByDay(),
      longestMessage: this.getLongestMessage(),
      mostReactedMessage: this.getMostReactedMessage(),
    }

    console.log('\n📊 STATISTIQUES DE LA CONVERSATION')
    console.log('=====================================')
    console.log(`📝 Total des messages: ${stats.totalMessages}`)
    console.log(`👥 Participants: ${stats.participants}`)
    console.log(`📅 Période: ${stats.timeRange.start} - ${stats.timeRange.end}`)
    console.log(`⏱️ Durée: ${stats.timeRange.durationDays} jours`)

    console.log('\n📸 MÉDIAS')
    console.log(`Photos: ${stats.mediaStats.photos}`)
    console.log(`Vidéos: ${stats.mediaStats.videos}`)
    console.log(`Audio: ${stats.mediaStats.audio}`)
    console.log(`Réactions: ${stats.mediaStats.reactions}`)

    console.log('\n🏆 TOP CONTRIBUTEURS')
    stats.topContributors.slice(0, 5).forEach((contributor, index) => {
      console.log(
        `${index + 1}. ${contributor.name}: ${contributor.count} messages (${contributor.percentage}%)`
      )
    })

    console.log('\n⏰ HEURES LES PLUS ACTIVES')
    stats.messagesByHour.slice(0, 3).forEach(hour => {
      console.log(`${hour.hour}h: ${hour.count} messages`)
    })

    console.log('\n📅 JOURS LES PLUS ACTIFS')
    stats.messagesByDay.slice(0, 3).forEach(day => {
      console.log(`${day.date}: ${day.count} messages`)
    })

    if (stats.longestMessage) {
      console.log('\n📜 MESSAGE LE PLUS LONG')
      console.log(`Par ${stats.longestMessage.sender} (${stats.longestMessage.length} caractères)`)
      console.log(`"${stats.longestMessage.preview}..."`)
    }

    if (stats.mostReactedMessage) {
      console.log('\n❤️ MESSAGE LE PLUS RÉAGI')
      console.log(
        `Par ${stats.mostReactedMessage.sender} (${stats.mostReactedMessage.reactions} réactions)`
      )
      console.log(`"${stats.mostReactedMessage.preview}..."`)
    }
  }

  /**
   * Vérifie l'intégrité des fichiers médias
   */
  async checkMediaIntegrity(): Promise<void> {
    if (!this.data) {
      console.error('❌ Aucune donnée chargée')
      return
    }

    console.log('\n🔍 VÉRIFICATION DES MÉDIAS')
    console.log('===========================')

    const mediaTypes = [
      { type: 'photos', key: 'photos' },
      { type: 'videos', key: 'videos' },
      { type: 'audio', key: 'audio_files' },
    ]

    for (const { type, key } of mediaTypes) {
      const missing: string[] = []
      const found: string[] = []

      for (const message of this.data.messages) {
        const media = (message as any)[key]
        if (media && Array.isArray(media)) {
          for (const item of media) {
            const filePath = path.join(this.basePath, item.uri)
            try {
              await fs.promises.access(filePath)
              found.push(item.uri)
            } catch {
              missing.push(item.uri)
            }
          }
        }
      }

      console.log(`\n📁 ${type.toUpperCase()}`)
      console.log(`✅ Trouvés: ${found.length}`)
      console.log(`❌ Manquants: ${missing.length}`)

      if (missing.length > 0 && missing.length <= 5) {
        console.log('Fichiers manquants:')
        missing.forEach(file => console.log(`  - ${file}`))
      }
    }
  }

  /**
   * Génère un fichier de métadonnées optimisé
   */
  async generateMetadata(): Promise<void> {
    if (!this.data) {
      console.error('❌ Aucune donnée chargée')
      return
    }

    const metadata = {
      title: this.data.title,
      participants: this.data.participants.map(p => p.name),
      messageCount: this.data.messages.length,
      dateRange: this.getTimeRange(),
      stats: this.getMediaStats(),
      generated: new Date().toISOString(),
    }

    const metadataPath = path.join(this.basePath, 'metadata.json')
    await fs.promises.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    console.log('\n✅ Métadonnées générées:', metadataPath)
  }

  /**
   * Crée un fichier d'index pour recherche rapide
   */
  async createSearchIndex(): Promise<void> {
    if (!this.data) {
      console.error('❌ Aucune donnée chargée')
      return
    }

    const index = this.data.messages
      .filter(msg => msg.content)
      .map((msg, idx) => ({
        id: idx,
        sender: msg.sender_name,
        content: msg.content?.toLowerCase() || '',
        timestamp: msg.timestamp_ms,
        date: new Date(msg.timestamp_ms).toISOString(),
      }))

    const indexPath = path.join(this.basePath, 'search-index.json')
    await fs.promises.writeFile(indexPath, JSON.stringify(index, null, 2))

    console.log('\n✅ Index de recherche créé:', indexPath)
  }

  // Méthodes privées d'analyse
  private getTimeRange() {
    if (!this.data) return { start: '', end: '', durationDays: 0 }

    const timestamps = this.data.messages.map(m => m.timestamp_ms)
    const start = new Date(Math.min(...timestamps))
    const end = new Date(Math.max(...timestamps))
    const durationDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    return {
      start: start.toLocaleDateString('fr-FR'),
      end: end.toLocaleDateString('fr-FR'),
      durationDays,
    }
  }

  private getMediaStats() {
    if (!this.data) return { photos: 0, videos: 0, audio: 0, reactions: 0 }

    const stats = { photos: 0, videos: 0, audio: 0, reactions: 0 }

    this.data.messages.forEach(msg => {
      if (msg.photos) stats.photos += msg.photos.length
      if (msg.videos) stats.videos += msg.videos.length
      if (msg.audio_files) stats.audio += msg.audio_files.length
      if (msg.reactions) stats.reactions += msg.reactions.length
    })

    return stats
  }

  private getTopContributors() {
    if (!this.data) return []

    const counts: Record<string, number> = {}

    this.data.messages.forEach(msg => {
      counts[msg.sender_name] = (counts[msg.sender_name] || 0) + 1
    })

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / this.data!.messages.length) * 100),
      }))
      .sort((a, b) => b.count - a.count)
  }

  private getMessagesByHour() {
    if (!this.data) return []

    const hourCounts: Record<number, number> = {}

    this.data.messages.forEach(msg => {
      const hour = new Date(msg.timestamp_ms).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    return Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
  }

  private getMessagesByDay() {
    if (!this.data) return []

    const dayCounts: Record<string, number> = {}

    this.data.messages.forEach(msg => {
      const date = new Date(msg.timestamp_ms).toLocaleDateString('fr-FR')
      dayCounts[date] = (dayCounts[date] || 0) + 1
    })

    return Object.entries(dayCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.count - a.count)
  }

  private getLongestMessage() {
    if (!this.data) return null

    const messagesWithContent = this.data.messages
      .filter(msg => msg.content)
      .map(msg => ({
        sender: msg.sender_name,
        content: msg.content || '',
        length: msg.content?.length || 0,
      }))
      .sort((a, b) => b.length - a.length)

    if (messagesWithContent.length === 0) return null

    const longest = messagesWithContent[0]

    return {
      sender: longest.sender,
      length: longest.length,
      preview: longest.content.substring(0, 100),
    }
  }

  private getMostReactedMessage() {
    if (!this.data) return null

    const messagesWithReactions = this.data.messages
      .filter(msg => msg.reactions && msg.reactions.length > 0)
      .map(msg => ({
        sender: msg.sender_name,
        content: msg.content || '[Média]',
        reactions: msg.reactions?.length || 0,
      }))
      .sort((a, b) => b.reactions - a.reactions)

    if (messagesWithReactions.length === 0) return null

    const mostReacted = messagesWithReactions[0]

    return {
      sender: mostReacted.sender,
      reactions: mostReacted.reactions,
      preview: mostReacted.content.substring(0, 100),
    }
  }
}

// Exécution du script
async function main() {
  console.log('🔥 ANALYSEUR FEU HUMAIN')
  console.log('========================\n')

  const analyzer = new FeuHumainAnalyzer()

  try {
    await analyzer.load()
    analyzer.analyzeStats()
    await analyzer.checkMediaIntegrity()
    await analyzer.generateMetadata()
    await analyzer.createSearchIndex()

    console.log('\n✨ Analyse terminée avec succès!')
  } catch (error) {
    console.error('\n❌ Erreur:', error)
    process.exit(1)
  }
}

// Lancer si exécuté directement
if (require.main === module) {
  main()
}

export { FeuHumainAnalyzer }
