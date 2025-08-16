import { prisma } from './prisma'

/**
 * Fichier centralisé pour toutes les requêtes de base de données liées aux Articles.
 * Cela garantit la cohérence des filtres et des tris à travers toute l'application.
 */

/**
 * Récupère tous les articles publiés, triés par date de publication.
 * Destiné aux vues publiques.
 */
export async function getPublishedArticles() {
  return prisma.article.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
  })
}

/**
 * Récupère un résumé optimisé des articles publiés pour l'API.
 * Contient uniquement les champs nécessaires pour les listes.
 */
export async function getPublishedArticlesSummary() {
  return prisma.article.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      author: true,
      fileName: true,
      tags: true,
      publishedAt: true,
      fileSize: true,
    },
  })
}

/**
 * Récupère un seul article publié par son ID.
 * Destiné aux pages de détail publiques.
 * @param id - L'ID de l'article
 */
export async function getPublishedArticleById(id: string) {
  return prisma.article.findFirst({
    where: { id: id, isPublished: true },
  })
}

/**
 * Récupère TOUS les articles, y compris les brouillons, pour l'interface d'administration.
 * Triés par date de création pour voir les plus récents en premier.
 */
export async function getAllArticlesForAdmin() {
  return prisma.article.findMany({
    orderBy: { createdAt: 'desc' },
  })
}
