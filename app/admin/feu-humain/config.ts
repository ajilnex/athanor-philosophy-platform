// Configuration de l'archive FEU HUMAIN
// Personnalisez cette configuration selon vos besoins

export const archiveConfig = {
  // Informations générales
  title: 'FEU HUMAIN',
  subtitle: 'Conversation légendaire',
  description: "Archive complète de la conversation transformée en œuvre d'art numérique",

  // Chemins des fichiers
  paths: {
    conversation: '/FEU HUMAIN/message_1.json',
    photos: '/FEU HUMAIN/photos/',
    videos: '/FEU HUMAIN/videos/',
    audio: '/FEU HUMAIN/audio/',
    gifs: '/FEU HUMAIN/gifs/',
    files: '/FEU HUMAIN/files/',
  },

  // Options d'affichage
  display: {
    initialMessagesCount: 50,
    loadMoreCount: 50,
    enableInfiniteScroll: true,
    showTimeline: true,
    showReactions: true,
    showMediaPreviews: true,
    animationsEnabled: true,
    darkMode: true,
  },

  // Thème et couleurs
  theme: {
    primaryColor: 'orange',
    accentColors: {
      primary: '#f97316', // orange-500
      secondary: '#ef4444', // red-500
      tertiary: '#fbbf24', // yellow-400
    },
    gradients: {
      header: 'from-orange-900/20 via-red-900/20 to-yellow-900/20',
      title: 'from-orange-400 via-red-500 to-yellow-400',
      background: 'from-black via-gray-900 to-black',
      timeline: 'from-orange-600/20 to-transparent',
    },
    fonts: {
      sans: 'font-sans',
      serif: 'font-serif',
    },
  },

  // Fonctionnalités
  features: {
    search: {
      enabled: true,
      placeholder: 'Rechercher dans la conversation...',
      caseSensitive: false,
      searchInContent: true,
      searchInSenderNames: true,
    },
    filters: {
      enabled: true,
      types: ['all', 'text', 'photos', 'videos', 'audio'],
      defaultFilter: 'all',
    },
    export: {
      enabled: true,
      formats: ['txt', 'json', 'html'],
      includeMedia: false, // Les médias ne sont pas inclus dans l'export par défaut
    },
    favorites: {
      enabled: true,
      storageKey: 'feu-humain-favorites',
      maxFavorites: 100,
    },
    statistics: {
      enabled: true,
      showByDefault: true,
      includeCharts: false, // Graphiques désactivés par défaut
    },
  },

  // Messages spéciaux à mettre en évidence
  highlights: {
    enabled: true,
    // Ajoutez des timestamps de messages importants
    messageTimestamps: [
      // Exemple: 1609459200000, // 1er janvier 2021 00:00
    ],
    // Mots-clés à surligner
    keywords: ['important', 'mémorable', 'légendaire'],
  },

  // Métadonnées pour le SEO et partage
  metadata: {
    ogImage: '/images/feu-humain-og.jpg',
    twitterCard: 'summary_large_image',
    author: 'Archive FEU HUMAIN',
    keywords: ['archive', 'conversation', 'messenger', 'feu humain', 'art numérique'],
    robots: 'noindex, nofollow', // Protection de la vie privée
  },

  // Messages personnalisés
  messages: {
    loading: "Chargement de l'archive...",
    error: 'Impossible de charger la conversation',
    noResults: 'Aucun résultat trouvé',
    endOfArchive: "Fin de l'archive",
    loadingMore: 'Chargement de plus de messages...',
  },

  // Animations et effets
  animations: {
    messageEntrance: 'fadeIn',
    headerPulse: true,
    timelineDot: 'pulse',
    hoverEffects: true,
    smoothScroll: true,
    parallax: false, // Désactivé pour les performances
  },

  // Performance
  performance: {
    lazyLoadImages: true,
    debounceSearch: 300, // ms
    cacheResults: true,
    preloadNextBatch: true,
    optimizeForMobile: true,
  },

  // Sécurité et confidentialité
  privacy: {
    blurFaces: false, // Flouter les visages dans les photos
    anonymizeNames: false, // Remplacer les noms par des pseudos
    hidePhoneNumbers: true, // Masquer les numéros de téléphone
    hideEmails: true, // Masquer les emails
    watermark: false, // Ajouter un filigrane aux médias
  },

  // Accessibilité
  accessibility: {
    highContrast: false,
    fontSize: 'normal', // 'small', 'normal', 'large', 'xlarge'
    reducedMotion: false,
    screenReaderSupport: true,
    keyboardNavigation: true,
  },

  // Fonctionnalités expérimentales
  experimental: {
    sentimentAnalysis: false, // Analyse des sentiments
    wordCloud: false, // Nuage de mots
    timelineVisualization: false, // Visualisation chronologique avancée
    aiSummary: false, // Résumé généré par IA
    musicPlayer: false, // Lecteur de musique d'ambiance
    threeDEffects: false, // Effets 3D
  },
}

// Fonction pour obtenir la configuration avec les valeurs par défaut
export function getConfig(customConfig?: Partial<typeof archiveConfig>) {
  return {
    ...archiveConfig,
    ...customConfig,
  }
}

// Hooks pour accéder à la configuration dans les composants
export function useArchiveConfig() {
  return archiveConfig
}

// Fonction pour sauvegarder les préférences utilisateur
export function saveUserPreferences(preferences: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('feu-humain-preferences', JSON.stringify(preferences))
  }
}

// Fonction pour charger les préférences utilisateur
export function loadUserPreferences() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('feu-humain-preferences')
    return saved ? JSON.parse(saved) : {}
  }
  return {}
}
