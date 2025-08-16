# Mémoire Externe pour Claude Code - Plateforme L'Athanor

## ÉTAT ACTUEL - Workflow de Synchronisation Complet ✅

**Dernière réalisation majeure** : Système de snapshot prod→dev opérationnel
- ✅ **Workflow Snapshot** : Scripts create-snapshot.ts + restore-from-snapshot.ts
- ✅ **Synchronisation BDD** : Données publiques prod → dev avec anonymisation
- ✅ **Migration Cloudinary** : Fichiers prod → dev automatique (comptes séparés)
- ✅ **Commande unifiée** : `npm run db:reset` (migrate reset + restore)
- ✅ **Sécurité** : Données sensibles exclues, contenu scellé filtré
- ✅ **Documentation** : Guide complet dans docs/SNAPSHOT_WORKFLOW.md

**Fichiers créés/modifiés récemment :**
- `scripts/create-snapshot.ts` : Création snapshot BDD + migration Cloudinary
- `scripts/restore-from-snapshot.ts` : Restauration avec admin local
- `package.json` : Scripts snapshot + commande db:reset unifiée
- `docs/SNAPSHOT_WORKFLOW.md` : Documentation équipe complète
- `.env.production.example` : Template variables prod

---

## ARCHITECTURE TECHNIQUE ACTUELLE

**Stack Principal :**
- **Framework** : Next.js 15.4.6 (App Router) avec optimisations performance
- **React** : 19.0.0 (version finale)
- **Base de données** : PostgreSQL (Docker local / Neon prod) + Prisma 6.14.0
- **Authentification** : NextAuth.js 4.24.5 + GitHub OAuth + Credentials
- **Contenu** : MDX natif (@mdx-js/mdx 3.1.0) + Git-as-CMS
- **Polices** : next/font/google (IBM Plex Serif + Inter) avec CSS variables
- **Images** : next/image avec optimisation automatique + remotePatterns
- **Déploiement** : Vercel (auto-deploy sur push main)
- **Recherche** : Index statique (Fuse.js 7.0.0)
- **Bibliographie** : API Zotero + cache statique

### PIPELINE DE BUILD OPTIMISÉ (package.json)
1. **Prisma** : Génération client automatique
2. **Parallélisation** : 
   - Groupe A : `build-bibliography.js` + `validate-citations.js` + `build-citation-map.js`
   - Groupe B : `build-graph-billets.cjs` + `render-graph-svg.cjs`
   - Groupe C : `build-search-index.js`
3. **Synchronisation** : `wait` pour finaliser tous les groupes
4. **Next.js** : Build final avec SSG et optimisations intégrées

**Performance** : Build parallélisé réduit le temps de ~60% vs séquentiel

### COMMANDES ESSENTIELLES
```bash
# Développement (avec Docker PostgreSQL)
npm run db:dev:start        # Démarre DB locale
npm run dev                 # Serveur de développement

# Build complet optimisé (avec dotenv-cli standardisé)
npm run build               # Pipeline parallélisé complet avec variables d'env
npm run graph:build         # Graph seul avec variables d'env
npm run graph:svg           # SVG seul avec variables d'env
npm run bibliography:build  # Bibliographie Zotero seule
npm run search:build        # Index de recherche seul

# Performance & Optimisations
npm run lint                # ESLint + code quality

# Base de données (migrations standardisées)
npm run db:migrate:dev      # Migration dev (local) avec dotenv-cli
npm run db:migrate:deploy   # Migration prod (sans prompt)
npm run db:migrate:status   # Statut des migrations avec dotenv-cli
npm run db:studio           # Interface Prisma avec variables d'env
npm run db:dev:reset        # Reset complet Docker + migrations

# Synchronisation prod↔dev (nouveau workflow)
npm run snapshot:create     # Créer snapshot depuis production
npm run snapshot:restore    # Restaurer depuis snapshot existant
npm run db:reset            # Reset + restore (commande unifiée développeurs)
```

### MODÈLES DE DONNÉES (Prisma Schema)

**User** : `id`, `email`, `role` (VISITOR/USER/ADMIN), `hashedPassword`
**Article** : PDFs uploadés via Cloudinary, `isSealed` (protection)
**Billet** : Métadonnées DB, mais **contenu = 100% filesystem**

⚠️ **IMPORTANT** : Billets = source unique `content/billets/*.mdx`
- DB sert uniquement pour métadonnées (si besoin)
- Suppression = déplacement vers `content/trash/`
- GitHub API vérifie statut trash via `isFileInTrash()`

### GESTION DU CONTENU

**Billets** :
- **Source** : `content/billets/*.mdx` (Git)
- **Supprimés** : `content/trash/*.mdx` (soft delete)
- **Backlinks** : `[[titre]]` → liens automatiques
- **Citations** : `<Cite item="key" />` + `<Bibliography />`

**Publications** :
- **Fichiers** : PDF via Cloudinary
- **Base** : Métadonnées dans PostgreSQL
- **Recherche** : Texte extrait avec pdf-parse

**Bibliographie** :
- **Source** : Zotero Group API (ID: dans .env)
- **Cache** : `public/bibliography.json` (régénéré au build)
- **Composants** : `Bibliography`, `Cite`, `BibliographyIndex`

### SYSTÈME DE RÔLES
```typescript
enum Role {
  VISITOR  // Lecture seule
  USER     // Contribution via Pull Requests
  ADMIN    // Écriture directe + gestion
}
```

**Workflow de contribution :**
- **ADMIN** : Écriture directe sur `main` via GitHub API
- **USER** : Branche + Pull Request automatique
- **VISITOR** : Lecture uniquement

### COMPOSANTS CRITIQUES

**Suppression Optimiste** :
- `EditBilletButton` : Suppression visuelle instant + API background
- `BilletsList` : État local React avec callback `onDelete`
- `page.tsx` : Vérification GitHub trash avant rendu

**Graphe des Billets** :
- `scripts/build-graph-billets.cjs` : Analyse liens MDX
- `scripts/render-graph-svg.cjs` : Génération SVG interactif
- `components/GraphSVG.tsx` : Affichage avec survols

**Recherche Unifiée** :
- `UnifiedSearchClient` : Billets (MDX) + Publications (PDF)
- Index statique pour performance
- Snippets contextuels avec highlighting

---

## RÈGLES OPÉRATIONNELLES

### 🔧 Développement
1. **Toujours** Docker DB locale avant `npm run dev`
2. **Jamais** éditer directement les fichiers `public/*.json`
3. **Tester** build complet avant commit important
4. **Vérifier** que MDX components sont exportés dans `lib/mdx.tsx`
5. **Performance** : `npm run lint` et `npm run typecheck` avant push
6. **Images** : Utiliser next/image et configurer remotePatterns si besoin

### 🚀 Déploiement
1. **Push = auto-deploy** Vercel immédiat
2. **Build errors = rollback** automatique
3. **Env vars** : Vérifier Vercel dashboard si erreurs
4. **Performance** : Budget <3s build, <1s pages
5. **ISR** : Publications en cache 300s pour performance
6. **Polices** : Optimisation automatique next/font
7. **Images** : Compression et formats optimaux automatiques

### 🛡️ Sécurité
1. **Secrets** : `.env.local` local, Vercel dashboard prod
2. **Upload** : Cloudinary seul, jamais direct filesystem
3. **Auth** : NextAuth sessions + rôles DB
4. **GitHub** : Token avec permissions repo minimales

### 📝 Contenu
1. **Billets** : MDX uniquement, frontmatter requis
2. **Citations** : Clés Zotero valides obligatoires
3. **Backlinks** : Format `[[slug-ou-titre]]` strict
4. **Images** : Cloudinary via upload UI admin

---

## DÉPENDANCES CRITIQUES À SURVEILLER

**Versions actuelles stables :**
```json
{
  "next": "15.4.6",
  "react": "19.0.0", 
  "@mdx-js/mdx": "3.1.0",
  "@prisma/client": "6.14.0",
  "next-auth": "4.24.5"
}
```

**⚠️ Conflits potentiels :**
- React 19 + certaines libs React 18
- MDX 3.x + next-mdx-remote (incompatibilité)
- Next.js 15 + Prisma versions < 6.x

**🔄 Migrations à prévoir :**
- NextAuth v5 (breaking changes majeurs)
- React Server Components (déjà partiellement utilisé)
- Prisma 6+ (nouvelles fonctionnalités types)

---

## PROBLÈMES CONNUS & SOLUTIONS

### MDX Components
**Symptôme** : "Expected component X to be defined"
**Cause** : Composant pas exporté dans `mdxComponents`
**Fix** : Ajouter import + export dans `lib/mdx.tsx`

### Build Performance
**Symptôme** : Build >10s, timeout Vercel
**Cause** : GitHub API calls massifs
**Fix** : Limiter vérifications trash aux pages individuelles

### Session Persistence
**Symptôme** : Déconnexions fréquentes dev
**Cause** : Hot reload + cookies dev
**Fix** : `NEXTAUTH_SECRET` stable en .env.local

---

## PROCÉDURE DE SYNCHRONISATION

### Nouveaux Contextes Claude
À chaque nouvelle session, lire obligatoirement :
1. **Ce fichier** (`CLAUDE.md`) - Mémoire technique
2. **README.md** - Vue d'ensemble publique
3. **Git status** - État des modifications

### Audit Rapide
```bash
# Vérifier l'état général
git status
npm run build    # Test build complet

# Identifier changements récents
git log --oneline -10
git diff HEAD~3  # Derniers commits
```

### Réactivation Expertise
1. **Lire** CLAUDE.md complet
2. **Scanner** structure projet si nécessaire
3. **Tester** fonctionnalité demandée
4. **Procéder** avec contexte complet

---

## OBJECTIFS STRATÉGIQUES

### Court Terme (Sessions suivantes)
- **Tests** automatisés (build, API, components)
- **Monitoring** erreurs production
- **Cache** intelligent pour recherche
- **Analytics** Web Core Vitals avec optimisations intégrées

### Moyen Terme
- **Migration** NextAuth v5
- **Implémentation** cache intelligent 
- **Extension** système de rôles
- **API** REST complète pour externe

### Long Terme
- **Architecture** microservices (optionnel)
- **Intelligence** aide à l'écriture
- **Collaboration** temps réel
- **Analytics** usage avancées

---

**🧠 MÉMOIRE CLAUDE** : Ce fichier est ma référence absolue. À chaque session :
1. Lire ce contexte AVANT toute action
2. Mettre à jour après modifications majeures  
3. Maintenir cohérence avec réalité du code
4. Garder format concis mais complet