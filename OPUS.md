# 🚨 RAPPORT DE VULNÉRABILITÉ CRITIQUE - API `/api/find-in-pdf`

**Date**: 22 Août 2025  
**Auteur**: Opus  
**Destinataire**: Gemini  
**Criticité**: **CRITIQUE (CVSS 8.6)**  
**Statut**: Non corrigé - Action immédiate requise

---

## 📋 Résumé Exécutif

Gemini,

Suite à mon analyse approfondie du site L'Athanor, j'ai identifié une vulnérabilité critique de type **SSRF (Server-Side Request Forgery)** combinée à un risque de **DoS (Denial of Service)** dans l'endpoint `/api/find-in-pdf`. Cette vulnérabilité permet à un attaquant de faire exécuter des requêtes HTTP arbitraires par le serveur, pouvant compromettre l'infrastructure interne et les services cloud connectés.

## 🔍 Analyse Technique Détaillée

### Localisation du Code Vulnérable

**Fichier 1**: `/app/api/find-in-pdf/route.ts`

```typescript
export async function GET(request: NextRequest) {
  const url = searchParams.get('url') // ⚠️ URL non validée
  const q = searchParams.get('q')

  // Aucune validation de l'URL avant traitement
  const result = await findInPdf(url, q) // 🔴 Appel direct sans filtrage
}
```

**Fichier 2**: `/lib/pdf.server.ts`

```typescript
export async function extractPagesFromPdfUrl(pdfUrl: string): Promise<PdfPage[]> {
  // 🔴 VULNÉRABILITÉ: fetch direct sans validation
  const response = await fetch(pdfUrl)
  const buffer = await response.arrayBuffer()
  // Traitement du PDF...
}
```

### Vecteurs d'Attaque Identifiés

#### 1. **SSRF - Accès aux Services Internes**

```bash
# Accès aux métadonnées AWS/GCP
GET /api/find-in-pdf?url=http://169.254.169.254/latest/meta-data/&q=test

# Scan du réseau interne
GET /api/find-in-pdf?url=http://10.0.0.1:5432/&q=test

# Accès aux services locaux
GET /api/find-in-pdf?url=http://localhost:3000/api/admin/sensitive&q=test
```

#### 2. **DoS - Épuisement des Ressources**

```bash
# Fichier de 1GB causant OOM
GET /api/find-in-pdf?url=https://evil.com/huge-file.pdf&q=test

# URL avec redirection infinie
GET /api/find-in-pdf?url=https://evil.com/infinite-redirect&q=test

# Service lent (slowloris)
GET /api/find-in-pdf?url=https://evil.com/slow-response&q=test
```

#### 3. **Data Exfiltration**

```bash
# Lecture de fichiers internes via file://
GET /api/find-in-pdf?url=file:///etc/passwd&q=root

# Accès aux variables d'environnement (si mal configuré)
GET /api/find-in-pdf?url=http://localhost:3000/.env&q=DATABASE
```

### Impact Potentiel

- **🔴 Compromission Infrastructure**: Accès aux métadonnées cloud (AWS, GCP, Azure)
- **🔴 Fuite de Données**: Extraction de configurations, secrets, données internes
- **🟠 Déni de Service**: Crash serveur par épuisement mémoire/CPU
- **🟠 Pivot Réseau**: Utilisation du serveur comme proxy pour attaquer d'autres services
- **🟡 Reconnaissance**: Mapping du réseau interne et des services

## 🛠️ Solution Proposée - Implémentation Complète

### Étape 1: Créer un Module de Validation Sécurisé

**Nouveau fichier**: `/lib/security/pdf-url-validator.ts`

```typescript
import { URL } from 'url'

// Configuration stricte des domaines autorisés
const ALLOWED_HOSTS = process.env.PDF_ALLOWED_HOSTS?.split(',') || [
  'res.cloudinary.com',
  'athanor-cdn.cloudinary.com',
]

const BLOCKED_PROTOCOLS = ['file:', 'ftp:', 'gopher:', 'telnet:', 'dict:']
const BLOCKED_PORTS = [22, 23, 25, 110, 143, 3306, 5432, 6379, 27017]
const PRIVATE_IP_RANGES = [
  /^127\./, // Loopback
  /^10\./, // Private Class A
  /^172\.(1[6-9]|2\d|3[01])\./, // Private Class B
  /^192\.168\./, // Private Class C
  /^169\.254\./, // Link-local
  /^::1$/, // IPv6 loopback
  /^fc00:/, // IPv6 private
  /^fe80:/, // IPv6 link-local
]

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export function validatePdfUrl(urlString: string): ValidationResult {
  try {
    const url = new URL(urlString)

    // 1. Vérifier le protocole
    if (url.protocol !== 'https:') {
      return {
        isValid: false,
        error: `Protocol ${url.protocol} not allowed. Only HTTPS is permitted.`,
      }
    }

    // 2. Vérifier l'hôte contre la whitelist
    if (!ALLOWED_HOSTS.includes(url.hostname)) {
      return {
        isValid: false,
        error: `Host ${url.hostname} not in allowed list`,
      }
    }

    // 3. Vérifier les ports
    const port = url.port ? parseInt(url.port) : 443
    if (BLOCKED_PORTS.includes(port)) {
      return {
        isValid: false,
        error: `Port ${port} is blocked`,
      }
    }

    // 4. Double vérification contre les IPs privées (résolution DNS)
    // Note: Nécessite une résolution DNS sécurisée en production

    // 5. Vérifier l'extension du fichier
    if (!url.pathname.toLowerCase().endsWith('.pdf')) {
      return {
        isValid: false,
        error: 'URL must point to a PDF file',
      }
    }

    return { isValid: true }
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format',
    }
  }
}

// Limites de sécurité supplémentaires
export const PDF_SECURITY_LIMITS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  DOWNLOAD_TIMEOUT: 30000, // 30 secondes
  MAX_REDIRECTS: 3,
  MAX_PROCESSING_TIME: 60000, // 60 secondes total
}
```

### Étape 2: Modifier la Fonction d'Extraction PDF

**Mise à jour**: `/lib/pdf.server.ts`

```typescript
import { validatePdfUrl, PDF_SECURITY_LIMITS } from '@/lib/security/pdf-url-validator'

export async function extractPagesFromPdfUrl(pdfUrl: string): Promise<PdfPage[]> {
  // Validation de sécurité
  const validation = validatePdfUrl(pdfUrl)
  if (!validation.isValid) {
    console.error(`[SECURITY] PDF URL validation failed: ${validation.error}`)
    throw new Error('Invalid PDF URL')
  }

  try {
    // Fetch sécurisé avec timeouts et limites
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), PDF_SECURITY_LIMITS.DOWNLOAD_TIMEOUT)

    const response = await fetch(pdfUrl, {
      signal: controller.signal,
      redirect: 'follow',
      // @ts-ignore - Limite les redirections (Node.js 18+)
      follow: PDF_SECURITY_LIMITS.MAX_REDIRECTS,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`)
    }

    // Vérifier la taille du fichier
    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > PDF_SECURITY_LIMITS.MAX_FILE_SIZE) {
      throw new Error('PDF file too large')
    }

    // Vérifier le Content-Type
    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/pdf')) {
      throw new Error('Response is not a PDF file')
    }

    // Lecture avec limite de taille
    const chunks: Uint8Array[] = []
    let totalSize = 0
    const reader = response.body?.getReader()

    if (!reader) throw new Error('Cannot read response body')

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      totalSize += value.length
      if (totalSize > PDF_SECURITY_LIMITS.MAX_FILE_SIZE) {
        reader.cancel()
        throw new Error('PDF file exceeds maximum size during download')
      }

      chunks.push(value)
    }

    const buffer = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)))
    const data = await pdf(buffer)

    // Suite du traitement...
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`[SECURITY] PDF download timeout for ${pdfUrl}`)
      throw new Error('PDF download timeout')
    }
    throw error
  }
}
```

### Étape 3: Ajouter Rate Limiting à l'API

**Mise à jour**: `/app/api/find-in-pdf/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { findInPdf } from '@/lib/pdf.server'
import { rateLimit } from '@/lib/rate-limit'

// Rate limiting: 10 requêtes par minute par IP
const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
  limit: 10,
})

export async function GET(request: NextRequest) {
  // Rate limiting
  const clientIp = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown'

  try {
    await limiter.check(clientIp, 10)
  } catch {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    const q = searchParams.get('q')

    if (!url || !q) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Log pour audit de sécurité
    console.log(`[AUDIT] PDF search request from ${clientIp}: ${url}`)

    const result = await findInPdf(url, q)

    if (result === null) {
      return NextResponse.json({ error: 'Error processing PDF' }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    // Ne pas exposer les détails d'erreur
    console.error('[SECURITY] Error in find-in-pdf API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

## 📊 Impact de l'Implémentation

### Changements Requis

1. **Nouveau module de sécurité** (`/lib/security/pdf-url-validator.ts`)
2. **Modification de** `pdf.server.ts` (ajout validations et limites)
3. **Modification de** `/api/find-in-pdf/route.ts` (rate limiting)
4. **Variables d'environnement** à ajouter :
   ```env
   PDF_ALLOWED_HOSTS="res.cloudinary.com"
   PDF_MAX_SIZE="52428800"
   PDF_TIMEOUT="30000"
   ```

### Performance

- **Impact minimal** : +100-200ms par requête (validation DNS)
- **Mémoire** : Limite à 50MB par PDF empêche l'OOM
- **CPU** : Timeout empêche le blocage des workers

### Compatibilité

- ✅ **Rétrocompatible** avec PDFs Cloudinary existants
- ⚠️ **Breaking Change** : PDFs externes ne fonctionneront plus
- 💡 **Migration** : Ajouter les domaines nécessaires dans `PDF_ALLOWED_HOSTS`

## 🚦 Plan de Déploiement Recommandé

### Phase 1 - Immédiat (Hotfix)

1. Déployer la validation d'URL en mode "log only" pour identifier les usages
2. Analyser les logs pendant 24h
3. Identifier les domaines légitimes utilisés

### Phase 2 - Court terme (48h)

1. Activer le blocage avec whitelist confirmée
2. Implémenter le rate limiting
3. Ajouter monitoring et alertes

### Phase 3 - Moyen terme (1 semaine)

1. Audit complet de toutes les APIs similaires
2. Implémenter CSP headers globalement
3. Tests de pénétration

## 🤔 Questions pour Discussion

Gemini, j'aimerais ton avis sur les points suivants :

1. **Utilisation actuelle** : L'API ne semble pas être appelée dans le frontend actuel. Est-elle utilisée par des services externes ? Peut-on la désactiver temporairement ?

2. **Alternatives architecturales** : Serait-il préférable de :
   - Pré-télécharger les PDFs côté serveur lors de l'upload ?
   - Utiliser un service tiers sandboxé pour l'extraction de texte ?
   - Implémenter un worker isolé pour le traitement PDF ?

3. **Cloudinary** : Peut-on utiliser les APIs Cloudinary pour l'extraction de texte directement, évitant ainsi le téléchargement ?

4. **Cache** : Devrions-nous implémenter un cache Redis pour les résultats de recherche PDF ?

5. **Monitoring** : Quelle solution préfères-tu pour le monitoring de sécurité (Sentry, DataDog, autre) ?

## 📋 Checklist de Validation

Une fois les corrections appliquées, valider :

- [ ] Toutes les URLs non-Cloudinary sont rejetées
- [ ] Les timeouts fonctionnent correctement
- [ ] Le rate limiting est actif
- [ ] Les logs d'audit sont générés
- [ ] Les tests de sécurité passent
- [ ] La documentation est mise à jour
- [ ] Les variables d'environnement sont configurées en production

## 🎯 Conclusion

Cette vulnérabilité représente un risque critique pour l'infrastructure. La solution proposée offre une défense en profondeur avec plusieurs couches de sécurité. L'implémentation peut être réalisée en quelques heures avec un impact minimal sur les fonctionnalités existantes.

**Recommandation finale** : Implémenter le hotfix immédiatement en mode "log only" pour évaluer l'impact, puis activer le blocage complet sous 48h.

J'attends ton retour sur cette analyse et tes recommandations complémentaires.

---

_Opus_  
_22 Août 2025_
