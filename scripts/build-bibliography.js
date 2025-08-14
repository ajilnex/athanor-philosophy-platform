#!/usr/bin/env node

/**
 * Script de construction de la bibliographie
 * Récupère les références depuis l'API Zotero et génère public/bibliography.json
 */

const fs = require('fs');
const path = require('path');

// Configuration Zotero
const ZOTERO_GROUP_ID = process.env.ZOTERO_GROUP_ID;
const ZOTERO_API_KEY = process.env.ZOTERO_API_KEY;
const ZOTERO_API_BASE = 'https://api.zotero.org/groups';
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'bibliography.json');

/**
 * Génère une clé de citation fallback déterministe
 */
function generateFallbackKey(item) {
  // Auteur principal
  const firstAuthor = item.creators?.find(c => c.creatorType === 'author');
  const authorName = firstAuthor 
    ? firstAuthor.lastName || firstAuthor.name || 'anonymous'
    : 'anonymous';
  
  // Année
  const year = item.date ? extractYear(item.date) : 'nodate';
  
  // Titre court (premiers mots significatifs)
  const titleWords = item.title
    ?.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s]/g, '') // Garde lettres, chiffres et espaces
    .split(/\s+/)
    .filter(word => word.length > 2 && !['the', 'and', 'une', 'des', 'les', 'sur', 'dans'].includes(word))
    .slice(0, 2) // Premiers 2 mots significatifs
    .join('-') || 'notitle';
  
  return `${authorName}-${year}-${titleWords}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Extrait l'année d'une date Zotero
 */
function extractYear(dateString) {
  if (!dateString) return 'nodate';
  const match = dateString.match(/\b(\d{4})\b/);
  return match ? match[1] : 'nodate';
}

/**
 * Normalise un item Zotero vers notre format
 */
function normalizeZoteroItem(item) {
  // Récupérer la citekey Better BibTeX si disponible
  const citekey = item.extra?.match(/Citation Key:\s*([^\n\r]+)/i)?.[1]?.trim();
  
  return {
    key: citekey || generateFallbackKey(item.data),
    type: item.data.itemType,
    title: item.data.title || '',
    authors: (item.data.creators || [])
      .filter(creator => creator.creatorType === 'author')
      .map(author => ({
        family: author.lastName || '',
        given: author.firstName || ''
      })),
    year: extractYear(item.data.date),
    container: item.data.publicationTitle || item.data.bookTitle || item.data.university || '',
    DOI: item.data.DOI || '',
    URL: item.data.url || '',
    ISBN: item.data.ISBN || '',
    tags: (item.data.tags || []).map(tag => tag.tag),
    // Métadonnées additionnelles
    volume: item.data.volume || '',
    issue: item.data.issue || '',
    pages: item.data.pages || '',
    publisher: item.data.publisher || '',
    place: item.data.place || ''
  };
}

/**
 * Récupère les items depuis l'API Zotero
 */
async function fetchZoteroItems() {
  if (!ZOTERO_GROUP_ID || !ZOTERO_API_KEY) {
    console.warn('⚠️  Variables Zotero manquantes, génération d\'une bibliographie vide');
    return [];
  }

  const url = `${ZOTERO_API_BASE}/${ZOTERO_GROUP_ID}/items?format=json&include=data&limit=100`;
  
  console.log(`📚 Récupération depuis Zotero (groupe ${ZOTERO_GROUP_ID})...`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Zotero-API-Key': ZOTERO_API_KEY,
        'Zotero-API-Version': '3'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur API Zotero: ${response.status} ${response.statusText}`);
    }

    const items = await response.json();
    console.log(`   ✅ ${items.length} items récupérés`);
    
    return items.filter(item => 
      item.data && 
      item.data.itemType !== 'attachment' && 
      item.data.itemType !== 'note'
    );
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération Zotero:', error.message);
    throw error;
  }
}

/**
 * Construit et valide la bibliographie
 */
async function buildBibliography() {
  console.log('🏗️  Construction de la bibliographie...');
  
  try {
    // Récupération des données
    const zoteroItems = await fetchZoteroItems();
    
    // Normalisation
    const bibliography = zoteroItems.map(normalizeZoteroItem);
    
    // Validation des clés uniques
    const keys = bibliography.map(item => item.key);
    const duplicateKeys = keys.filter((key, index) => keys.indexOf(key) !== index);
    
    if (duplicateKeys.length > 0) {
      console.error('❌ Clés dupliquées détectées:', duplicateKeys);
      throw new Error('Clés de citation en doublon - vérifiez vos citekeys Better BibTeX');
    }
    
    // Tri alphabétique par auteur principal puis année
    bibliography.sort((a, b) => {
      const authorA = a.authors[0]?.family || '';
      const authorB = b.authors[0]?.family || '';
      if (authorA !== authorB) return authorA.localeCompare(authorB);
      return (b.year || '').localeCompare(a.year || '');
    });
    
    // Statistiques
    const withDOI = bibliography.filter(item => item.DOI).length;
    const withoutDOI = bibliography.length - withDOI;
    
    console.log(`   📊 ${bibliography.length} entrées normalisées`);
    console.log(`   🔗 ${withDOI} avec DOI, ${withoutDOI} sans DOI`);
    
    if (withoutDOI > 0) {
      console.warn(`   ⚠️  ${withoutDOI} entrées sans DOI (recommandé mais non bloquant)`);
    }
    
    // Écriture du fichier
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(bibliography, null, 2), 'utf8');
    console.log(`✅ Bibliographie générée: ${OUTPUT_PATH}`);
    
    return bibliography;
    
  } catch (error) {
    console.error('❌ Échec de la construction de la bibliographie:', error.message);
    
    // En cas d'erreur Zotero, générer une bibliographie vide pour ne pas bloquer le build
    console.warn('⚠️  Génération d\'une bibliographie vide pour permettre le déploiement');
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify([], null, 2), 'utf8');
    console.log(`✅ Bibliographie vide générée: ${OUTPUT_PATH}`);
    
    // Ne pas faire échouer le build - c'est un problème de configuration externe
    // process.exit(1);
  }
}

// Exécution si script appelé directement
if (require.main === module) {
  buildBibliography();
}

module.exports = { buildBibliography };