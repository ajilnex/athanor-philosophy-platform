# 🧪 Guide Complet des Tests - L'Athanor

**Version**: 1.0.0  
**Date**: 23 Août 2025  
**Statut**: Documentation de référence pour les tests

---

## 📋 Vue d'Ensemble

L'Athanor utilise une stratégie de tests à trois niveaux pour garantir la qualité et la stabilité :

1. **Tests Unitaires** (Jest + React Testing Library) - Composants isolés
2. **Tests d'Intégration** (Jest) - Interactions entre modules
3. **Tests E2E** (Playwright) - Parcours utilisateur complets

---

## 🎯 Stratégie de Tests

### Pyramide de Tests

```
        /\
       /E2E\        (10%) - Parcours critiques
      /------\
     /Intégra-\     (30%) - APIs, hooks, services
    / tion     \
   /------------\
  / Unitaires    \  (60%) - Composants, utils, helpers
 /________________\
```

### Quand utiliser quel type de test ?

| Type            | Utilisation       | Exemple                  | Vitesse    | Fiabilité          |
| --------------- | ----------------- | ------------------------ | ---------- | ------------------ |
| **Unitaire**    | Logique isolée    | Fonction de formatage    | ⚡ Rapide  | ✅ Très fiable     |
| **Intégration** | Modules connectés | API + Base de données    | 🚶 Moyenne | ✅ Fiable          |
| **E2E**         | Parcours complet  | Login → Create → Publish | 🐢 Lent    | ⚠️ Peut être flaky |

---

## 🧑‍💻 Tests Unitaires (Jest)

### Configuration

```javascript
// jest.config.js - Configuration actuelle
{
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'  // Support des imports @/
  }
}
```

### Commandes

```bash
# Lancer tous les tests unitaires
npm run test:unit

# Mode watch (développement)
npm run test:unit:watch

# Avec coverage
npm run test:unit:coverage
```

### Exemple de Test Unitaire

```typescript
// __tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('should call onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    const button = screen.getByRole('button', { name: /click me/i })
    fireEvent.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Mocks Disponibles

Les mocks suivants sont configurés dans `jest.setup.js` :

- **NextAuth** : Session mockée avec user admin
- **Prisma Client** : Client mocké pour tests isolés
- **Next Router** : Navigation mockée
- **Next Image** : Composant simplifié
- **Cloudinary** : Upload mocké

---

## 🎭 Tests E2E (Playwright)

### Configuration

```typescript
// playwright.config.ts - Configuration actuelle
{
  baseURL: 'http://localhost:3000',
  webServer: {
    command: 'npm run test:e2e:start',  // Build + Start réel
    timeout: CI ? 300_000 : 120_000
  },
  use: {
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure'
  }
}
```

### Commandes

```bash
# Lancer tous les tests E2E
npm test

# Mode UI (debugging interactif)
npm run test:ui

# Test spécifique
npx playwright test tests/e2e/home.spec.ts

# Sans démarrer le serveur (utilise serveur existant)
PLAYWRIGHT_WEB_SERVER=none npm test

# Voir les traces d'un test échoué
npx playwright show-trace test-results/*/trace.zip
```

### Structure des Tests E2E

```typescript
// tests/e2e/presse-papier.spec.ts
import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../helpers/auth'

test.describe('Presse-papier', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should create a new press clip', async ({ page }) => {
    // Navigation
    await page.goto('/admin/presse-papier')

    // Interaction
    await page.fill('input[name="url"]', 'https://example.com/article')
    await page.fill('textarea[name="note"]', 'Article intéressant')
    await page.click('button[type="submit"]')

    // Assertion
    await expect(page.locator('text=Article intéressant')).toBeVisible()
  })
})
```

### Helpers Disponibles

```typescript
// tests/helpers/auth.ts
export async function loginAsAdmin(page: Page) {
  // Connexion automatique avec admin@athanor.com
}

// tests/helpers/navigation.ts
export async function navigateToBillet(page: Page, slug: string) {
  // Navigation sécurisée vers un billet
}

// tests/helpers/uploads.ts
export async function uploadPDF(page: Page, filePath: string) {
  // Upload de fichier PDF
}
```

---

## 🔄 Différences Dev Local vs CI vs Production

### Environnement Local

```bash
# Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/athanor_dev"
NEXTAUTH_URL="http://localhost:3000"
DISABLE_COMMENT_RATELIMIT="true"  # Pour faciliter les tests

# Base de données
npm run db:dev:start    # Docker PostgreSQL
npm run db:migrate:dev  # Migrations avec prompts

# Tests
npm test               # E2E avec serveur auto
npm run test:unit      # Jest en mode watch
```

### Environnement CI (GitHub Actions)

```yaml
# .github/workflows/e2e.yml
env:
  DATABASE_URL: postgresql://postgres:postgres@localhost:5432/athanor_test
  NEXTAUTH_URL: http://localhost:3000

services:
  postgres: # Service PostgreSQL éphémère
    image: postgres:15

steps:
  - npx prisma migrate deploy # Sans prompts
  - node scripts/create-admin.js # Seed admin
  - npx playwright test # Tests headless
```

### Environnement Production

```bash
# Configuration (Vercel)
DATABASE_URL="postgresql://[NEON_URL]"
NEXTAUTH_URL="https://athanor.vercel.app"
DISABLE_COMMENT_RATELIMIT=undefined  # JAMAIS en production
PDF_ALLOWED_HOSTS="res.cloudinary.com"  # Sécurité stricte

# Pas de tests en production
# Monitoring via Sentry pour les erreurs runtime
```

---

## 🔍 Smoke Tests vs Tests Complets

### Smoke Tests (Vérification rapide)

**Objectif** : Vérifier que les fonctionnalités critiques fonctionnent

```bash
# Script de smoke test
npm run test:smoke

# Tests inclus :
- Page d'accueil charge
- Login fonctionne
- Un billet s'affiche
- Recherche retourne des résultats
```

**Durée** : ~30 secondes

### Tests Complets

**Objectif** : Valider tous les parcours utilisateur

```bash
# Tous les tests
npm test

# Tests inclus :
- Tous les smoke tests
- CRUD complet (create, read, update, delete)
- Cas d'erreur
- Validations
- Permissions
```

**Durée** : ~5 minutes

---

## 🐛 Debugging des Tests

### Tests E2E qui échouent

1. **Voir la trace**

   ```bash
   npx playwright show-trace test-results/*/trace.zip
   ```

2. **Mode debug interactif**

   ```bash
   npm run test:ui
   ```

3. **Console logs**

   ```typescript
   page.on('console', msg => console.log(msg.text()))
   ```

4. **Screenshots**
   ```typescript
   await page.screenshot({ path: 'debug.png' })
   ```

### Tests Jest qui échouent

1. **Mode verbose**

   ```bash
   npm test -- --verbose
   ```

2. **Un seul test**

   ```bash
   npm test -- --testNamePattern="should render"
   ```

3. **Debugger**
   ```typescript
   debugger;  // Ajouter dans le test
   npm test -- --inspect
   ```

---

## 📝 Écrire de Nouveaux Tests

### Checklist pour un nouveau test E2E

- [ ] Utiliser `loginAsAdmin` si auth requise
- [ ] Nettoyer les données après le test
- [ ] Utiliser des sélecteurs stables (`data-testid`)
- [ ] Ajouter des assertions explicites
- [ ] Gérer les timeouts pour les opérations async
- [ ] Capturer les console logs si nécessaire

### Template de Test E2E

```typescript
import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../helpers/auth'

test.describe('Feature Name', () => {
  // Setup commun
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  // Cleanup après chaque test
  test.afterEach(async ({ page }) => {
    // Nettoyer les données créées
  })

  test('should do something specific', async ({ page }) => {
    // Arrange - Préparer les données
    await page.goto('/target-page')

    // Act - Effectuer l'action
    await page.click('button[data-testid="action-button"]')

    // Assert - Vérifier le résultat
    await expect(page.locator('[data-testid="result"]')).toBeVisible()
  })

  test('should handle errors gracefully', async ({ page }) => {
    // Tester les cas d'erreur
  })
})
```

---

## 🚀 Tests Manquants Prioritaires

### Tests E2E à Créer

1. **Publications PDF** (`tests/e2e/publications.spec.ts`)
   - Upload PDF
   - Consulter une publication
   - Recherche dans PDF
   - Téléchargement

2. **Commentaires** (`tests/e2e/comments.spec.ts`)
   - Ajouter un commentaire
   - Répondre à un commentaire
   - Modération (admin)
   - Pagination

3. **Recherche** (`tests/e2e/search.spec.ts`)
   - Recherche globale
   - Filtres
   - Résultats billets vs publications
   - Pas de résultats

4. **Graphe** (`tests/e2e/graph.spec.ts`)
   - Navigation dans le graphe
   - Zoom/Pan
   - Click sur nœud
   - Mode constellation

### Tests Unitaires à Créer

1. **Composants UI** (`__tests__/components/`)
   - SearchBar
   - CommentSection
   - PublicationCard
   - GraphNode

2. **Hooks** (`__tests__/hooks/`)
   - useDebounce
   - useSWR wrappers
   - useAuth

3. **Utils** (`__tests__/lib/`)
   - Format functions
   - Validation helpers
   - API clients

---

## 📊 Métriques et Objectifs

### Coverage Actuel vs Objectif

| Catégorie      | Actuel | Objectif | Priorité  |
| -------------- | ------ | -------- | --------- |
| **Statements** | ~20%   | 80%      | 🔴 High   |
| **Branches**   | ~15%   | 70%      | 🔴 High   |
| **Functions**  | ~25%   | 80%      | 🟠 Medium |
| **Lines**      | ~20%   | 80%      | 🔴 High   |

### Commande pour voir le coverage

```bash
npm run test:unit:coverage
# Ouvrir coverage/lcov-report/index.html dans le navigateur
```

---

## 🔧 Configuration CI/CD

### GitHub Actions - Tests sur PR

```yaml
# .github/workflows/tests.yml
name: Tests

on:
  pull_request:
  push:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:unit:coverage
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    services:
      postgres: # ...
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npx playwright install
      - run: npm test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report
```

---

## 🎓 Bonnes Pratiques

### DO ✅

- Écrire des tests avant de fixer un bug (TDD)
- Utiliser des data-testid pour les sélecteurs E2E
- Mocker les services externes (API, DB) dans les tests unitaires
- Faire des assertions explicites et descriptives
- Nettoyer après chaque test
- Grouper les tests par fonctionnalité

### DON'T ❌

- Faire des tests qui dépendent de l'ordre d'exécution
- Utiliser des sélecteurs CSS fragiles
- Faire des tests trop longs (>1 minute pour E2E)
- Ignorer les tests flaky (les fixer!)
- Tester l'implémentation plutôt que le comportement
- Commiter avec des tests qui échouent

---

## 📚 Ressources

- [Documentation Playwright](https://playwright.dev)
- [Testing Library](https://testing-library.com)
- [Jest Documentation](https://jestjs.io)
- [Guide Next.js Testing](https://nextjs.org/docs/testing)

---

## 🆘 Support

Pour toute question sur les tests :

1. Consulter ce guide
2. Regarder les tests existants comme exemples
3. Demander dans le COLLAB_LOG.md
4. Créer une issue GitHub si bug

---

_Guide maintenu par l'équipe L'Athanor_  
_Dernière mise à jour : 23 Août 2025_
