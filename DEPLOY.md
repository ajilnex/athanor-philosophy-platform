# Guide de Déploiement - L'Athanor

Guide complet pour déployer la plateforme philosophique L'Athanor en production avec PostgreSQL et Vercel.

## Prérequis

- Node.js 18+ (Node.js 20+ recommandé)
- PostgreSQL (via service cloud comme Neon, PlanetScale, ou Supabase)
- Compte Vercel (Pro recommandé pour les timeouts étendus)
- Compte Cloudinary (pour le stockage PDF/images)
- Token GitHub (pour Git-as-CMS et OAuth)
- Compte Zotero (optionnel, pour bibliographie automatique)

## 📦 Pipeline de Build

Le script de build exécute automatiquement plusieurs tâches critiques :

```bash
npm run build
```

### Étapes du Build Optimisé (parallélisé + variables d'env harmonisées)

1. **`npx prisma generate`** - Génération du client Prisma
2. **`npx dotenv-cli -e .env.local`** - Variables d'environnement unifiées
3. **Groupe A (parallèle)** :
   - `build-bibliography.js` - Construction bibliographie Zotero (avec env)
   - `validate-citations.js` - Validation références (avec env)
   - `build-citation-map.js` - Mapping citations (avec env)
4. **Groupe B (parallèle)** :
   - `build-graph-billets.cjs` - Analyse liens MDX (avec env)
   - `render-graph-svg.cjs` - Génération SVG interactif (avec env)
5. **Groupe C (parallèle)** :
   - `build-search-index.js` - Index unifié billets + publications (avec env)
6. **`wait`** - Synchronisation de tous les groupes
7. **`next build`** - Build Next.js avec optimisations

⚙️ **Performance** : Pipeline parallélisé réduit le temps de build de ~60%
🔧 **Variables d'env** : dotenv-cli garantit cohérence entre local/prod
⚠️ **Serverless** : Timeout Vercel 45s build, surveillez les scripts lourds
🏗️ **TypeScript** : Analyse statique rapide avec `npm run typecheck:scripts`

💡 Bonnes pratiques build

- Ne pas exécuter `prisma migrate deploy` pendant le build. Appliquez les migrations en amont (manuellement ou via job dédié), puis lancez le build.
- En Preview Vercel (`VERCEL_ENV=preview`), la validation des citations est tolérante (warnings). En production, elle est stricte (échec si fautes).

## 🗄️ Configuration Base de Données

### PostgreSQL (Production)

La plateforme utilise **PostgreSQL** (plus SQLite). Configuration requise :

#### Variables d'environnement

```bash
# Base de données principale
DATABASE_URL="postgresql://username:password@host:port/database"

# Optionnel : URL directe (si pooling)
DIRECT_DATABASE_URL="postgresql://username:password@direct-host:port/database"
```

#### Migration et Setup (OBLIGATOIRE - migrations standardisées)

```bash
# PRODUCTION : Déploiement migrations uniquement
npx prisma migrate deploy

# DÉVELOPPEMENT : Migrations avec prompts
npx prisma migrate dev

# Génération du client Prisma (automatique dans build)
npx prisma generate

# Vérification statut migrations
npx prisma migrate status

# Note : db push abandonné au profit du système de migrations robuste
```

##### En cas d'historique bloqué (P3009)

- Si Vercel signale: `migrate found failed migrations ...` (P3009), corrigez l'historique:
  - Option A (Prisma): `prisma migrate resolve --applied <id_migration>` (en pointant vers la prod via `.env.production` avec `DATABASE_URL` et `DIRECT_DATABASE_URL`).
  - Option B (SQL direct via Neon): marquer la migration comme appliquée dans `_prisma_migrations` (voir docs Prisma). Faites une sauvegarde avant toute opération.
  - Relancez ensuite `prisma migrate deploy` hors build, puis un build normal.

#### Workflow de Synchronisation Prod → Dev (Nouveau)

```bash
# Étape 1 : Créer snapshot depuis production (Admin/DevOps)
npm run snapshot:create

# Étape 2 : Distribuer snapshot.json via Git
git add prisma/snapshot.json
git commit -m "feat: Nouveau snapshot production"

# Étape 3 : Reset développement avec données réalistes
npm run db:reset  # = migrate reset + restore from snapshot
```

### Providers Recommandés

- **Neon** : `postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/database`
- **Supabase** : `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres`
- **PlanetScale** : Support PostgreSQL avec connexions serverless

## ☁️ Configuration Vercel

### vercel.json

```json
{
  "regions": ["cdg1"],
  "framework": "nextjs"
}
```

- **Région** : `cdg1` (Paris) pour optimiser la latence
- **Framework** : Détection automatique Next.js

### next.config.js

Configuration avec optimisations intégrées :

```javascript
const nextConfig = {
  serverExternalPackages: ['@prisma/client'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Optimisation images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/u/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  // Performance
  poweredByHeader: false,
  reactStrictMode: true,
}
```

### Variables d'Environnement Vercel

Toutes les variables de `.env.example` doivent être configurées :

#### 🔑 Authentification

```bash
NEXTAUTH_URL="https://votre-site.vercel.app"
NEXTAUTH_SECRET="votre-secret-nextauth-genere"
```

#### 🗄️ Base de Données

```bash
DATABASE_URL="postgresql://username:password@host:port/database"
DIRECT_DATABASE_URL="postgresql://username:password@direct-host:port/database"  # Optionnel
```

Notes Neon (ou équivalent):

- Si l'accès est restreint par IP, autoriser les IP de build Vercel, ou assouplir temporairement (0.0.0.0/0) côté dev.
- Évitez toute opération de migration dans le step build pour prévenir les erreurs réseau (P1001) et d'historique (P3009).

#### 📚 Validation citations

```bash
# Preview tolérante (n'échoue pas sur fautes de citations)
VERCEL_ENV=preview
# Optionnel pour CI custom
CI_ALLOW_BIBLIO_ERRORS=1
```

#### 🔐 Sécurité API

```bash
ADMIN_API_KEY="cle-api-forte-generee"
```

#### ☁️ Cloudinary (Stockage)

```bash
# Production (compte principal)
CLOUDINARY_CLOUD_NAME="votre-cloud-name"
CLOUDINARY_API_KEY="votre-api-key"
CLOUDINARY_API_SECRET="votre-api-secret"

# Développement (pour workflow snapshot - optionnel)
CLOUDINARY_CLOUD_NAME_DEV="votre-dev-cloud-name"
CLOUDINARY_API_KEY_DEV="votre-dev-api-key"
CLOUDINARY_API_SECRET_DEV="votre-dev-api-secret"
```

#### 🤝 GitHub (Édition Collaborative)

```bash
GITHUB_TOKEN="ghp_votre-personal-access-token"
GITHUB_OWNER="votre-username"
GITHUB_REPO="nom-du-repo"
GITHUB_ID="oauth-app-id"
GITHUB_SECRET="oauth-app-secret"
```

#### 📚 Zotero (Bibliographie)

```bash
ZOTERO_GROUP_ID="6096924"  # ID du groupe Zotero public
ZOTERO_API_KEY="votre-zotero-api-key"  # Optionnel pour groupes privés
```

#### 🎨 Application

```bash
NEXT_PUBLIC_APP_NAME="L'Athanor"
NEXT_PUBLIC_APP_DESCRIPTION="Une collection d'articles de philosophie contemporaine"
```

#### 💬 Commentaires (Optionnel)

```bash
DISABLE_COMMENT_RATELIMIT="true"  # Pour serverless
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"  # Si Redis
UPSTASH_REDIS_REST_TOKEN="votre-token-redis"
```

## ✅ Statut Déploiement (Août 2025)

**🎉 SUCCÈS** : Build production Vercel + Infrastructure tests & qualité code complète

### Réalisations Récentes

- ✅ **Tests Jest + RTL** : Configuration complète avec mocks Next.js/Prisma/Cloudinary
- ✅ **Pre-commit Hooks** : Husky + lint-staged + Prettier automatique
- ✅ **ESLint 0 warnings** : Résolution warnings react-hooks/exhaustive-deps
- ✅ **Pipeline qualité** : Pre-commit (format + lint) + Pre-push (typecheck)
- ✅ **TypeScript robuste** : Exclusion tests + analyse statique rapide
- ✅ **Prettier uniformisé** : Configuration projet (single quotes, no semicolons)

### Résolutions Appliquées Précédentes

- ✅ **TypeScript** : Erreurs `null` vs `undefined` résolues avec opérateur `??`
- ✅ **Variables d'env** : DATABASE_URL configurée en production
- ✅ **Pipeline build** : Variables d'environnement harmonisées avec dotenv-cli
- ✅ **Migrations** : Système Prisma migrate standardisé
- ✅ **Suppression CRUD** : Articles + Cloudinary synchronisés
- ✅ **Précision sémantique** : `??` au lieu de `||` pour préserver chaînes vides
- ✅ **Analyse statique** : TypeScript rapide (<2s) pour scripts Node.js

### Derniers Logs Build Vercel

```
✓ Compiled successfully in 12.0s
✓ Collecting page data
✓ Generating static pages (111/111)
✓ Finalizing page optimization
```

## 🚀 Déploiement Vercel

### 1. Connexion GitHub

```bash
# Installation Vercel CLI
npm i -g vercel

# Connexion et setup
vercel login
vercel --prod
```

### 2. Configuration Variables

```bash
# Via CLI
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
# ... autres variables

# Ou via dashboard Vercel : Settings → Environment Variables
```

### 3. Déploiement

```bash
# Déploiement automatique via Git
git push origin main

# Ou déploiement manuel
vercel --prod
```

## 🔍 Vérifications Post-Déploiement

### 1. Test Build Local

```bash
# Vérifier que le build passe
npm run build

# Tests TypeScript (analyse statique rapide)
npm run typecheck           # App Next.js (<5s)
npm run typecheck:scripts   # Scripts Node.js (<2s)

# Tests de qualité
npm run lint               # ESLint

# Vérifier la génération des assets
ls -la public/graph-billets.json
ls -la public/search-index.json
ls -la public/bibliography.json
ls -la public/search-index.json
ls -la public/citations-map.json
```

### 2. Test Base de Données

```bash
# Vérifier le statut des migrations (OBLIGATOIRE)
npx prisma migrate status

# Vérifier la connexion avec variables d'env
npm run db:migrate:status

# Test du workflow de synchronisation (développement)
npm run snapshot:restore   # Depuis snapshot existant
npm run db:reset           # Reset complet + restore

# Note : db push abandonné pour migrations robustes
```

### 3. Tests Automatisés Complets

```bash
# Tests unitaires et d'intégration
npm test                    # Jest + React Testing Library
npm run test:watch         # Mode watch pour développement
npm run test:coverage      # Rapport de couverture

# Tests end-to-end
npm run test:e2e           # Tests Playwright
npm run test:backlink      # Test spécifique backlinks avec logs
npm run test:ui            # Interface Playwright

# Tests avec capture de logs (debug)
PLAYWRIGHT_WEB_SERVER=none npm run test:backlink --headed

# Qualité code (automatique via hooks)
npm run lint               # ESLint + fix automatique
npm run format:check       # Vérifier formatage Prettier
```

### 4. Tests Fonctionnels Manuels

#### Fonctionnalités Core

- [ ] **Accueil** : Page charge avec polices optimisées (IBM Plex Serif + Inter)
- [ ] **Recherche** : Index unifié billets + publications (`/search`)
- [ ] **Publications** : PDF accessibles avec ISR 300s (`/publications/[slug]`)
- [ ] **Billets** : Contenu MDX + backlinks (`/billets/[slug]`)
- [ ] **Graphe** : SVG interactif avec survols + données filtrées
- [ ] **Admin** : Upload Cloudinary + suppression synchronisée (`/admin`)
- [ ] **Editor** : Backlink picker avec recherche billets (`/admin/editor`)
- [ ] **Comments** : Système commentaires avec avatars next/image optimisés
- [ ] **Bibliographie** : Citations Zotero + composant `<Bibliography />`

#### Performance & Technique

- [ ] **Performance** : Web Core Vitals (LCP < 2.5s, CLS < 0.1)
- [ ] **Migrations** : Système Prisma migrate (pas db push)
- [ ] **TypeScript** : Analyse statique scripts (<2s) + app (<5s)

#### Tests & Qualité Code

- [ ] **Tests Jest** : Tests unitaires passent (npm test)
- [ ] **Tests E2E** : Tests Playwright passent (npm run test:e2e)
- [ ] **Pre-commit Hooks** : ESLint --fix + Prettier --write automatiques
- [ ] **Pre-push Hooks** : TypeScript check bloque si erreurs
- [ ] **Code Quality** : ESLint 0 warnings + Prettier formatage uniforme
- [ ] **Mocks** : NextAuth, Prisma, Cloudinary fonctionnent en tests
- [ ] **Coverage** : Rapport de couverture généré correctement

## ⚠️ Limitations Serverless

### Timeouts

- **Vercel Hobby** : 10s par fonction
- **Vercel Pro** : 60s par fonction
- **Build** : 45s maximum

### Scripts Build

Les scripts peuvent échouer en serverless si :

- **Bibliographie** : API Zotero lente ou inaccessible
- **Graphe** : Trop de billets MDX à analyser (>100)
- **Recherche** : Index trop volumineux (publications + billets)
- **Citations** : Validation massive de références
- **SVG** : Rendu graphique complexe avec interactions

### Solutions

1. **Pipeline parallélisé** : Déjà implémenté (gain 60%)
2. **Cache intelligent** : Réutiliser `public/*.json` si pas de changements
3. **ISR** : Pages statiques avec revalidation (publications : 300s)
4. **Build séparé** : CI/CD GitHub Actions pour assets lourds
5. **Edge Functions** : Recherche et commentaires
6. **Incremental** : Rebuilder seulement les parties modifiées

## 🔧 Dépannage

### Build Failed

```bash
# Vérifier les dépendances
npm ci

# Tester le build localement
npm run build

# Vérifier les variables d'env
printenv | grep DATABASE_URL
```

### Database Connection

```bash
# Test de connexion
npx prisma db push --accept-data-loss

# Vérifier le schema
npx prisma introspect
```

### Scripts Timeout

Si les scripts de build dépassent les timeouts :

1. Augmenter la limite Vercel (plan Pro)
2. Optimiser les scripts (pagination, cache)
3. Pre-build via GitHub Actions
4. Séparer en API routes

### Tests Failed

```bash
# Tests Jest
npm test -- --verbose      # Mode débogage
npm run test:coverage      # Vérifier couverture

# Tests Playwright
npm run test:e2e -- --headed  # Mode visuel
npm run test:ui               # Interface debug

# Nettoyer cache tests
npm test -- --clearCache
```

### Git Hooks Issues

```bash
# Réinstaller Husky si nécessaire
npm run prepare

# Vérifier configuration lint-staged
npm run lint -- --fix        # Test ESLint manuel
npm run format               # Test Prettier manuel

# Déboguer pre-commit
git commit --no-verify       # Bypass temporaire
```

### Code Quality Issues

Problèmes de qualité code :

1. **ESLint warnings** : Fix automatique via pre-commit hooks
2. **Format inconsistant** : Prettier force uniformité
3. **TypeScript errors** : Pre-push hook bloque push
4. **Tests failing** : `npm test -- --watch` pour débogage
5. **Mock issues** : Vérifier jest.setup.js configuration

---

## 📚 Références

- [Variables d'environnement complètes](./.env.example)
- [Configuration Next.js](./next.config.js)
- [Pipeline build](./package.json) (script `build`)
- [Schema Prisma](./prisma/schema.prisma)
