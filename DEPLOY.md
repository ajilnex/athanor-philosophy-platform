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

### Étapes du Build Optimisé (parallélisé)

1. **`npx prisma generate`** - Génération du client Prisma
2. **Groupe A (parallèle)** :
   - `build-bibliography.js` - Construction bibliographie Zotero
   - `validate-citations.js` - Validation références
   - `build-citation-map.js` - Mapping citations
3. **Groupe B (parallèle)** :
   - `build-graph-billets.cjs` - Analyse liens MDX
   - `render-graph-svg.cjs` - Génération SVG interactif
4. **Groupe C (parallèle)** :
   - `build-search-index.js` - Index unifié (billets + publications)
5. **`wait`** - Synchronisation de tous les groupes
6. **`next build`** - Build Next.js avec optimisations

⚙️ **Performance** : Pipeline parallélisé réduit le temps de build de ~60%
⚠️ **Serverless** : Timeout Vercel 45s build, surveillez les scripts lourds

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

#### Migration et Setup

```bash
# Après configuration de DATABASE_URL
npx prisma db push

# Ou avec migrations (recommandé en production)
npx prisma migrate deploy

# Génération du client Prisma
npx prisma generate

# Seed de données (optionnel)
npx prisma db seed
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
    serverComponentsExternalPackages: ['@prisma/client']
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
      }
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

#### 🔐 Sécurité API
```bash
ADMIN_API_KEY="cle-api-forte-generee"
```

#### ☁️ Cloudinary (Stockage)
```bash
CLOUDINARY_CLOUD_NAME="votre-cloud-name"
CLOUDINARY_API_KEY="votre-api-key"
CLOUDINARY_API_SECRET="votre-api-secret"
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

# Vérifier la génération des assets
ls -la public/graph-billets.json
ls -la public/search-index.json
```

### 2. Test Base de Données

```bash
# Vérifier la connexion
npx prisma db push --preview-feature

# Test des migrations
npx prisma migrate status
```

### 3. Tests Fonctionnels

- [ ] **Accueil** : Page charge avec polices optimisées
- [ ] **Recherche** : Index unifié billets + publications (`/recherche`)
- [ ] **Publications** : PDF accessibles avec ISR (`/publications/[slug]`)
- [ ] **Billets** : Contenu MDX + backlinks (`/billets/[slug]`)
- [ ] **Graphe** : SVG interactif avec survols (`/graphe`)
- [ ] **Admin** : Upload Cloudinary + modération (`/admin`)
- [ ] **Comments** : Système commentaires avec avatars optimisés
- [ ] **Performance** : Web Core Vitals (LCP < 2.5s, CLS < 0.1)
- [ ] **Bibliographie** : Citations Zotero + composant `<Bibliography />`

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

---

## 📚 Références

- [Variables d'environnement complètes](./.env.example)
- [Configuration Next.js](./next.config.js)
- [Pipeline build](./package.json) (script `build`)
- [Schema Prisma](./prisma/schema.prisma)