# Athanor - Plateforme Philosophique

Une plateforme moderne pour publier et consulter des articles de philosophie avec recherche avancée, graphe des billets et optimisations performance.

## Fonctionnalités

- ✨ **Interface moderne** - Design académique optimisé avec next/font
- 📚 **Publications PDF** - Gestion intégrée avec Cloudinary
- 📰 **Presse‑papier** - Liens lus par l'équipe, avec aperçus OpenGraph
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

- **Next.js** - Framework React avec App Router et optimisations
- **React 19** - Bibliothèque d'interface utilisateur
- **TypeScript** - Typage statique strict
- **Tailwind CSS** - Framework CSS utilitaire (palette Solarized)
- **PostgreSQL** - Base de données (Docker local / Neon production)
- **Prisma** - ORM moderne avec génération type-safe

### Contenu & Performance

- **MDX natif** - Support MDX via @mdx-js/mdx
- **next/font** - Optimisation polices (IBM Plex Serif + Inter)
- **next/image** - Optimisation images automatique
- **ISR** - Incremental Static Regeneration pour performance
- **Fuse.js + Lunr** - Recherche floue et plein texte

### Services & Intégrations

- **NextAuth.js** - Authentification (GitHub OAuth + Credentials)
- **Cloudinary** - Stockage et optimisation PDF/images
- **Zotero API** - Bibliographie et citations automatiques
- **Google Cloud Vision / Tesseract** - OCR pour les archives
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
   nvm use
   npm ci
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

4. **Téléchargez les polices (iA Writer Duo)**

   Pour éviter les erreurs de format de polices et améliorer les performances locales, téléchargez les polices iA Writer Duo en local:

   ```bash
   npm run fonts:download
   ```

   Note: certains fichiers `.woff2` placés manuellement dans `public/fonts/` peuvent en réalité contenir du HTML (téléchargés via l'UI GitHub). Si vous voyez « Unknown font format » au build, supprimez les fichiers corrompus de `public/fonts/` et utilisez les fichiers téléchargés dans `public/fonts/ia-writer/` (copiez-les si nécessaire vers `public/fonts/`).

5. **Lancez PostgreSQL avec Docker**

   ```bash
   # Option 1: Docker command direct
   docker run --name postgres-athanor -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -e POSTGRES_DB=athanor_dev -p 5432:5432 -d postgres:15

   # Option 2: Script npm (recommandé)
   npm run db:dev:start
   ```

6. **Initialisez la base de données**

   ```bash
   npm run db:migrate:dev   # Applique les migrations en local
   ```

7. **Lancez le serveur de développement**

   ```bash
   npm run dev
   ```

8. **Ouvrez votre navigateur**
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
│   ├── graphe/            # Visualisation graphique
│   ├── publications/      # Pages des publications
│   ├── presse-papier/     # Page publique Presse‑papier
│   ├── recherche/         # Page de recherche
│   └── api/              # Routes API
├── components/            # Composants React réutilisables
│   ├── graph/            # Composants de visualisation
│   ├── layout/           # Composants de mise en page
│   ├── publications/     # Composants PDF et publications
│   └── ui/               # Composants d'interface
├── content/              # Contenu MDX
│   └── billets/          # Billets au format MDX
├── lib/                  # Utilitaires et configuration
│   ├── presse-papier.ts  # Accès DB Presse‑papier (Prisma)
│   └── link-preview.server.ts # Récupération métadonnées OpenGraph
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

### Presse‑papier (Liens avec aperçus)

- Accès admin: `/admin/presse-papier`
- Ajouter un lien (URL + note) → les métadonnées (titre, image, site) sont récupérées automatiquement si disponibles (OpenGraph/Twitter)
- Page publique: `/presse-papier` (+ aperçu des 3 derniers liens sur la page d’accueil)

## Développement

### Scripts disponibles

#### Développement

- `npm run dev` - Serveur de développement
- `npm run lint` - Vérification ESLint
- `npm run typecheck` - Vérification TypeScript

#### Build & Production

- `npm run build` - Build optimisé (bibliographie, validation citations, graphe, index, puis Next.js)
- `npm run start` - Serveur de production
- `npm run test:build` - Smoke test du build (valide index de recherche, biblio, graphe, sortie `.next`)

#### Base de données

- `npm run db:dev:start` - Lance PostgreSQL Docker
- `npm run db:migrate:dev` - Migrations développement
- `npm run db:migrate:deploy` - Migrations production (à exécuter hors build CI)
- `npm run db:studio` - Interface Prisma Studio

#### Synchronisation & Snapshots

- `npm run snapshot:create` - Créer snapshot production
- `npm run snapshot:restore` - Restaurer depuis snapshot
- `npm run db:reset` - Reset complet + restore snapshot

#### Contenu & Assets

- `npm run graph:build` - Génère le graphe des billets
- `npm run graph:svg` - Rend le SVG interactif
- `npm run search:build` - Reconstruit l'index de recherche
- `npm run backup:feu-humain` - Sauvegarde complète de l'archive FEU HUMAIN (DB → JSON)

Notes index de recherche:

- Les billets (.mdx) sont indexés hors base de données.
- Les publications (PDF) sont indexées depuis la base via Prisma (champ `Article.filePath`). Ce champ doit pointer vers une URL HTTP(S) accessible (ex: Cloudinary). En local, si vous pointez vers une URL relative (`/uploads/…`), assurez-vous que l’URL complète construite avec `NEXTAUTH_URL` est joignable pendant le build — sinon seuls les billets seront indexés.

#### Tests

```bash
# Tests unitaires et d'intégration
npm test                  # Jest + React Testing Library
npm run test:watch        # Mode watch pour développement
npm run test:coverage     # Rapport de couverture

# Tests E2E
npm run test:e2e          # Tests Playwright
npm run test:ui           # Interface Playwright

# Qualité code
npm run typecheck         # Vérification TypeScript
npm run lint              # ESLint + correction automatique
npm run format            # Formatage Prettier
npm run format:check      # Vérifier format sans modifier

# Git hooks (automatiques)
# pre-commit -> ESLint --fix + Prettier --write (lint-staged)
# pre-push   -> typecheck + build bibliographie + validation citations
# Note: en Preview Vercel, la validation des citations est tolérante (warning). En prod, elle est stricte.
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

## Monitoring (Sentry)

- Sentry capture les erreurs, performances et traces côté serveur/client, avec upload des sourcemaps pour des stacktraces lisibles.
- Configuration déjà intégrée: `withSentryConfig` dans `next.config.js` et fichiers d'initialisation (client/server/edge) + `instrumentation.ts` + `app/global-error.tsx`.

Étapes de configuration:

- Ajoutez les variables d'env:
  - `SENTRY_DSN` (ou `NEXT_PUBLIC_SENTRY_DSN`)
  - `SENTRY_ENVIRONMENT` (ex: `production`, `preview`, `development`)
  - En CI (Vercel): `SENTRY_AUTH_TOKEN` pour l'upload automatique des sourcemaps.
- Déployez; vérifiez dans Sentry que les événements et releases apparaissent.

Tester localement:

- Définissez `SENTRY_DSN` et lancez un build/dev.
- Provoquez une erreur (ex: bouton qui `throw new Error("Test Sentry")`) et vérifiez l'évènement dans Sentry.
- Partagez l’Event ID avec l’équipe (ou avec l’agent) pour l’analyse ciblée.

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

- **Jest + React Testing Library** - Tests unitaires et d'intégration avec mocks complets
- **Configuration Jest** - Support Next.js, TypeScript, path mapping (@/\*)
- **Mocks automatiques** - NextAuth, Prisma, Cloudinary, next/router, next/image
- **Coverage** - Rapports de couverture de code pour composants critiques

### Git Hooks Automatiques

- **Pre-commit** - ESLint --fix + Prettier --write via lint-staged
- **Pre-push** - TypeScript + bibliographie + validation des citations (bloque si erreurs locales)
- **Preview vs Prod** - Tolérant en Preview Vercel (warnings), strict en prod (échec si fautes)

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
   - Système Prisma migrate (pas de `db push` en prod)
   - Variables d'environnement harmonisées avec dotenv-cli
   - Séparation dev/prod avec commandes dédiées; ne pas exécuter de migrations pendant le build

## Citations & Bibliographie

- Les balises `<Cite item="..." />` sont validées au build; en cas de faute, le build Preview émet un avertissement, la Prod échoue.
- Pour montrer un “mauvais exemple” dans un billet sans faire échouer la validation, utilisez un bloc de code ou échappez les chevrons: `&lt;Cite item="MauvaiseCle" /&gt;`.

Astuce migration de clés: si vous avez des anciennes citekeys, utilisez le script `npm run bibliography:migrate-keys` pour proposer des clés cohérentes à partir du contenu Zotero.

## Support

Pour toute question ou problème, veuillez créer une issue dans le dépôt GitHub.

## Dépannage

- Polices iA Writer: « Unknown font format »
  - Cause: fichiers `.woff2` corrompus (HTML GitHub enregistré en `.woff2`).
  - Fix: `npm run fonts:download` afin de récupérer `public/fonts/ia-writer/*`. Supprimez les mauvais fichiers de `public/fonts/` et copiez les `.woff2` valides si votre configuration attend ces fichiers à la racine.

- Sentry: avertissements « instrumentation file » et « global error handler »
  - Option 1 (recommandé): compléter l’installation Sentry (ajouter `instrumentation.ts` et un `app/global-error.tsx`). Voir la doc: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  - Option 2 (local uniquement): supprimer les avertissements en définissant les variables d’env: `SENTRY_SUPPRESS_INSTRUMENTATION_FILE_WARNING=1` et `SENTRY_SUPPRESS_GLOBAL_ERROR_HANDLER_FILE_WARNING=1`.

- Index recherche: publications non indexées et logs « fetch failed/timeout »
  - Cause: le script d’extraction PDF tente de télécharger le PDF via HTTP(S). Une URL injoignable (ex: placeholder `https://example.com/...`) provoque un timeout.
  - Fix: utilisez des URLs Cloudinary réelles ou mettez temporairement les publications hors index (les billets seront indexés quand même). Pour tests locaux, privilégiez une URL HTTP joignable.

- Validation des citations: clés invalides (ex: `Blok1978` → `Block1978`)
  - Fix: corrigez la clé dans le billet pour correspondre à la bibliographie générée (`public/bibliography.json`) puis relancez le build. En Preview, c’est un warning; en production, c’est bloquant.
