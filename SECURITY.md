# Sécurité - L'Athanor

Documentation des considérations de sécurité critiques pour la plateforme philosophique L'Athanor. Version mise à jour avec optimisations récentes et nouvelles fonctionnalités.

## 🚨 Risques Identifiés et Mesures Recommandées

### 1. SSRF/DoS - API `/api/find-in-pdf` (Résolu)

**Description du Risque** : Historiquement, l'endpoint `/api/find-in-pdf` était exposé à des attaques SSRF (Server-Side Request Forgery), car il pouvait télécharger des PDF depuis des URLs arbitraires.

**Mesures Implémentées** :
Pour contrer ce risque, une validation stricte des URLs est maintenant en place. Le serveur maintient une **liste blanche (allowlist) d'hôtes autorisés** et refuse toute requête vers un domaine non approuvé.

- **Validation de protocole** : Seul le protocole `https:` est autorisé.
- **Validation d'hôte** : Le nom d'hôte de l'URL doit appartenir à la liste blanche définie dans la variable d'environnement `PDF_ALLOWED_HOSTS`.
- **Limites de ressources** : Des timeouts et des limites de taille de fichier sont également en place pour prévenir les attaques DoS.

**Configuration via variables d'environnement** :

```bash
PDF_ALLOWED_HOSTS="res.cloudinary.com,autre-domaine-approuve.com"
PDF_MAX_SIZE="52428800"  # 50MB
PDF_TIMEOUT="30000"      # 30s
```

### 2. Rate Limiting - Système de Commentaires

**Risque** : La variable `DISABLE_COMMENT_RATELIMIT` désactive la protection contre le spam de commentaires.

**Impact** :

- Spam automatisé de commentaires
- Épuisement de la base de données
- Déni de service applicatif

**Mesures recommandées** :

#### Production

```bash
# ⚠️ NE JAMAIS activer en production
DISABLE_COMMENT_RATELIMIT="false"  # ou ne pas définir

# Utiliser Upstash Redis pour rate limiting distribué
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="votre-token-redis"
```

#### Limites suggérées

- **5 commentaires/minute** par IP
- **20 commentaires/heure** par utilisateur authentifié
- **2 commentaires/minute** pour utilisateurs anonymes

### 3. Gestion des Credentials

**Politique d'authentification actuelle** :

- Passwords hashés avec `bcrypt` (✅ sécurisé)
- NextAuth.js pour l'authentification GitHub OAuth
- API key pour endpoints admin (`ADMIN_API_KEY`)

**Recommandations** :

#### Création d'Admins

```bash
# Utiliser des mots de passe forts (génération automatique)
openssl rand -base64 32

# Politique : minimum 12 caractères, caractères spéciaux requis
```

#### 2FA GitHub OAuth

- **Obligatoire** : Activer 2FA sur le compte GitHub utilisé pour OAuth
- Configurer les **Authorized OAuth Apps** avec domaines stricts
- Revoir périodiquement les **Personal Access Tokens**

#### Rotation des Secrets

```bash
# Rotation recommandée tous les 90 jours
NEXTAUTH_SECRET="nouveau-secret-genere"
ADMIN_API_KEY="nouvelle-cle-api"
GITHUB_SECRET="nouveau-secret-oauth"
```

## ⚠️ Variables d'Environnement Sensibles

**Secrets critiques** :

- `DATABASE_URL` : Contient credentials PostgreSQL
- `NEXTAUTH_SECRET` : Clé de signature JWT
- `ADMIN_API_KEY` : Accès administrateur
- `CLOUDINARY_API_SECRET` : Upload de fichiers
- `GITHUB_SECRET` : OAuth application

**Bonnes pratiques** :

- ❌ Jamais de commit de `.env.local` ou `.env`
- ✅ Utiliser Vercel Environment Variables pour production
- ✅ Rotation périodique des secrets (90 jours)
- ✅ Logs d'audit pour accès admin

## ⚠️ Configuration de Production

### Variables à NE PAS activer en production

```bash
# ❌ DANGEREUX en production - VULNÉRABLE AU SPAM
DISABLE_COMMENT_RATELIMIT="true"

# ⚠️ Éviter si possible (préférer connection pooling)
DIRECT_DATABASE_URL="postgresql://..."  # Bypass pooler
```

### Configuration Vercel sécurisée

```javascript
// Headers de sécurité + optimisations (next.config.js)
const nextConfig = {
  // Optimisations images (sécurité via remotePatterns)
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
      },
    ],
  },

  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}
```

## 🔍 Monitoring et Alertes

### Logs de sécurité recommandés

- Tentatives d'accès API admin avec clé invalide
- Rate limiting déclenché (IP bloquée)
- Téléchargements PDF échoués (SSRF tentative)
- Connexions administrateur (succès/échec)

### Métriques à surveiller

- **PDF API** : Nombre de requêtes `/api/find-in-pdf` par heure
- **Performance** : Web Core Vitals (LCP, CLS, FID)
- **Images** : Optimisation next/image (formats WebP/AVIF)
- **Build** : Temps pipeline parallélisé vs séquentiel
- **ISR** : Cache hit ratio publications (revalidation 300s)
- **Commentaires** : Latence avec avatars optimisés
- **Mémoire** : Utilisation pendant parsing PDF et graph SVG

---

## 🔒 Éléments de Sécurité Liés aux Optimisations Récentes

### Optimisation Images (next/image)

**Sécurité renforcée** :

- `remotePatterns` limite les domaines d'images autorisés
- Protection contre le hotlinking malveillant
- Formats optimisés (WebP/AVIF) réduisent la surface d'attaque

### Pipeline Build Parallélisé

**Risques réduits** :

- Timeout build plus court = moins d'exposition aux attaques DoS
- Échec rapide en cas de script compromis
- Isolation des groupes de scripts (bibliographie, graph, recherche)

### ISR (Incremental Static Regeneration)

**Avantages sécurité** :

- Pages statiques = surface d'attaque réduite
- Cache 300s limite les requêtes malveillantes répétées
- Regeneration contrôlée vs rendu dynamique systématique

**⚡ Actions immédiates recommandées** :

1. Configurer Upstash Redis pour rate limiting en production
2. Activer 2FA sur compte GitHub OAuth
3. Vérifier configuration `remotePatterns` images
4. Monitorer performance build parallélisé
5. Mettre en place monitoring des tentatives SSRF

**🔗 Références** :

- [OWASP SSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Next.js Security Headers](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [Upstash Rate Limiting](https://upstash.com/docs/redis/features/ratelimiting)
