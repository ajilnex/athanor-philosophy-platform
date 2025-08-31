# Guide d'Installation et d'Utilisation de l'Archive FEU HUMAIN

## Vue d'Ensemble

L'archive FEU HUMAIN est un système évolutif qui vous permet de :

- **Importer progressivement** les messages depuis Messenger
- **Détecter automatiquement** les doublons lors des imports successifs
- **Visualiser tous les médias** (photos, vidéos, audio) dans une timeline élégante
- **Garder le contrôle** sur vos données (stockage local, pas d'exposition sur GitHub)

## Architecture

```
FEU HUMAIN
├── Interface Admin (/admin/feu-humain)
│   ├── Visualisation de l'archive
│   └── Import de nouveaux messages (/admin/feu-humain/import)
├── API Routes
│   ├── /api/admin/feu-humain/import (Import intelligent avec détection de doublons)
│   ├── /api/archive/[slug] (Infos de l'archive)
│   ├── /api/archive/[slug]/messages (Messages paginés)
│   └── /api/archive/[slug]/media/[id] (Servir les médias localement)
└── Stockage
    ├── Base de données PostgreSQL (messages, participants, réactions)
    └── Fichiers locaux (public/FEU HUMAIN/*)
```

## Installation

### 1. Préparation des Fichiers

Assurez-vous que votre fichier `message_1.json` est disponible localement, mais **NE PAS** le committer sur Git.

### 2. Déploiement du Code

```bash
# Ajouter tous les nouveaux fichiers SAUF le JSON et les médias
git add app/admin/feu-humain/import
git add app/api/admin/feu-humain
git add app/api/archive/[slug]/media

# Committer les changements
git commit -m "feat: Add FEU HUMAIN incremental import system"

# Pousser sur GitHub
git push
```

### 3. Premier Import

1. **Connectez-vous** à votre interface admin : `https://votre-site.vercel.app/admin`

2. **Naviguez** vers FEU HUMAIN : Cliquez sur "FEU HUMAIN" dans le menu admin

3. **Cliquez** sur "Importer des messages" (bouton orange en haut à droite)

4. **Uploadez** votre fichier `message_1.json`
   - Le système analysera automatiquement le fichier
   - Il détectera s'il s'agit d'une nouvelle archive ou d'une mise à jour
   - Il affichera les statistiques (nombre de messages, participants, période)

5. **Cliquez** sur "Créer l'archive et importer"
   - L'import se fera par lots de 100 messages
   - Les médias seront référencés mais pas uploadés

## Gestion des Médias

### Option 1 : Upload Manuel (Recommandé pour débuter)

Les médias sont référencés dans la base de données mais doivent être placés manuellement :

1. **Via FTP/SSH** sur votre serveur :

   ```bash
   # Créer le dossier si nécessaire
   mkdir -p public/FEU\ HUMAIN

   # Copier les dossiers de médias
   cp -r photos videos audio gifs files public/FEU\ HUMAIN/
   ```

2. **Via Vercel** (plus complexe) :
   - Les fichiers doivent être dans le repository Git
   - Attention à la taille du repository

### Option 2 : Migration vers Cloudinary (Pour plus tard)

Le système est préparé pour une migration future vers Cloudinary :

- Les URLs Cloudinary peuvent être ajoutées dans la base de données
- La route `/api/archive/[slug]/media/[id]` redirigera automatiquement vers Cloudinary si configuré

## Imports Incrémentaux

Le système est conçu pour des imports successifs :

1. **Exportez** régulièrement votre conversation Messenger
2. **Uploadez** le nouveau fichier JSON via l'interface
3. Le système **détectera automatiquement** :
   - Les messages déjà présents (ignorés)
   - Les nouveaux messages (importés)
   - Les nouveaux participants (ajoutés)

### Exemple de Workflow

```
Janvier 2024 : Export initial → 5000 messages importés
Février 2024 : Nouvel export → 200 nouveaux messages détectés et importés
Mars 2024    : Nouvel export → 150 nouveaux messages détectés et importés
...
```

## Fonctionnalités de l'Interface

### Timeline Interactive

- **Scroll infini** : Les messages se chargent automatiquement
- **Recherche** : Recherche dans tout le contenu
- **Filtres** : Par type de contenu (texte, photos, vidéos)
- **Visualisation des médias** : Clic pour voir en plein écran

### Statistiques

- Nombre total de messages
- Nombre de participants
- Répartition des médias
- Période couverte

## Sécurité

### Protection des Données

- **Archive privée** par défaut (admin seulement)
- **Pas d'exposition sur GitHub** (fichiers locaux uniquement)
- **Import sécurisé** via l'interface admin

### Authentification

- Seuls les admins peuvent voir et importer
- Session vérifiée à chaque requête
- Protection CSRF intégrée

## Dépannage

### "Archive non trouvée"

- Vérifiez que l'import initial a bien été effectué
- Consultez les logs Vercel pour voir si l'import a réussi

### Médias non visibles

- Vérifiez que les fichiers sont bien dans `public/FEU HUMAIN/`
- Respectez la structure exacte des chemins du JSON
- Vérifiez les permissions des fichiers

### Import échoue

- Vérifiez la taille du fichier (max 100MB)
- Assurez-vous que le format JSON est valide
- Consultez les logs de l'API dans Vercel

## Évolutions Futures

### Court Terme

- [ ] Indicateur de progression en temps réel pendant l'import
- [ ] Export des données de l'archive
- [ ] Statistiques détaillées par participant

### Moyen Terme

- [ ] Upload automatique des médias vers Cloudinary
- [ ] Génération de thumbnails pour les vidéos
- [ ] Recherche avancée avec filtres multiples

### Long Terme

- [ ] Import automatique via webhook Messenger
- [ ] Analyse de sentiment des messages
- [ ] Génération de visualisations (graphiques, wordclouds)

## Support

Pour toute question ou problème :

1. Vérifiez les logs dans Vercel Dashboard
2. Consultez la console du navigateur pour les erreurs client
3. Vérifiez que toutes les migrations Prisma sont appliquées

## Notes Importantes

1. **Backup** : Faites des sauvegardes régulières de votre base de données
2. **Limites** : Vercel a des limites de timeout (60s), les très gros imports peuvent nécessiter plusieurs passes
3. **Médias** : Pour des raisons de performance, envisagez Cloudinary pour les grosses archives

---

_FEU HUMAIN - Une archive vivante qui grandit avec le temps_
