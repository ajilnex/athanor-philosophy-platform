# Athanor - Plateforme Philosophique

Une plateforme moderne pour publier et consulter des articles de philosophie avec recherche avancée, graphe des billets et optimisations performance.

## Fonctionnalités

- ✨ **Interface moderne** - Design académique optimisé avec next/font
- 📚 **Publications PDF** - Gestion intégrée avec Cloudinary
- 📝 **Billets MDX** - Système Git-as-CMS avec backlinks automatiques
- 🕰️ **Graphe interactif** - Visualisation des connexions entre billets
- 🔍 **Recherche unifiée** - Index statique avec snippets contextuels
- 🚀 **Performance** - ISR, optimisation images, pipeline parallélisé
- 💬 **Système de commentaires** - Modération et hiérarchie
- 📚 **Bibliographie Zotero** - Intégration citations automatiques
- 🧪 **Tests automatisés** - Jest + React Testing Library + Playwright
- 🔧 **Qualité code** - Pre-commit hooks automatiques (ESLint + Prettier)
- 📂 **Workflow de synchronisation** - Snapshot prod → dev avec Cloudinary
- 📱 **Responsive** - Optimisé pour tous les appareils

## Technologies

### Stack Principal

- **Next.js 15.4.6** - Framework React avec App Router et optimisations
- **React 19.0.0** - Bibliothèque d'interface utilisateur (version finale)
- **TypeScript** - Typage statique strict
- **Tailwind CSS** - Framework CSS utilitaire
- **PostgreSQL** - Base de données (Docker local / Neon production)
- **Prisma 6.14.0** - ORM moderne avec génération type-safe

### Contenu & Performance

- **MDX natif** - Support MDX via @mdx-js/mdx 3.1.0
- **next/font** - Optimisation polices (IBM Plex Serif + Inter)
- **next/image** - Optimisation images automatique
- **ISR** - Incremental Static Regeneration pour performance
- **Fuse.js 7.0.0** - Recherche floue avancée

### Services & Intégrations

- **NextAuth.js 4.24.5** - Authentification (GitHub OAuth + Credentials)
- **Cloudinary** - Stockage et optimisation PDF/images
- **Zotero API** - Bibliographie et citations automatiques
- **Playwright** - Tests E2E automatisés avec capture de logs
- **Vercel** - Déploiement avec auto-build sur push

## Installation

1. **Clonez le dépôt**

   ```bash
   git clone <url-du-repo>
   cd athanor
   ```

2. **Installez les dépendances**

   ```bash
   npm install
   ```

3. **Configurez l'environnement**

   ```bash
   cp .env.example .env.local
   ```

   Modifiez `.env.local` avec vos variables d'environnement :

   ```bash
   # Base de données (Docker local)
   DATABASE_URL="postgresql://user:password@localhost:5432/athanor_dev"
   DIRECT_DATABASE_URL="postgresql://user:password@localhost:5432/athanor_dev"

   # Authentification
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"

   # GitHub (pour Git-as-CMS)
   GITHUB_TOKEN="ghp_your_github_token"
   GITHUB_OWNER="your-username"
   GITHUB_REPO="philosophy-platform"

   # Cloudinary (pour uploads)
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"

   # Zotero (pour bibliographie)
   ZOTERO_GROUP_ID="your-group-id"
   ZOTERO_API_KEY="your-zotero-key"
   ```

4. **Lancez PostgreSQL avec Docker**

   ```bash
   # Option 1: Docker command direct
   docker run --name postgres-athanor -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -e POSTGRES_DB=athanor_dev -p 5432:5432 -d postgres:15

   # Option 2: Script npm (recommandé)
   npm run db:dev:start
   ```

5. **Initialisez la base de données**

   ```bash
   npm run db:migrate:dev    # Synchronise le schéma avec migrations
   ```

6. **Lancez le serveur de développement**

   ```bash
   npm run dev
   ```

7. **Ouvrez votre navigateur**
   ```
   http://localhost:3000
   ```

## Structure du projet

```
philosophy-platform/
├── app/                    # App Router de Next.js
│   ├── admin/             # Interface d'administration
│   ├── billets/           # Pages des billets (MDX)
│   ├── edition/           # Maison d'édition et auteurs
│   ├── publications/      # Pages des publications
│   ├── search/            # Page de recherche
│   └── api/              # Routes API
├── components/            # Composants React réutilisables
│   ├── graph/            # Composants de visualisation
│   ├── layout/           # Composants de mise en page
│   ├── publications/     # Composants PDF et publications
│   └── ui/               # Composants d'interface
├── content/              # Contenu MDX
│   └── billets/          # Billets au format MDX
├── lib/                  # Utilitaires et configuration
├── prisma/               # Schéma et migrations de base de données
├── scripts/              # Scripts de build et utilitaires
└── public/               # Fichiers statiques
    ├── images/           # Images et assets
    └── uploads/          # Fichiers PDF uploadés
```

## Administration

### Publications (PDF - Dynamique)

Accédez à l'interface d'administration via `/admin` pour :

- **Ajouter des articles** - Upload de fichiers PDF avec métadonnées sur Cloudinary
- **Gérer les articles** - Publier/dépublier, modifier, supprimer
- **Voir les statistiques** - Nombre d'articles, taille totale, etc.

### Gestion des Billets (Workflow Git)

La section "Billets" fonctionne sur un principe de "Git-as-a-CMS". Toute gestion de contenu se fait directement via des commandes Git.

- **Pour créer un billet :** Ajoutez un nouveau fichier `.md` dans le dossier `content/billets/`, puis exécutez `git add`, `git commit`, et `git push`.
- **Pour modifier un billet :** Éditez le fichier `.md` correspondant, puis exécutez `git add`, `git commit`, et `git push`.
- **Pour supprimer un billet :** Utilisez la commande `git rm` pour supprimer le fichier, puis exécutez `git commit` et `git push`.
  ```bash
  # Exemple de suppression de billet
  git rm content/billets/2025-08-05-dialectique-du-pomodoro.md
  git commit -m "Suppression: billet sur le pomodoro"
  git push
  ```

## Développement

### Scripts disponibles

#### Développement

- `npm run dev` - Serveur de développement
- `npm run lint` - Vérification ESLint
- `npm run typecheck` - Vérification TypeScript

#### Build & Production

- `npm run build` - Build optimisé avec pipeline parallélisé
- `npm run start` - Serveur de production

#### Base de données

- `npm run db:dev:start` - Lance PostgreSQL Docker
- `npm run db:migrate:dev` - Migrations développement
- `npm run db:migrate:deploy` - Migrations production
- `npm run db:studio` - Interface Prisma Studio

#### Synchronisation & Snapshots

- `npm run snapshot:create` - Créer snapshot production
- `npm run snapshot:restore` - Restaurer depuis snapshot
- `npm run db:reset` - Reset complet + restore snapshot

#### Contenu & Assets

- `npm run graph:build` - Génère le graphe des billets
- `npm run graph:svg` - Rend le SVG interactif
- `npm run search:build` - Reconstruit l'index de recherche

#### Tests

```bash
# Tests unitaires et d'intégration
npm run test:unit         # Jest + React Testing Library
npm run test:unit:watch   # Mode watch pour développement
npm run test:unit:coverage # Rapport de couverture

# Tests E2E
npm run test              # Tests Playwright E2E
npm run test:ui           # Interface Playwright
npm run test:backlink     # Test spécifique backlinks

# Qualité code
npm run typecheck         # Vérification TypeScript
npm run lint              # ESLint + correction automatique
npm run format            # Formatage Prettier
npm run format:check      # Vérifier format sans modifier

# Git hooks (automatiques)
# git commit -> ESLint --fix + Prettier --write
# git push -> npm run typecheck (bloque si erreurs)
```

### Ajout d'articles

1. Allez sur `/admin/upload`
2. Sélectionnez un fichier PDF (max 50MB)
3. Remplissez les métadonnées (titre, description, auteur, mots-clés)
4. Cliquez sur "Ajouter l'Article"

## Production

**✅ STATUT** : Production déployée avec succès sur Vercel (Août 2025)

Pour déployer en production :

1. **Build du projet**

   ```bash
   npm run build  # Pipeline parallélisé optimisé
   ```

2. **Configuration de la base de données**
   - PostgreSQL avec système de migrations Prisma
   - Variables d'environnement configurées
   - Snapshot workflow pour synchronisation prod → dev

3. **Variables d'environnement**
   - `DATABASE_URL` - URL de la base de données
   - `NEXTAUTH_URL` - URL de votre site
   - `NEXTAUTH_SECRET` - Clé secrète pour l'authentification
   - Voir `DEPLOY.md` pour la liste complète

## Personnalisation

### Thème et couleurs

Modifiez les couleurs dans `tailwind.config.ts` :

```typescript
colors: {
  primary: { /* Couleurs principales */ },
  accent: { /* Couleurs d'accent */ }
}
```

### Typographie

Les polices sont optimisées via next/font dans `app/layout.tsx` :

- **IBM Plex Serif** pour les titres et contenu (serif) avec variables CSS
- **Inter** pour l'interface utilisateur (sans-serif) avec variables CSS
- **Optimisations** : `display: 'swap'`, preload automatique, subsetting

```typescript
// Variables CSS disponibles
--font-serif: IBM Plex Serif (poids 300, 400, 500, 600 + italiques)
--font-sans: Inter (poids 300, 400, 500, 600, 700)
```

## Tests & Qualité

### Infrastructure Tests

#### Tests Unitaires (Jest + React Testing Library)

- **Configuration Jest** - Support Next.js, TypeScript, path mapping (@/\*)
- **Mocks automatiques** - NextAuth, Prisma, Cloudinary, next/router, next/image
- **Coverage** - Rapports de couverture de code pour composants critiques
- **Scripts** : `npm run test:unit`, `npm run test:unit:watch`, `npm run test:unit:coverage`

#### Tests E2E (Playwright)

- **Tests Playwright** - Tests end-to-end avec webServer intégré
- **CI/CD** - Infrastructure PostgreSQL automatique via GitHub Actions
- **Configuration** - Timeout CI 300s, traces et vidéos sur échec
- **Scripts** : `npm run test`, `npm run test:ui`, `npm run test:backlink`

### Git Hooks Automatiques

- **Pre-commit** - ESLint --fix + Prettier --write via lint-staged
- **Pre-push** - Vérification TypeScript obligatoire (bloque si erreurs)
- **Performance** - Traitement uniquement des fichiers modifiés
- **Workflow** - Qualité code garantie automatiquement

### Configuration Prettier

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100
}
```

### Tests E2E

- **Playwright** - Tests E2E avec capture de logs en temps réel
- **TypeScript** - Analyse statique stricte avec exclusion tests pour performance
- **ESLint** - 0 warnings maintenu automatiquement (react-hooks/exhaustive-deps résolu)

### Workflow de Synchronisation

1. **Production → Développement**
   - Script `create-snapshot.ts` pour export données + Cloudinary
   - Script `restore-from-snapshot.ts` pour import local
   - Commande unifiée `npm run db:reset` pour reset complet

2. **Migrations Base de Données**
   - Système Prisma migrate (pas db push)
   - Variables d'environnement harmonisées avec dotenv-cli
   - Séparation dev/prod avec commandes dédiées

## Support

Pour toute question ou problème, veuillez créer une issue dans le dépôt GitHub.
