# 📝 PLAN D'ACTION - Mise à Jour Documentation L'Athanor

**Date**: 23 Août 2025  
**Auteur**: Opus  
**Objectif**: Actions concrètes pour aligner la documentation avec l'état actuel du projet

---

## 🎯 Résumé des Actions Prioritaires

Suite à l'audit complet, voici les actions à effectuer pour mettre à jour la documentation :

### 🔴 CRITIQUE (À faire immédiatement)

1. **Mettre à jour SECURITY.md**
   - Documenter la résolution de la vulnérabilité SSRF
   - Ajouter les nouvelles variables `PDF_ALLOWED_HOSTS`
   - Clarifier les bonnes pratiques de sécurité actuelles

2. **Clarifier AGENTS.md**
   - Corriger la référence circulaire (pointe vers lui-même)
   - Soit fusionner avec GEMINI.md, soit supprimer la redondance

### 🟠 IMPORTANT (Cette semaine)

4. **Écrire 4 tests E2E prioritaires** :
   - ✅ TESTING.md créé (guide complet)
   - Ajouter exemples de tests E2E pour chaque feature
   - Documenter les smoke tests vs tests complets

5. **Actualiser DEPLOY.md**
   - Ajouter section sur les migrations en production
   - Documenter pourquoi `prisma migrate deploy` n'est pas dans le build
   - Clarifier la stratégie preview vs production

6. **Nettoyer COLLAB_LOG.md**
   - Archiver les entrées d'août 2025
   - Garder seulement les infos pertinentes actuelles
   - Ajouter exemples de collaboration réussie

### 🟡 SECONDAIRE (Ce mois)

6. **Réorganiser les fichiers de documentation**

   ```
   docs/
   ├── archive/
   │   ├── 2025-08-SSRF-report.md (ancien OPUS.md)
   │   └── old-collab-logs.md
   ├── features/
   │   ├── salle-du-temps.md
   │   └── editeur-collaboratif.md
   └── guides/
       ├── testing.md
       └── snapshot-workflow.md
   ```

7. **Créer un CHANGELOG.md**
   - Historique des versions
   - Breaking changes
   - Nouvelles features

8. **Consolider les variables d'environnement**
   - Créer `.env.example.full` avec TOUTES les variables
   - Documenter chaque variable et ses valeurs possibles

---

## 📋 Modifications Spécifiques par Fichier

### SECURITY.md - Ajouts nécessaires

````markdown
## ✅ Vulnérabilités Résolues

### SSRF dans /api/find-in-pdf (Août 2025)

- **Statut**: RÉSOLU
- **Solution**: Validation stricte des URLs avec allowlist
- **Configuration requise**:
  ```env
  PDF_ALLOWED_HOSTS="res.cloudinary.com"
  PDF_MAX_SIZE="52428800"
  PDF_TIMEOUT="30000"
  ```
````

````

### DEPLOY.md - Section à ajouter

```markdown
## 🗄️ Gestion des Migrations en Production

### Pourquoi les migrations ne sont PAS dans le build

Les migrations Prisma (`prisma migrate deploy`) ont été retirées du script de build pour éviter :
- Erreurs réseau pendant le build (P1001)
- Conflits d'historique de migrations (P3009)
- Timeouts sur Vercel (limite 45s)

### Process recommandé

1. **Avant le déploiement** : Exécuter les migrations manuellement
   ```bash
   npx prisma migrate deploy --schema=./prisma/schema.prisma
````

2. **Vérifier le statut**

   ```bash
   npx prisma migrate status
   ```

3. **Puis déployer** via git push ou Vercel

````

### README.md - Sections à mettre à jour

```markdown
## 🧪 Tests

Le projet utilise une stratégie de tests complète :

- **Tests unitaires** : Jest + React Testing Library
- **Tests E2E** : Playwright avec build production réel
- **CI/CD** : GitHub Actions sur PR

Voir [TESTING.md](./TESTING.md) pour le guide complet.

## 🔒 Sécurité

- ✅ Vulnérabilité SSRF résolue (août 2025)
- ✅ Rate limiting sur commentaires
- ✅ Validation stricte des uploads PDF

Voir [SECURITY.md](./SECURITY.md) pour les détails.
````

---

## 🗂️ Fichiers à Archiver ou Supprimer

| Fichier                         | Action                      | Raison                         |
| ------------------------------- | --------------------------- | ------------------------------ |
| `OPUS.md`                       | Archiver → `docs/archive/`  | Rapport SSRF maintenant résolu |
| `BUILD_TRIGGER.md`              | Supprimer ou documenter     | Une ligne seulement            |
| `DEPLOY_TRIGGER.md`             | Supprimer ou documenter     | Une ligne seulement            |
| `SALLE_DU_TEMPS_*.md`           | Déplacer → `docs/features/` | Features spécifiques           |
| Vieux logs dans `COLLAB_LOG.md` | Archiver                    | Obsolètes                      |

---

## 🚀 Nouvelles Sections à Créer

### 1. Guide de Contribution (CONTRIBUTING.md)

```markdown
# Contributing to L'Athanor

## Getting Started

- Fork & clone
- Install dependencies
- Run tests

## Development Workflow

- Branch naming
- Commit messages
- PR process

## Testing Requirements

- All PRs must pass E2E tests
- New features need tests
- Maintain 80% coverage
```

### 2. Architecture Decision Records (docs/adr/)

Documenter les décisions importantes :

- ADR-001: Pourquoi Git-as-CMS pour les billets
- ADR-002: Choix de Playwright pour E2E
- ADR-003: Migration de SQLite vers PostgreSQL
- ADR-004: Stratégie de snapshot prod→dev

---

## ⏰ Timeline Proposée

### Semaine 1 (Immédiat)

- [ ] Update SECURITY.md (1h)
- [ ] Fix AGENTS.md reference (30min)
- [ ] Archive old files (30min)

### Semaine 2

- [ ] Update DEPLOY.md (2h)
- [ ] Clean COLLAB_LOG.md (1h)
- [ ] Create .env.example.full (1h)

### Semaine 3-4

- [ ] Write CONTRIBUTING.md (2h)
- [ ] Create CHANGELOG.md (1h)
- [ ] Reorganize docs/ structure (2h)
- [ ] Write first ADRs (4h)

---

## 📊 Métriques de Succès

La documentation sera considérée à jour quand :

- [ ] 100% des vulnérabilités résolues sont documentées
- [ ] Tous les fichiers .md sont cohérents avec le code
- [ ] Les nouveaux développeurs peuvent démarrer en <30min
- [ ] Les tests E2E documentés permettent d'écrire de nouveaux tests facilement
- [ ] Pas de références circulaires ou fichiers obsolètes

---

## 🤝 Prochaines Étapes

1. **Validation** : Partager ce plan avec l'équipe (via COLLAB_LOG.md)
2. **Priorisation** : Confirmer l'ordre des actions
3. **Exécution** : Commencer par les items CRITIQUES
4. **Review** : Faire relire les changements importants
5. **Maintenance** : Établir un process de mise à jour régulière

---

## 📝 Notes pour les Autres Agents

**Pour Gemini** :

- Tu peux m'aider sur la réorganisation des fichiers
- Ton avis sur l'architecture des docs serait précieux

**Pour Claude** :

- Tu as l'autorité de commit, je te fournirai les changements
- CLAUDE.md est déjà excellent, juste à maintenir à jour

**Pour GPT** :

- Tu pourrais enrichir les tests E2E manquants
- Ton expérience sur le CI/CD sera utile

---

_Plan d'action créé par Opus - 23 Août 2025_  
_À discuter et valider avec l'équipe avant exécution_
