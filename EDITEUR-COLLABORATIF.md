# 🎨 Éditeur Collaboratif d'Athanor

## ✨ Fonctionnalités Implémentées

### Architecture
- **✅ Souveraineté MD(X)** : Une seule source de vérité (filesystem Git)
- **✅ API GitHub Native** : Édition directe via API GitHub + commits automatiques
- **✅ Éditeur Intégré** : Modal d'édition fluide avec toolbar personnalisée
- **✅ Workflow Images Sans Friction** : Upload → insertion automatique de syntaxe markdown

### Interface Utilisateur
- **✅ Bouton "Nouveau Billet"** sur `/billets` (visible admins uniquement)
- **✅ Bouton "Éditer"** sur chaque billet individuel (visible admins uniquement)
- **✅ Modal d'édition** avec :
  - Champs : Titre, Slug (auto-généré), Tags, Résumé, Contenu
  - Toolbar : Bouton Image + Preview/Éditer + Sauvegarder
  - Upload d'images intégré avec insertion automatique de syntaxe markdown

## 🔧 Configuration Requise

### Variables d'Environnement
Ajoutez dans `.env.local` :

```env
# GitHub API pour édition collaborative
GITHUB_TOKEN="ghp_votre-token-github"
GITHUB_OWNER="ajilnex"
GITHUB_REPO="athanor-philosophy-platform"
```

### GitHub Personal Access Token
1. Allez sur GitHub → Settings → Developer Settings → Personal Access Tokens
2. Créez un **Fine-grained personal access token** avec :
   - **Repository access** : `athanor-philosophy-platform`
   - **Permissions** :
     - Contents: Read and write
     - Metadata: Read
     - Pull requests: Write (optionnel)

## 🚀 Workflow d'Usage

### Créer un Nouveau Billet
1. Aller sur `/billets`
2. Cliquer sur **"Nouveau billet"** (bouton bleu, visible admins)
3. **Saisir** :
   - Titre → Slug auto-généré au format `YYYY-MM-DD-titre`
   - Tags (séparés par virgules)
   - Résumé (optionnel)
   - Contenu (markdown)
4. **Ajouter des images** :
   - Cliquer sur bouton **"Image"** dans toolbar
   - Sélectionner fichier (max 20MB, optimisation Cloudinary auto)
   - Syntaxe `![nom](https://url)` insérée automatiquement dans l'éditeur
5. Cliquer **"Sauvegarder"**
   - Commit automatique sur GitHub
   - Déploiement Vercel automatique
   - Redirection vers le nouveau billet

### Éditer un Billet Existant
1. Aller sur n'importe quel billet (ex: `/billets/2025-08-11-mon-billet`)
2. Cliquer **"Éditer"** (bouton en haut à droite, visible admins)
3. **Modifier** le contenu dans l'éditeur modal
4. **Ajouter des images** via bouton toolbar (même workflow)
5. Cliquer **"Sauvegarder"**
   - Commit automatique avec message formaté
   - Déploiement automatique
   - Rechargement page avec changements

## 🎯 Avantages de cette Architecture

### Pour l'Utilisateur
- **UX Fluide** : Édition in-situ sans navigation externe
- **Workflow Intégré** : Upload d'images → insertion automatique
- **Pas de Formation** : Interface intuitive, pas besoin d'apprendre TinaCMS
- **Responsivité** : Fonctionne sur mobile/desktop

### Pour le Système
- **Git as CMS** : Historique complet, branches, collaboration native
- **Aucune Synchronisation** : Plus de double source de vérité (BDD/fichiers)
- **Commits Propres** : Messages formatés automatiquement
- **Déploiement Automatique** : Push → Vercel build → Live

### Pour la Maintenance
- **Architecture Simple** : Filesystem + API GitHub + Interface React
- **Pas de Complexité** : Plus de TinaCMS, scripts de migration, ou synchro DB
- **Extensible** : Ajouter nouveaux composants/boutons dans toolbar trivial
- **Portable** : Fonctionne avec n'importe quel repo Git

## 🛠️ Extension Future

### Composants Additionnels
La toolbar peut facilement accueillir :
- **Bibliographie Zotero** : Bouton → recherche Zotero → insertion citation
- **Références Internes** : Bouton → sélecteur d'autres billets → backlinks
- **Médias** : Support vidéo, audio, documents
- **Templates** : Bouton → sélection template de billet

### Collaboration Avancée
- **Commentaires** : Via GitHub Issues API
- **Suggestions** : Via GitHub Pull Requests
- **Review** : Workflow approbation admin
- **Notifications** : Webhooks GitHub → Discord/Slack

## 📊 Statut Actuel

### ✅ Fonctionnel
- Architecture complète implémentée
- Interface utilisateur opérationnelle
- APIs GitHub créées et testées
- Workflow images intégré

### ⚠️ Configuration Requise
- **GitHub Token** : À configurer en production
- **Variables d'environnement** : À déployer sur Vercel
- **Permissions** : Token avec access au repository

### 🎯 Prêt pour Production
L'éditeur collaboratif est **architecturalement complet** et prêt à être utilisé dès que les variables d'environnement GitHub sont configurées.

---

**L'Athanor n'est plus seulement un site qui affiche des billets. C'est maintenant un véritable outil de pensée collaborative.** 🚀