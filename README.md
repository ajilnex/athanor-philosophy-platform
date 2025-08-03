# Athanor - Plateforme Philosophique

Une plateforme moderne pour publier et consulter des articles de philosophie avec visualiseur PDF intégré.

## Fonctionnalités

- ✨ **Interface moderne** - Design académique et épuré
- 📚 **Visualiseur PDF intégré** - Lecture directe dans le navigateur
- 🔍 **Recherche avancée** - Recherche par titre, auteur, description et mots-clés
- 🛡️ **Interface d'administration** - Gestion complète des articles
- 📱 **Responsive** - Optimisé pour tous les appareils
- 🎨 **Design académique** - Typographie et couleurs pensées pour la lecture

## Technologies

- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Typage statique
- **Tailwind CSS** - Framework CSS utilitaire
- **Prisma** - ORM et gestion de base de données
- **SQLite** - Base de données locale
- **React PDF** - Visualisation PDF
- **Fuse.js** - Recherche floue

## Installation

1. **Clonez le dépôt**
   ```bash
   git clone <url-du-repo>
   cd philosophy-platform
   ```

2. **Installez les dépendances**
   ```bash
   npm install
   ```

3. **Configurez l'environnement**
   ```bash
   cp .env.example .env
   ```

4. **Initialisez la base de données**
   ```bash
   npx prisma db push
   ```

5. **Lancez le serveur de développement**
   ```bash
   npm run dev
   ```

6. **Ouvrez votre navigateur**
   ```
   http://localhost:3000
   ```

## Structure du projet

```
philosophy-platform/
├── app/                    # App Router de Next.js
│   ├── admin/             # Interface d'administration
│   ├── articles/          # Pages des articles
│   ├── search/            # Page de recherche
│   └── api/              # Routes API
├── components/            # Composants React réutilisables
│   ├── layout/           # Composants de mise en page
│   └── admin/            # Composants d'administration
├── lib/                  # Utilitaires et configuration
├── prisma/               # Schéma et migrations de base de données
└── public/               # Fichiers statiques
    └── uploads/          # Fichiers PDF uploadés
```

## Administration

Accédez à l'interface d'administration via `/admin` pour :

- **Ajouter des articles** - Upload de fichiers PDF avec métadonnées
- **Gérer les articles** - Publier/dépublier, modifier, supprimer
- **Voir les statistiques** - Nombre d'articles, taille totale, etc.

## Développement

### Scripts disponibles

- `npm run dev` - Serveur de développement
- `npm run build` - Build de production
- `npm run start` - Serveur de production
- `npm run lint` - Vérification du code
- `npm run db:push` - Synchronisation du schéma de base de données
- `npm run db:studio` - Interface graphique Prisma Studio

### Ajout d'articles

1. Allez sur `/admin/upload`
2. Sélectionnez un fichier PDF (max 50MB)
3. Remplissez les métadonnées (titre, description, auteur, mots-clés)
4. Cliquez sur "Ajouter l'Article"

## Production

Pour déployer en production :

1. **Build du projet**
   ```bash
   npm run build
   ```

2. **Configuration de la base de données**
   - Pour PostgreSQL : modifiez `DATABASE_URL` dans `.env`
   - Lancez `npx prisma db push` sur le serveur

3. **Variables d'environnement**
   - `DATABASE_URL` - URL de la base de données
   - `NEXTAUTH_URL` - URL de votre site
   - `NEXTAUTH_SECRET` - Clé secrète pour l'authentification

## Personnalisation

### Thème et couleurs

Modifiez les couleurs dans `tailwind.config.ts` :

```typescript
colors: {
  primary: { /* Couleurs principales */ },
  accent: { /* Couleurs d'accent */ }
}
```

### Typographie

Les polices sont configurées dans `globals.css` :
- **Crimson Text** pour les titres (serif)
- **Inter** pour le corps de texte (sans-serif)

## Support

Pour toute question ou problème, veuillez créer une issue dans le dépôt GitHub.