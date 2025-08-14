// Charge les variables d'environnement
require('dotenv').config({ path: '.env.local' });

const { execSync } = require('node:child_process');

const isProd = (process.env.VERCEL_ENV === 'production') || (process.env.NODE_ENV === 'production');

execSync('npx prisma generate', { stdio:'inherit' });
execSync('npx prisma db push --accept-data-loss', { stdio:'inherit' });

// NOTE: Billets sont maintenant 100% statiques (filesystem uniquement)
// La synchronisation DB a été désactivée pour éviter les conflits
console.log('📝 Billets: Mode statique (pas de sync DB)');

// Génération de la bibliographie depuis Zotero
console.log('📚 Génération de la bibliographie...');
execSync('node scripts/build-bibliography.js', { stdio:'inherit' });

// Validation des citations
console.log('🔍 Validation des citations...');
execSync('node scripts/validate-citations.js', { stdio:'inherit' });

// Construction de la carte des citations
console.log('🗺️ Construction de la carte des citations...');
execSync('node scripts/build-citation-map.js', { stdio:'inherit' });

// Génération de l'index de recherche unifié
console.log('🔍 Génération de l\'index de recherche...');
execSync('node scripts/build-search-index.js', { stdio:'inherit' });

// IMPORTANT: Lancer le build Next.js après la préparation des données
console.log('🏗️ Lancement du build Next.js...');
execSync('npx next build', { stdio:'inherit' });
