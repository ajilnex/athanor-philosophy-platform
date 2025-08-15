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

- **Next.js 15.x** - Framework React avec App Router
- **React 19** - Bibliothèque d'interface utilisateur
- **TypeScript** - Typage statique
- **Tailwind CSS** - Framework CSS utilitaire
- **Prisma** - ORM et gestion de base de données
- **PostgreSQL** - Base de données via Prisma
- **MDX support** - Support des contenus MDX via @next/mdx
- **Fuse.js** - Recherche floue

## Installation

1. **Clonez le dépôt**
   ```bash
   git clone <url-du-repo>
   cd athanor
   ```

2. **Installez les dépendances**
   ```bash
   npm install
   ```

3. **Configurez l'environnement**
   ```bash
   cp .env.example .env.local
   ```
   
   Modifiez `.env.local` avec vos variables d'environnement :
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/athanor_dev"
   DIRECT_DATABASE_URL="postgresql://user:password@localhost:5432/athanor_dev"
   ```

4. **Lancez PostgreSQL avec Docker**
   ```bash
   docker run --name postgres-athanor -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -e POSTGRES_DB=athanor_dev -p 5432:5432 -d postgres:15
   ```

5. **Initialisez la base de données**
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

6. **Lancez le serveur de développement**
   ```bash
   npm run dev
   ```

7. **Ouvrez votre navigateur**
   ```
   http://localhost:3000
   ```

## Structure du projet

```
philosophy-platform/
├── app/                    # App Router de Next.js
│   ├── admin/             # Interface d'administration
│   ├── billets/           # Pages des billets (MDX)
│   ├── edition/           # Maison d'édition et auteurs
│   ├── graphe/            # Visualisation graphique
│   ├── publications/      # Pages des publications
│   ├── recherche/         # Page de recherche
│   └── api/              # Routes API
├── components/            # Composants React réutilisables
│   ├── graph/            # Composants de visualisation
│   ├── layout/           # Composants de mise en page
│   ├── publications/     # Composants PDF et publications
│   └── ui/               # Composants d'interface
├── content/              # Contenu MDX
│   └── billets/          # Billets au format MDX
├── lib/                  # Utilitaires et configuration
├── prisma/               # Schéma et migrations de base de données
├── scripts/              # Scripts de build et utilitaires
└── public/               # Fichiers statiques
    ├── images/           # Images et assets
    └── uploads/          # Fichiers PDF uploadés
```

## Administration

### Publications (PDF - Dynamique)

Accédez à l'interface d'administration via `/admin` pour :

- **Ajouter des articles** - Upload de fichiers PDF avec métadonnées sur Cloudinary
- **Gérer les articles** - Publier/dépublier, modifier, supprimer
- **Voir les statistiques** - Nombre d'articles, taille totale, etc.

### Gestion des Billets (Workflow Git)

La section "Billets" fonctionne sur un principe de "Git-as-a-CMS". Toute gestion de contenu se fait directement via des commandes Git.

- **Pour créer un billet :** Ajoutez un nouveau fichier `.md` dans le dossier `content/billets/`, puis exécutez `git add`, `git commit`, et `git push`.
- **Pour modifier un billet :** Éditez le fichier `.md` correspondant, puis exécutez `git add`, `git commit`, et `git push`.
- **Pour supprimer un billet :** Utilisez la commande `git rm` pour supprimer le fichier, puis exécutez `git commit` et `git push`.
    ```bash
    # Exemple de suppression de billet
    git rm content/billets/2025-08-05-dialectique-du-pomodoro.md
    git commit -m "Suppression: billet sur le pomodoro"
    git push
    ```

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