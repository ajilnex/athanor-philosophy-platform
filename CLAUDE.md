# Contexte Technique - L'Athanor

## Session Actuelle - Corrections d'Urgence Déployées ✅

**Problème résolu** : Erreurs 500 sur les pages billets en production
- Conflits React multiples entre Next.js 15 et dépendances MDX
- Downgrade vers React 18.2.0 + next-mdx-remote v4.4.1
- Compilation MDX → Markdown simple temporaire
- Backlinks fonctionnels, site déployé et accessible

## PROCHAINE SESSION - "Opération Unification des Dépendances" 🎯

### Phase 1 : Audit Complet
```bash
npm ls react --depth=99 > audit-react.txt
npm ls @mdx-js --depth=99 > audit-mdx.txt
npm outdated > versions-disponibles.txt
```

### Phase 2 : Recherche de Compatibilité
**Objectif** : Trouver les versions **LATEST** compatibles entre :
- `next@15.x` (gardé)
- `react@18.x` (version récente stable)
- `@mdx-js/react@3.x` (compatibilité React 18)
- `next-mdx-remote@5.x` (avec RSC support)

**Sources à consulter** :
- [Next.js 15 release notes](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [@mdx-js compatibility matrix](https://mdxjs.com/docs/getting-started/#nextjs)
- [next-mdx-remote changelog](https://github.com/hashicorp/next-mdx-remote)

### Phase 3 : Migration Contrôlée
```bash
rm -rf .next node_modules package-lock.json
npm install
```

### Phase 4 : Réactivation MDX
1. Restaurer `lib/mdx.tsx` avec support complet MDX
2. Réactiver composants `<Cite>`, `<Bibliography>`, `<BibliographyIndex>`
3. Test progressif : billets simples → billets avec citations

### Phase 5 : Tests de Non-Régression
- Build local : `npm run build`
- Pages billets avec backlinks
- Fonctionnalités d'édition admin
- Citations bibliographiques

---

## État Actuel du Système

**Architecture** : Next.js 15 App Router + MDX + Prisma + Zotero API
**Déployement** : Vercel (automatique sur push main)
**Base de données** : PostgreSQL (Neon)

### Commandes Critiques
```bash
# Développement local
npm run dev

# Build complet avec graph SVG et bibliographie
npm run build

# Tests base de données
npm run db:push
npm run db:studio
```

### Structure des Billets
- **Contenu** : `content/billets/*.mdx`
- **Backlinks** : `[[titre-billet]]` → liens automatiques
- **Citations** : `<Cite key="author-year-title" />`
- **Bibliographie** : Sync Zotero groupe 6096924

### Dépendances Actuelles (Temporaires)
```json
{
  "react": "18.2.0",
  "react-dom": "18.2.0", 
  "next-mdx-remote": "^4.4.1",
  "@mdx-js/loader": "^2.3.0",
  "@mdx-js/react": "^2.3.0"
}
```

**⚠️ ATTENTION** : MDX simplifié en Markdown dans `lib/mdx.tsx` - À restaurer !

---

## Objectifs Prochaine Session

1. **Unifier les versions React/MDX** vers les dernières stables
2. **Restaurer capacités MDX complètes** (composants React, citations)
3. **Maintenir compatibilité Next.js 15** App Router
4. **Zéro régression** sur fonctionnalités existantes

### Critères de Succès
- [ ] Build Vercel sans warnings React
- [ ] Pages billets avec composants MDX fonctionnels  
- [ ] Citations `<Cite>` opérationnelles
- [ ] Backlinks `[[]]` préservés
- [ ] Admin édition sans erreurs
- [ ] Performance maintenue