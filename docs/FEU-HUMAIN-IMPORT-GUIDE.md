# Guide d'Import FEU HUMAIN

## 📋 Prérequis

1. **Installer la dépendance nécessaire** :

```bash
npm install --save-dev formdata-node
```

2. **S'assurer que le projet est en mode développement local** :

```bash
npm run dev
```

Ou si vous voulez importer directement en production (non recommandé pour le premier test).

## 🚀 Utilisation du Script d'Import

### Étape 1 : Préparer vos données

Assurez-vous d'avoir :

- Le fichier `message_1.json` de votre export Facebook Messenger
- Les dossiers de médias (`photos/`, `videos/`, `audio_files/`, `gifs/`) - nous les traiterons plus tard

### Étape 2 : Lancer l'import en local

Pour importer depuis votre serveur local (recommandé pour tester) :

```bash
# Depuis la racine du projet
npm run import:feu-humain -- /chemin/vers/message_1.json
```

Par exemple :

```bash
npm run import:feu-humain -- ~/Downloads/facebook-export/messages/inbox/FEU\ HUMAIN/message_1.json
```

### Étape 3 : Suivre le processus

Le script va :

1. **Analyser le fichier** : Compter les messages, détecter les doublons
2. **Demander confirmation** : Vous montrer combien de messages seront importés
3. **Importer par chunks** : Diviser l'import en petits morceaux de 100 messages
4. **Afficher une barre de progression** : Vous montrer l'avancement en temps réel
5. **Gérer les reprises** : Si l'import échoue, vous pourrez le reprendre où il s'est arrêté

### Étape 4 : En cas d'interruption

Si l'import est interrompu (erreur réseau, timeout, etc.), relancez simplement la même commande :

```bash
npm run import:feu-humain -- /chemin/vers/message_1.json
```

Le script détectera automatiquement où il s'était arrêté et vous proposera de reprendre.

## ⚡ Import en Production

**⚠️ ATTENTION** : L'import direct en production peut être plus lent et sujet aux timeouts.

Pour importer directement sur la base de données de production :

```bash
# Assurez-vous d'avoir les bonnes variables d'environnement
export NEXT_PUBLIC_URL=https://athanor-philosophy-platform.vercel.app

# Lancez l'import
npm run import:feu-humain -- /chemin/vers/message_1.json
```

## 🎯 Stratégie Recommandée

1. **Testez d'abord en local** :
   - Lancez `npm run dev`
   - Importez quelques messages pour tester
   - Vérifiez que tout fonctionne sur `http://localhost:3000/admin/feu-humain`

2. **Puis importez en production** :
   - Une fois que vous êtes sûr que ça marche
   - Utilisez le script avec l'URL de production
   - Laissez tourner (peut prendre 10-20 minutes pour 5800 messages)

## 📊 Estimation du Temps

- **En local** : ~2-5 minutes pour 5800 messages
- **En production** : ~15-30 minutes (dépend de la latence réseau)

Le script traite environ 100 messages toutes les 5-10 secondes pour éviter les timeouts.

## 🛠️ Dépannage

### Erreur "Cannot find module 'formdata-node'"

```bash
npm install --save-dev formdata-node
```

### Erreur "ENOENT: no such file or directory"

Vérifiez le chemin vers votre fichier `message_1.json`

### Erreur "401 Unauthorized"

Assurez-vous d'être connecté en tant qu'admin sur l'interface web

### Timeout ou erreur réseau

Le script réessayera automatiquement 3 fois. Si ça échoue encore, relancez le script - il reprendra où il s'est arrêté.

## 📸 Gestion des Médias (Phase 2)

Une fois les messages importés, nous traiterons les médias séparément :

1. **Option A : Upload manuel** (simple mais fastidieux)
   - Uploadez les médias sur Cloudinary via l'interface
   - Mettez à jour les URLs dans la base de données

2. **Option B : Script d'upload de médias** (à développer)
   - Script séparé pour uploader tous les médias
   - Mise à jour automatique des références

3. **Option C : Servir les médias localement** (pour test uniquement)
   - Placer les médias dans `public/FEU HUMAIN/`
   - Fonctionne uniquement en local

## ✅ Vérification Post-Import

Après l'import, vérifiez que tout fonctionne :

1. Allez sur `/admin/feu-humain`
2. Vérifiez les statistiques (nombre de messages, participants)
3. Testez la recherche et les filtres
4. Naviguez dans la timeline

## 🔧 Configuration Avancée

Le script utilise ces variables d'environnement :

- `NEXT_PUBLIC_URL` : URL de base de l'API (défaut: http://localhost:3000)
- `DATABASE_URL` : Connexion à la base de données (depuis .env.local)

Vous pouvez modifier ces constantes dans le script :

- `CHUNK_SIZE` : Nombre de messages par chunk (défaut: 100)
- `RETRY_ATTEMPTS` : Nombre de tentatives en cas d'erreur (défaut: 3)
- `RETRY_DELAY` : Délai entre les tentatives en ms (défaut: 2000)

## 📝 Notes Importantes

1. **Sauvegarde** : Le script sauvegarde automatiquement sa progression dans `.feu-humain-import-progress.json`
2. **Tri chronologique** : Les messages sont automatiquement triés par date avant l'import
3. **Détection de doublons** : Les messages déjà importés sont automatiquement ignorés
4. **Performance** : L'import est optimisé pour éviter les timeouts de Vercel

## 🚨 En Cas de Problème

Si vous rencontrez des problèmes :

1. Vérifiez les logs du terminal
2. Regardez le fichier `.feu-humain-import-progress.json` pour voir où ça s'est arrêté
3. Consultez les logs de l'API sur Vercel Dashboard
4. Essayez de réduire `CHUNK_SIZE` dans le script (ex: 50 au lieu de 100)

---

**Bon import ! 🔥**
