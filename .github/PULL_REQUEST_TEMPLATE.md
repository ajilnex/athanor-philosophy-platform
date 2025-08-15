# 🛡️ Checklist de sécurité - Système de commentaires

## ✅ Sécurité & Anti-spam
- [ ] **XSS**: Contenu utilisateur échappé (pas de `dangerouslySetInnerHTML`)
- [ ] **Rate-limit**: Désactivé en prod ou branché sur Upstash Redis
- [ ] **Honeypot**: Champ invisible + délai minimum (3s) implémentés
- [ ] **Validation**: Zod côté API + validation côté client

## ✅ Modération & Permissions  
- [ ] **Filtrage public**: Seuls les commentaires `isApproved=true && isVisible=true` visibles
- [ ] **Auteur**: Voit ses propres commentaires même non approuvés
- [ ] **Admin**: Voit tout, peut modérer en lot
- [ ] **Édition**: Limitée à 15 min pour l'auteur uniquement

## ✅ Base de données & Performance
- [ ] **Relations**: `onDelete: Cascade` pour replies → parent
- [ ] **Index**: `parentId + createdAt` pour pagination des replies
- [ ] **Polymorphisme**: `targetType/targetId` avec validation applicative

## ✅ UX & Intégration
- [ ] **Shield graphe**: `data-graph-shield` sur wrapper CommentSection
- [ ] **Threading**: Max 2 niveaux, UI claire avec indentation
- [ ] **Pagination**: 20/page, navigation stable, tri chronologique ASC
- [ ] **États**: Loading, erreurs, état optimiste gérés

## ✅ Tests manuels (à faire avant merge)
- [ ] **Visiteur**: Voit commentaires + CTA connexion
- [ ] **USER**: Poste → en attente modération, voit ses commentaires
- [ ] **ADMIN**: Poste → auto-publié, peut modérer
- [ ] **Shield**: Aucun clone graphe n'apparaît sur zone commentaires (billets)
- [ ] **Build**: `npm run build` passe sans erreur

## 🚀 Ready for production?
- [ ] **Go**: Tous les items ci-dessus cochés
- [ ] **Variables d'env**: `DISABLE_COMMENT_RATELIMIT=true` en prod si pas Redis
- [ ] **Migration**: `prisma migrate deploy` planifiée (pas `migrate reset`)