# Workflow de Synchronisation de Contenu

Ce document explique comment utiliser le système de snapshot pour synchroniser les données entre la production et le développement.

## 🎯 Objectif

Le système de snapshot permet de :

- Récupérer les données publiques de production
- Migrer les fichiers Cloudinary de prod vers dev
- Créer un environnement de développement réaliste
- Éviter les problèmes de synchronisation entre équipes

## 📋 Prérequis

### 1. Variables d'environnement

Créez un fichier `.env.production` avec :

```bash
# Base de données de production
DATABASE_URL="postgresql://user:password@prod-host:5432/athanor_prod"
DIRECT_DATABASE_URL="postgresql://user:password@prod-host:5432/athanor_prod"

# Cloudinary PRODUCTION (source)
CLOUDINARY_CLOUD_NAME_PROD="your-prod-cloud"
CLOUDINARY_API_KEY_PROD="your-prod-key"
CLOUDINARY_API_SECRET_PROD="your-prod-secret"

# Cloudinary DÉVELOPPEMENT (destination)
CLOUDINARY_CLOUD_NAME_DEV="your-dev-cloud"
CLOUDINARY_API_KEY_DEV="your-dev-key"
CLOUDINARY_API_SECRET_DEV="your-dev-secret"
```

### 2. Permissions

- Accès en lecture à la base de données de production
- Clés API Cloudinary pour les deux comptes (prod et dev)

## 🔄 Workflow Complet

### Étape 1 : Créer un Snapshot (Admin/DevOps)

```bash
npm run snapshot:create
```

Cette commande :

1. Se connecte à la BDD de production
2. Récupère les données publiques (articles/billets non scellés)
3. Migre les fichiers PDF de Cloudinary prod vers dev
4. Anonymise les données sensibles
5. Génère `prisma/snapshot.json`

### Étape 2 : Distribuer le Snapshot

- Commitez le fichier `prisma/snapshot.json` dans Git
- Ou partagez-le via votre méthode habituelle

### Étape 3 : Restauration Locale (Développeurs)

```bash
npm run db:reset
```

Cette commande unifiée :

1. Reset la base de données locale (`prisma migrate reset`)
2. Restaure les données du snapshot
3. Crée un utilisateur admin local (`admin@athanor.com` / `admin123`)

## 🛠️ Commandes Disponibles

### Scripts de Snapshot

```bash
# Créer un snapshot depuis la production
npm run snapshot:create

# Restaurer depuis un snapshot existant
npm run snapshot:restore

# Reset complet + restauration (recommandé)
npm run db:reset
```

### Scripts de Base de Données

```bash
# Migrations
npm run db:migrate:dev      # Migration dev
npm run db:migrate:status   # Statut des migrations

# Développement Docker
npm run db:dev:start        # Démarrer PostgreSQL local
npm run db:dev:stop         # Arrêter PostgreSQL local
npm run db:dev:reset        # Reset Docker + migrations
```

## 📊 Contenu du Snapshot

### ✅ Données Incluses

- **Articles** : Publications publiques (`isSealed = false`)
- **Billets** : Billets publics (`isSealed = false`)
- **Commentaires** : Commentaires approuvés et visibles
- **Fichiers** : PDFs migrés vers Cloudinary dev

### ❌ Données Exclues/Anonymisées

- **Utilisateurs** : Données sensibles non incluses
- **Sessions/Comptes** : Auth NextAuth exclu
- **Commentaires** : AuthorId anonymisé vers `admin`
- **Contenu Scellé** : Articles/billets privés exclus

## 🔐 Sécurité

### Données Anonymisées

- Les commentaires sont associés à l'admin local
- Aucune donnée utilisateur sensible n'est copiée
- Les contenus privés (`isSealed = true`) sont exclus

### Fichiers Cloudinary

- Migration de compte à compte (prod → dev)
- Dossier séparé : `athanor-articles-dev`
- Pas de risque de conflit avec la prod

## 🚀 Cas d'Usage

### Nouveau Développeur

```bash
git clone repo
npm install
npm run db:dev:start
npm run db:reset
npm run dev
# Prêt avec des données réalistes !
```

### Synchronisation Équipe

```bash
git pull  # Récupère le nouveau snapshot.json
npm run db:reset
# Base locale synchronisée avec la prod
```

### Test d'une Feature

```bash
npm run db:reset  # État propre
# Développement/tests
npm run db:reset  # Reset si besoin
```

## 🐛 Dépannage

### Erreur "snapshot.json introuvable"

```bash
# Vérifiez la présence du fichier
ls prisma/snapshot.json

# Ou utilisez l'exemple
cp prisma/snapshot.example.json prisma/snapshot.json
npm run snapshot:restore
```

### Erreur Cloudinary

- Vérifiez les clés API dans `.env.production`
- Vérifiez les permissions des comptes Cloudinary
- Le script continue même si la migration échoue

### Erreur Base de Données

- Vérifiez que Docker PostgreSQL est démarré (`npm run db:dev:start`)
- Vérifiez les variables dans `.env.local`
- Consultez les logs pour plus de détails

## 📈 Bonnes Pratiques

1. **Créez un snapshot régulièrement** (après chaque release majeure)
2. **Commitez le snapshot.json** pour partager avec l'équipe
3. **Utilisez `db:reset`** au lieu de manipuler la DB manuellement
4. **Gardez séparés** les comptes Cloudinary prod/dev
5. **Documentez** les changements de structure de données

## 🔄 Cycle de Vie

```
Production → Snapshot → Git → Équipe → Développement Local
     ↑                                        ↓
   Release                                Tests/Dev
     ↑                                        ↓
    ...  ←  Merge ← Pull Request ← Feature  ←  ...
```

Ce workflow garantit que tous les développeurs travaillent avec des données cohérentes et réalistes, tout en préservant la sécurité et la confidentialité des données de production.
