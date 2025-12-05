# 🔥 Guide de résolution des problèmes FEU HUMAIN

## État actuel et objectifs

### ✅ Ce qui fonctionne

- Architecture complète avec modèles Prisma
- Interface admin élégante avec timeline
- Import incrémental avec détection de doublons
- API routes fonctionnelles

### 🎯 Les 3 objectifs à résoudre

1. **Problème d'encodage** ✅ (RÉSOLU)
2. **Peupler la base de données en ligne** (EN COURS)
3. **Ajouter les médias sur Cloudinary** (À FAIRE)

---

## 📝 Étape 1 : Correction de l'encodage (RÉSOLU ✅)

### Problème identifié

Les exports Messenger ont un problème de double encodage UTF-8 :

- `Ã©` au lieu de `é`
- `Ã¨` au lieu de `è`
- `â€™` au lieu de `'`
- etc.

### Solution implémentée

Un script de nettoyage a été créé : `scripts/clean-messenger-export.ts`

#### Comment l'utiliser :

```bash
# 1. Exécuter le script de nettoyage
npm run clean:feu-humain

# Le script va :
# - Lire le fichier original : public/FEU HUMAIN/message_1.json
# - Créer une sauvegarde : message_1_original.json
# - Nettoyer tous les problèmes d'encodage
# - Sauvegarder le résultat : message_1_clean.json
```

#### Vérification :

```bash
# Ouvrir le fichier nettoyé pour vérifier
cat "public/FEU HUMAIN/message_1_clean.json" | head -n 100

# Ou chercher des patterns spécifiques
grep -c "Ã©" "public/FEU HUMAIN/message_1_clean.json"  # Devrait retourner 0
```

#### Après validation :

```bash
# Si le nettoyage est bon, remplacer l'original
cd "public/FEU HUMAIN"
cp message_1_clean.json message_1.json
```

---

## 🚀 Étape 2 : Import en base de données

### Option A : Via l'interface admin (RECOMMANDÉ)

1. **Démarrer le serveur local** :

```bash
npm run db:dev:start  # Lance PostgreSQL Docker
npm run dev           # Lance Next.js
```

2. **Se connecter en admin** :

- Aller sur http://localhost:3000/admin
- Se connecter avec vos identifiants admin

3. **Naviguer vers FEU HUMAIN** :

- Cliquer sur "FEU HUMAIN" dans le menu admin
- Si l'archive n'existe pas, cliquer sur "Créer l'archive et importer"
- Si elle existe, cliquer sur "Importer des messages"

4. **Uploader le fichier nettoyé** :

- Sélectionner `message_1_clean.json`
- Le système analysera le fichier
- Cliquer sur "Créer l'archive et importer" ou "Importer X nouveaux messages"

### Option B : Via script direct

```bash
# Utiliser le script d'import existant
npm run import:feu-humain

# Le script va :
# - Créer l'archive dans PostgreSQL
# - Importer tous les messages par lots de 100
# - Créer les participants et réactions
# - Référencer les médias (sans upload)
```

### Vérification de l'import :

```bash
# Se connecter à Prisma Studio pour voir les données
npm run db:studio

# Ou vérifier via l'interface
# http://localhost:3000/admin/feu-humain
```

---

## 📤 Étape 3 : Import en production

### Préparer le fichier

1. **S'assurer que le fichier est nettoyé** :

```bash
ls -la "public/FEU HUMAIN/"
# Vérifier que message_1_clean.json existe
```

2. **Réduire la taille si nécessaire** (max 100MB pour Vercel) :

```bash
# Vérifier la taille
du -h "public/FEU HUMAIN/message_1_clean.json"

# Si > 100MB, diviser en plusieurs parties
# ou compresser avec gzip
```

### Import via l'interface de production

1. **Se connecter à l'admin de production** :

```
https://votre-site.vercel.app/admin
```

2. **Naviguer vers FEU HUMAIN** :

- Menu Admin → FEU HUMAIN
- Cliquer sur "Importer des messages"

3. **Uploader et importer** :

- Sélectionner le fichier nettoyé
- Attendre l'analyse (peut prendre 1-2 minutes)
- Cliquer sur "Créer l'archive et importer"
- L'import peut prendre 10-20 minutes pour ~6000 messages

### Surveillance de l'import

- Garder la page ouverte pendant l'import
- En cas d'erreur timeout, relancer (détection automatique des doublons)
- Vérifier les logs dans Vercel Dashboard si problème

---

## 🖼️ Étape 4 : Upload des médias (À FAIRE)

### Stratégie recommandée

1. **Phase 1 : Références en DB** (déjà fait)
   - Les médias sont référencés dans `ConversationMedia`
   - Les URLs locales sont stockées

2. **Phase 2 : Upload Cloudinary** (à implémenter)

Créer un script `upload-media-cloudinary.ts` :

```typescript
// Pseudo-code du script à créer
async function uploadMediaToCloudinary() {
  // 1. Récupérer tous les ConversationMedia sans cloudinaryUrl
  const mediaToUpload = await prisma.conversationMedia.findMany({
    where: { cloudinaryUrl: null },
  })

  // 2. Pour chaque média
  for (const media of mediaToUpload) {
    // Vérifier si le fichier local existe
    const localPath = `public/FEU HUMAIN/${media.originalUri}`

    // Upload vers Cloudinary
    const result = await cloudinary.uploader.upload(localPath, {
      folder: 'feu-humain',
      resource_type: getResourceType(media.type),
    })

    // Mettre à jour la DB
    await prisma.conversationMedia.update({
      where: { id: media.id },
      data: {
        cloudinaryUrl: result.secure_url,
        cloudinaryPublicId: result.public_id,
      },
    })
  }
}
```

### Configuration Cloudinary

Dans `.env.local` et `.env.production` :

```env
CLOUDINARY_CLOUD_NAME=votre-cloud
CLOUDINARY_API_KEY=votre-api-key
CLOUDINARY_API_SECRET=votre-api-secret
```

---

## 🔍 Debugging et troubleshooting

### Problèmes courants

#### "Archive non trouvée"

- Vérifier que l'import initial a été fait
- Regarder les logs : `npm run db:studio`

#### Caractères mal affichés après import

- Re-nettoyer le fichier : `npm run clean:feu-humain`
- Vérifier l'encodage : `file -I "public/FEU HUMAIN/message_1.json"`

#### Timeout pendant l'import

- Diviser le fichier en parties plus petites
- Utiliser l'import incrémental (plusieurs passes)
- Augmenter les timeouts dans `maxDuration` de l'API route

#### Médias non visibles

- Vérifier que les fichiers sont dans `public/FEU HUMAIN/`
- Vérifier les chemins dans la DB correspondent
- Attendre l'upload Cloudinary (phase 2)

### Commandes utiles

```bash
# Voir les logs de l'application
npm run dev

# Inspecter la base de données
npm run db:studio

# Vérifier l'encodage d'un fichier
file -I fichier.json

# Compter les messages dans le JSON
cat message_1.json | jq '.messages | length'

# Chercher des patterns d'encodage cassé
grep -o "Ã[¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ]" message_1.json | sort | uniq -c
```

---

## ✅ Checklist finale

- [ ] Fichier JSON nettoyé avec `clean:feu-humain`
- [ ] Import testé en local
- [ ] Caractères accentués s'affichent correctement
- [ ] Import en production réussi
- [ ] Archive visible sur `/admin/feu-humain`
- [ ] Timeline fonctionne avec scroll infini
- [ ] Recherche et filtres fonctionnels
- [ ] Médias référencés (phase 1)
- [ ] Médias uploadés sur Cloudinary (phase 2 - optionnel)

---

## 📞 Support

En cas de problème :

1. Vérifier les logs Vercel
2. Consulter Prisma Studio
3. Regarder la console du navigateur
4. Vérifier que les migrations sont appliquées

---

_Dernière mise à jour : Installation du système de nettoyage d'encodage_
