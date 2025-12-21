# Athanor Design System

## Palette de Couleurs (Solarized)

Le site utilise la palette **Solarized** avec une esthétique **Solarpunk**.

### Variables CSS Principales (`globals.css`)

```css
/* Fonds */
--background: #fdf6e3;          /* Crème clair (sol-base3) */
--background-elevated: #eee8d5; /* Légèrement plus foncé (sol-base2) */
--muted: #eee8d5;               /* Pour les zones secondaires */

/* Texte */
--foreground: #073642;          /* Texte principal (sol-base02) */
--subtle: #586e75;              /* Texte secondaire (sol-base01) */

/* Accents */
--accent: #2aa198;              /* Cyan (sol-cyan) - liens, boutons */
--accent-hover: #268bd2;        /* Bleu au hover (sol-blue) */
--destructive: #dc322f;         /* Rouge pour erreurs (sol-red) */
--success: #859900;             /* Vert pour succès (sol-green) */
--warning: #b58900;             /* Jaune pour warnings (sol-yellow) */
```

### Aliases (Compatibilité)

Les pages immersives (Archive) utilisent parfois des noms alternatifs :

| Nom Archive        | Équivalent Global       |
|--------------------|-------------------------|
| `--void`           | `--background`          |
| `--abyss`          | `--background-elevated` |
| `--text-primary`   | `--foreground`          |
| `--text-tertiary`  | `--subtle`              |
| `--border-subtle`  | `rgba(7, 54, 66, 0.06)` |

## Classes Utilitaires

### Boutons

```html
<!-- Primaire (gradient cyan) -->
<button class="btn-primary">Action</button>

<!-- Secondaire (bordure) -->
<button class="btn-secondary">Secondaire</button>

<!-- Danger -->
<button class="btn-danger">Supprimer</button>
```

### Cartes

```html
<div class="card border-subtle">
  <!-- Contenu -->
</div>
```

### Glass (Glassmorphism)

```html
<div class="glass">
  <!-- Contenu avec effet de verre -->
</div>
```

## Typographie

- **Titres** : IBM Plex Serif (`font-serif`)
- **Corps** : Inter (`font-sans`)
- **Code** : SF Mono ou JetBrains Mono (`font-mono`)

### Poids

- `font-light` (300) : Titres élégants
- `font-normal` (400) : Corps de texte
- `font-medium` (500) : Emphase légère
- `font-semibold` (600) : Labels, boutons

## Pages Immersives

Les pages sous `(immersive)` (comme l'Archive Feu Humain) importent leur propre CSS :

```tsx
import './feu-humain.css'
```

Ce CSS définit les mêmes variables avec des noms légèrement différents mais les mêmes valeurs Solarized.

## Bonnes Pratiques

1. **Éviter les couleurs Tailwind brutes** : Pas de `bg-gray-100`, utiliser `bg-muted`
2. **Utiliser les variables CSS** : `text-foreground` au lieu de `text-gray-800`
3. **Classes réutilisables** : Préférer `.card` à des styles inline
4. **Cohérence** : Même spacing, même border-radius dans toute l'app
