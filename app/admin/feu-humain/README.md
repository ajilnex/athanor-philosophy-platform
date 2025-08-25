# Archive FEU HUMAIN 🔥

## Description

Cette archive est une œuvre d'art numérique qui préserve et présente la conversation légendaire "FEU HUMAIN" de manière immersive et esthétique.

## Fonctionnalités

### 🎨 Design Artistique

- Interface sombre avec des accents orange/feu
- Timeline chronologique avec animations
- Effets visuels immersifs (gradients, blur, transitions)
- Mode plein écran pour les médias

### 🔍 Navigation et Recherche

- Recherche en temps réel dans les messages
- Filtres par type de contenu (texte, photos, vidéos, audio)
- Infinite scroll pour une navigation fluide
- Statistiques détaillées de la conversation

### 📸 Gestion des Médias

- Affichage en grille des photos
- Lecteur vidéo intégré
- Lecteur audio pour les messages vocaux
- Modal plein écran pour visualiser les médias

## Installation

1. **Placer les fichiers** : Le dossier `FEU HUMAIN` doit être dans `/public/`
   - `message_1.json` : Le fichier d'export Messenger
   - `photos/` : Toutes les photos de la conversation
   - `videos/` : Toutes les vidéos
   - `audio/` : Tous les fichiers audio
   - `gifs/` : Les GIFs animés
   - `files/` : Autres fichiers partagés

2. **Accès** : L'archive est accessible depuis l'administration à `/admin/feu-humain`

## Structure des Données

Le fichier `message_1.json` contient :

```json
{
  "participants": [
    /* Liste des participants */
  ],
  "messages": [
    {
      "sender_name": "Nom",
      "timestamp_ms": 1234567890000,
      "content": "Message texte",
      "photos": [{ "uri": "photos/photo.jpg" }],
      "videos": [{ "uri": "videos/video.mp4" }],
      "reactions": [{ "reaction": "❤️", "actor": "Nom" }]
    }
  ],
  "title": "FEU HUMAIN",
  "thread_type": "Regular"
}
```

## Personnalisation

### Couleurs

Les couleurs peuvent être modifiées dans le composant :

- Orange primaire : `text-orange-400`, `bg-orange-500`
- Dégradés : `from-orange-400 via-red-500 to-yellow-400`
- Fond : `from-black via-gray-900 to-black`

### Nombre de messages chargés

Par défaut, 50 messages sont chargés initialement, puis 50 de plus à chaque scroll.
Modifier la ligne : `const [visibleMessages, setVisibleMessages] = useState(50)`

## Sécurité

- L'archive est protégée par l'authentification admin
- Les médias sont servis depuis le dossier public (attention aux données sensibles)
- Possibilité d'ajouter un watermark ou un floutage si nécessaire

## Performance

- Lazy loading des images
- Infinite scroll pour éviter de charger tous les messages
- Recherche et filtrage côté client optimisés avec `useMemo`
- Images avec fallback en cas d'erreur de chargement

## Évolutions Possibles

- [ ] Export PDF de la conversation
- [ ] Partage de messages spécifiques
- [ ] Analyse des sentiments et statistiques avancées
- [ ] Mode présentation/diaporama
- [ ] Intégration de musique d'ambiance
- [ ] Effets sonores sur les interactions
- [ ] Sauvegarde de messages favoris
- [ ] Génération d'un livre photo automatique

## Philosophie

Cette archive transforme une conversation de groupe en une œuvre d'art numérique, préservant non seulement les mots échangés mais aussi l'énergie, l'émotion et la dynamique du groupe. C'est un monument digital à l'amitié et aux moments partagés.

"Le feu humain ne s'éteint jamais vraiment, il se transforme en lumière dans nos mémoires." 🔥

## Support

Pour toute question ou amélioration, contactez l'administrateur du site.
