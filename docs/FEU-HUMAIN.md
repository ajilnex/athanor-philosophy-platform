# 🔥 Archive FEU HUMAIN

L'archive FEU HUMAIN transforme une conversation Messenger en une expérience immersive. Cette documentation couvre l'architecture, l'import et l'utilisation.

## Architecture

```
app/(immersive)/archive/feu-humain/   # Interface publique
├── page.tsx                           # Page serveur
├── client.tsx                         # Client interactif
└── components/                        # Composants UI

app/api/archive/[slug]/               # API routes
├── route.ts                          # Infos archive
├── messages/route.ts                 # Messages paginés
├── feuilleter/route.ts               # OCR notes
└── media/[id]/route.ts               # Médias locaux

prisma/schema.prisma                  # Modèles DB
├── ConversationArchive
├── ConversationMessage
├── ConversationParticipant
├── ConversationMedia
├── ConversationReaction
└── ArchiveNote                       # OCR/annotations
```

## Import de l'Archive

### 1. Préparer les Données

Exportez votre conversation depuis Facebook/Messenger (format JSON).

### 2. Import via Interface Admin

```bash
# Lancer le serveur
npm run dev

# Accéder à l'interface d'import
open http://localhost:3000/admin/feu-humain/import
```

1. Uploadez `message_1.json`
2. Le système analyse et détecte les doublons
3. Import par chunks de 100 messages
4. Progression en temps réel

### 3. Import Script (Alternative)

```bash
npm run import:feu-humain -- /chemin/vers/message_1.json
```

Le script:
- Détecte automatiquement les reprises
- Gère les doublons
- Sauvegarde la progression dans `.feu-humain-import-progress.json`

### 4. Gestion des Médias

**Option A**: Placer les médias dans `public/FEU HUMAIN/`
```bash
public/FEU\ HUMAIN/
├── photos/
├── videos/
├── audio/
├── gifs/
└── files/
```

**Option B**: Upload vers Cloudinary (production recommandée)

## Fonctionnalités

| Feature | Description |
|---------|-------------|
| **Timeline** | Navigation chronologique avec infinite scroll |
| **Recherche** | Recherche temps réel dans les messages |
| **Filtres** | Par type (texte, photos, vidéos) et par participant |
| **Statistiques** | Messages, médias, période, participants |
| **Grapheu** | Visualisation des notes OCR en graphe |
| **FEUilleter** | Parcours des textes extraits par OCR |

## Accès & Sécurité

| Route | Accès |
|-------|-------|
| `/archive/feu-humain` | Public (si `isPublic=true`) |
| `/archive/feu-humain/feuilleter` | Public |
| `/admin/feu-humain/import` | Admin uniquement |

Pour rendre l'archive publique:
```sql
UPDATE "ConversationArchive" SET "isPublic" = true WHERE slug = 'feu-humain';
```

## Troubleshooting

| Problème | Solution |
|----------|----------|
| "Archive not found" | Vérifier `isPublic` ou connexion admin |
| Médias non visibles | Vérifier chemins dans `public/FEU HUMAIN/` |
| Import timeout | Réduire `CHUNK_SIZE` à 50 dans le script |
| Encodage cassé | Re-import avec encoding UTF-8 correct |

## API Endpoints

```bash
# Infos archive
GET /api/archive/feu-humain

# Messages paginés
GET /api/archive/feu-humain/messages?page=1&limit=50&filter=all

# Avec recherche
GET /api/archive/feu-humain/messages?search=terme

# Par participant
GET /api/archive/feu-humain/messages?sender=NomParticipant

# Notes OCR
GET /api/archive/feu-humain/feuilleter?page=1
```

---

*"Une conversation est comme un feu de camp : elle réchauffe, elle éclaire, elle rassemble."* 🔥
