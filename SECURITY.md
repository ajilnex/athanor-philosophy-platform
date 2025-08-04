# 🛡️ Guide de Sécurité - Athanor

## ⚠️ Configuration Obligatoire

### 1. Variables d'Environnement à Configurer sur Vercel

Connectez-vous à votre [Dashboard Vercel](https://vercel.com/dashboard) → Projet "athanor-philosophy-platform" → Settings → Environment Variables :

**Variables OBLIGATOIRES :**
```bash
# 🔐 Clé d'administration (URGENT - Générez une clé forte)
ADMIN_API_KEY=votre-cle-secrete-tres-longue-et-complexe

# 🔐 Clé publique pour le frontend (même valeur)  
NEXT_PUBLIC_ADMIN_KEY=votre-cle-secrete-tres-longue-et-complexe

# 🗄️ Base de données PostgreSQL (déjà configuré)
DATABASE_URL=postgresql://...

# ☁️ Cloudinary (déjà configuré)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### 2. Comment Générer une Clé Sécurisée

Utilisez cette commande pour générer une clé forte :
```bash
# Sur Mac/Linux
openssl rand -base64 32

# Ou utilisez un générateur en ligne :  
# https://generate-random.org/api-key-generator?count=1&length=32&type=mixed-numbers
```

**Exemple de clé forte :**
```
K8mN2pQ7sT9vW4xZ1eR6yU3oI5lA8bC0dF7gH9jM2nP5q
```

## 🛡️ Protections Implémentées

### 1. APIs d'Administration Sécurisées
- ✅ Tous les endpoints `/api/admin/*` nécessitent la clé API
- ✅ Validation de la clé sur chaque requête  
- ✅ Messages d'erreur sécurisés (pas de fuite d'info)

### 2. Protection Upload
- ✅ Fichiers PDF uniquement
- ✅ Limite de taille : 50MB maximum
- ✅ Validation des noms de fichiers
- ✅ Authentification obligatoire

### 3. Sécurité Base de Données
- ✅ Variables d'environnement (pas de secrets hardcodés)
- ✅ Connexions chiffrées PostgreSQL
- ✅ Pas d'accès direct public à la DB

## 🚨 Actions Urgentes Requises

### ÉTAPE 1 : Configurer la Clé API (IMMÉDIAT)

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet "athanor-philosophy-platform"  
3. Settings → Environment Variables
4. Ajoutez ces 2 variables :
   - `ADMIN_API_KEY` = votre-clé-générée
   - `NEXT_PUBLIC_ADMIN_KEY` = même-clé

5. **REDÉPLOYEZ** le site (le déploiement se fera automatiquement)

### ÉTAPE 2 : Vérifier la Protection

Testez que l'API est protégée :
```bash
# Cette requête DOIT échouer (401 Unauthorized)
curl https://athanor-philosophy-platform.vercel.app/api/admin/stats

# Cette requête DOIT réussir (avec votre clé)
curl -H "x-admin-key: votre-cle" https://athanor-philosophy-platform.vercel.app/api/admin/stats
```

## 📋 Checklist de Sécurité

- [ ] ✅ Clé API configurée sur Vercel
- [ ] ✅ Site redéployé avec la nouvelle config  
- [ ] ✅ Test d'accès non autorisé (doit échouer)
- [ ] ✅ Test d'accès autorisé (doit réussir)
- [ ] ✅ Pages admin fonctionnelles
- [ ] ✅ Upload protégé

## 🔐 Bonnes Pratiques 

### Ne JAMAIS faire :
- ❌ Partager la clé API publiquement
- ❌ Committer des secrets dans Git
- ❌ Utiliser des mots de passe faibles
- ❌ Exposer des endpoints sensibles

### Toujours faire :
- ✅ Générer des clés longues et complexes
- ✅ Utiliser HTTPS uniquement
- ✅ Monitorer les accès suspects
- ✅ Mettre à jour régulièrement

## 🆘 En Cas de Problème

Si vous pensez que vos clés ont été compromises :

1. **IMMÉDIATEMENT** : Changez `ADMIN_API_KEY` sur Vercel
2. Redéployez le site
3. Vérifiez les logs de Cloudinary et Neon
4. Surveillez les activités suspectes

---

## 📞 Support

Ce guide couvre la sécurité de base. Athanor est maintenant protégé contre les accès non autorisés !