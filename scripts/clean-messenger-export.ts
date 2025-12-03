#!/usr/bin/env node
/**
 * Script de nettoyage de l'encodage pour l'export Messenger
 *
 * Corrige les problèmes de double encodage UTF-8 (UTF-8 → Latin-1 → UTF-8)
 * qui causent des caractères comme "Ã©" au lieu de "é"
 *
 * Usage: npm run clean:feu-humain
 */

import fs from 'fs/promises'
import path from 'path'

// Table de conversion pour corriger le double encodage UTF-8
const ENCODING_FIXES: Record<string, string> = {
  // Lettres accentuées minuscules
  'Ã©': 'é',
  'Ã¨': 'è',
  'Ã ': 'à',
  'Ã¢': 'â',
  'Ã§': 'ç',
  'Ã´': 'ô',
  'Ã®': 'î',
  'Ã¯': 'ï',
  'Ã«': 'ë',
  'Ã¹': 'ù',
  'Ã»': 'û',
  'Ã¼': 'ü',
  'Ã¶': 'ö',
  'Ã±': 'ñ',

  // Lettres accentuées majuscules
  'Ã€': 'À',
  'Ã‰': 'É',
  ÃŠ: 'Ê',
  'Ã‹': 'Ë',
  ÃŒ: 'Ì',
  ÃŽ: 'Î',
  'Ã\u2019': 'Ò',
  'Ã"': 'Ô',
  'Ã–': 'Ö',
  'Ã™': 'Ù',
  Ãš: 'Ú',
  'Ã›': 'Û',
  Ãœ: 'Ü',
  'Ã‡': 'Ç',

  // Ligatures
  'Å"': 'œ',
  "Å'": 'Œ',
  'Ã¦': 'æ',
  'Ã†': 'Æ',

  // Caractères typographiques
  'â€™': "'", // Apostrophe courbée
  'â€˜': "'", // Apostrophe ouvrante
  'â€œ': '"', // Guillemet ouvrant
  'â€': '"', // Guillemet fermant
  'â€"': '—', // Tiret cadratin
  'â€¦': '...', // Points de suspension
  'â€¢': '•', // Puce
  'â„¢': '™', // Trademark
  'Â©': '©', // Copyright
  'Â®': '®', // Registered
  'â€°': '‰', // Pour mille
  'â€¹': '‹', // Guillemet simple ouvrant
  'â€º': '›', // Guillemet simple fermant
  'Â«': '«', // Guillemet français ouvrant
  'Â»': '»', // Guillemet français fermant

  // Espaces et caractères invisibles
  'Â ': ' ', // Espace insécable mal encodé

  // Symboles mathématiques et autres
  'Ã—': '×', // Signe multiplication
  'Ã·': '÷', // Signe division
  'Â°': '°', // Degré
  'â‚¬': '€', // Euro
  'Â£': '£', // Livre sterling
  'Â¥': '¥', // Yen
  'Â§': '§', // Section
  'Â¶': '¶', // Paragraphe

  // Corrections spécifiques observées
  'nÂ°': 'n°', // Numéro
}

// Patterns plus complexes qui nécessitent regex
const REGEX_FIXES = [
  // Double espaces après ponctuation française
  { pattern: /\s+([?!:;])/g, replacement: ' $1' },
  // Espaces multiples
  { pattern: /\s{2,}/g, replacement: ' ' },
  // Apostrophes droites multiples
  { pattern: /'+/g, replacement: "'" },
]

/**
 * Nettoie une chaîne de caractères
 */
function cleanString(str: string | null | undefined): string | null | undefined {
  if (!str) return str

  let cleaned = str

  // Appliquer les corrections de caractères
  for (const [bad, good] of Object.entries(ENCODING_FIXES)) {
    // Utiliser une regex globale pour remplacer toutes les occurrences
    const regex = new RegExp(bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    cleaned = cleaned.replace(regex, good)
  }

  // Appliquer les corrections regex
  for (const { pattern, replacement } of REGEX_FIXES) {
    cleaned = cleaned.replace(pattern, replacement)
  }

  // Nettoyer les espaces en début et fin
  cleaned = cleaned.trim()

  return cleaned
}

/**
 * Nettoie un objet message
 */
function cleanMessage(message: any): any {
  const cleaned = { ...message }

  // Nettoyer le contenu
  if (cleaned.content) {
    cleaned.content = cleanString(cleaned.content)
  }

  // Nettoyer le nom de l'expéditeur
  if (cleaned.sender_name) {
    cleaned.sender_name = cleanString(cleaned.sender_name)
  }

  // Nettoyer les réactions
  if (cleaned.reactions && Array.isArray(cleaned.reactions)) {
    cleaned.reactions = cleaned.reactions.map((reaction: any) => ({
      ...reaction,
      actor: cleanString(reaction.actor) || reaction.actor,
      reaction: cleanString(reaction.reaction) || reaction.reaction,
    }))
  }

  // Nettoyer les noms de fichiers médias
  if (cleaned.photos && Array.isArray(cleaned.photos)) {
    cleaned.photos = cleaned.photos.map((photo: any) => ({
      ...photo,
      uri: cleanString(photo.uri) || photo.uri,
    }))
  }

  if (cleaned.videos && Array.isArray(cleaned.videos)) {
    cleaned.videos = cleaned.videos.map((video: any) => ({
      ...video,
      uri: cleanString(video.uri) || video.uri,
    }))
  }

  if (cleaned.audio_files && Array.isArray(cleaned.audio_files)) {
    cleaned.audio_files = cleaned.audio_files.map((audio: any) => ({
      ...audio,
      uri: cleanString(audio.uri) || audio.uri,
    }))
  }

  if (cleaned.gifs && Array.isArray(cleaned.gifs)) {
    cleaned.gifs = cleaned.gifs.map((gif: any) => ({
      ...gif,
      uri: cleanString(gif.uri) || gif.uri,
    }))
  }

  if (cleaned.files && Array.isArray(cleaned.files)) {
    cleaned.files = cleaned.files.map((file: any) => ({
      ...file,
      uri: cleanString(file.uri) || file.uri,
    }))
  }

  return cleaned
}

/**
 * Nettoie les données de la conversation
 */
function cleanConversationData(data: any): any {
  const cleaned = { ...data }

  // Nettoyer le titre
  if (cleaned.title) {
    cleaned.title = cleanString(cleaned.title)
  }

  // Nettoyer les participants
  if (cleaned.participants && Array.isArray(cleaned.participants)) {
    cleaned.participants = cleaned.participants.map((participant: any) => ({
      ...participant,
      name: cleanString(participant.name) || participant.name,
    }))
  }

  // Nettoyer tous les messages
  if (cleaned.messages && Array.isArray(cleaned.messages)) {
    cleaned.messages = cleaned.messages.map(cleanMessage)
  }

  return cleaned
}

/**
 * Fonction principale
 */
async function main() {
  console.log("🧹 Nettoyage de l'export Messenger FEU HUMAIN")
  console.log('================================================\n')

  const inputPath = path.join(process.cwd(), 'public', 'FEU HUMAIN', 'message_1.json')
  const outputPath = path.join(process.cwd(), 'public', 'FEU HUMAIN', 'message_1_clean.json')
  const backupPath = path.join(process.cwd(), 'public', 'FEU HUMAIN', 'message_1_original.json')

  try {
    // Vérifier que le fichier existe
    console.log('📂 Lecture du fichier original...')
    const fileContent = await fs.readFile(inputPath, 'utf8')
    console.log(`✅ Fichier lu (${(fileContent.length / 1024 / 1024).toFixed(2)} MB)`)

    // Parser le JSON
    console.log('\n🔍 Analyse du JSON...')
    const data = JSON.parse(fileContent)
    console.log(`✅ JSON parsé avec succès`)
    console.log(`   - ${data.messages.length} messages`)
    console.log(`   - ${data.participants.length} participants`)

    // Analyser les problèmes d'encodage
    console.log("\n🔎 Détection des problèmes d'encodage...")
    let problemsFound = 0
    let affectedMessages = 0

    data.messages.forEach((msg: any) => {
      let hasProblems = false

      if (msg.content) {
        for (const pattern in ENCODING_FIXES) {
          if (msg.content.includes(pattern)) {
            problemsFound++
            hasProblems = true
          }
        }
      }

      if (msg.sender_name) {
        for (const pattern in ENCODING_FIXES) {
          if (msg.sender_name.includes(pattern)) {
            problemsFound++
            hasProblems = true
          }
        }
      }

      if (hasProblems) affectedMessages++
    })

    console.log(`⚠️  ${problemsFound} problèmes d'encodage trouvés`)
    console.log(
      `   - ${affectedMessages} messages affectés (${((affectedMessages / data.messages.length) * 100).toFixed(1)}%)`
    )

    if (problemsFound === 0) {
      console.log("\n✨ Aucun problème d'encodage détecté !")
      console.log('Le fichier semble déjà être correctement encodé.')
      return
    }

    // Créer une sauvegarde
    console.log("\n💾 Création d'une sauvegarde...")
    await fs.copyFile(inputPath, backupPath)
    console.log(`✅ Sauvegarde créée : ${path.basename(backupPath)}`)

    // Nettoyer les données
    console.log('\n🧹 Nettoyage en cours...')
    const cleanedData = cleanConversationData(data)

    // Vérifier le nettoyage
    let problemsAfter = 0
    cleanedData.messages.forEach((msg: any) => {
      if (msg.content) {
        for (const pattern in ENCODING_FIXES) {
          if (msg.content.includes(pattern)) {
            problemsAfter++
          }
        }
      }
    })

    console.log(`✅ Nettoyage terminé`)
    console.log(`   - Problèmes corrigés : ${problemsFound - problemsAfter}`)
    console.log(`   - Problèmes restants : ${problemsAfter}`)

    // Sauvegarder le fichier nettoyé
    console.log('\n💾 Sauvegarde du fichier nettoyé...')
    await fs.writeFile(outputPath, JSON.stringify(cleanedData, null, 2), 'utf8')
    console.log(`✅ Fichier nettoyé sauvé : ${path.basename(outputPath)}`)

    // Afficher quelques exemples de corrections
    console.log('\n📝 Exemples de corrections :')
    let exampleCount = 0
    for (let i = 0; i < Math.min(data.messages.length, cleanedData.messages.length); i++) {
      const original = data.messages[i]
      const cleaned = cleanedData.messages[i]

      if (original.content && cleaned.content && original.content !== cleaned.content) {
        if (exampleCount >= 3) break
        exampleCount++

        console.log(`\nExemple ${exampleCount}:`)
        console.log(`  Avant : "${original.content.substring(0, 100)}..."`)
        console.log(`  Après : "${cleaned.content.substring(0, 100)}..."`)
      }
    }

    // Instructions finales
    console.log('\n✨ Nettoyage terminé avec succès !')
    console.log('\n📌 Prochaines étapes :')
    console.log('  1. Vérifiez le fichier nettoyé : public/FEU HUMAIN/message_1_clean.json')
    console.log("  2. Testez l'import en local avec le fichier nettoyé")
    console.log('  3. Si tout est OK, remplacez message_1.json par message_1_clean.json')
    console.log('  4. Importez en production via /admin/feu-humain/import')
  } catch (error) {
    console.error('\n❌ Erreur :', error)
    process.exit(1)
  }
}

// Exécuter le script
if (require.main === module) {
  main().catch(error => {
    console.error('Erreur fatale :', error)
    process.exit(1)
  })
}

export { cleanString, cleanMessage, cleanConversationData }
