import { Octokit } from '@octokit/rest'

// Configuration GitHub
const REPO_OWNER = process.env.GITHUB_OWNER || 'ajilnex'
const REPO_NAME = process.env.GITHUB_REPO || 'athanor-philosophy-platform'

// Lazy loading du client GitHub
function getOctokit() {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN manquant dans les variables d\'environnement')
  }

  return new Octokit({
    auth: GITHUB_TOKEN,
  })
}

interface GitHubFileUpdate {
  path: string
  content: string
  message: string
  sha?: string // SHA du fichier existant (pour mise à jour)
}

/**
 * Récupère le contenu d'un fichier depuis GitHub
 */
export async function getFileFromGitHub(path: string): Promise<{ content: string; sha: string } | null> {
  try {
    const octokit = getOctokit()
    const response = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path,
    })

    if ('content' in response.data && !Array.isArray(response.data)) {
      return {
        content: Buffer.from(response.data.content, 'base64').toString('utf-8'),
        sha: response.data.sha,
      }
    }
    return null
  } catch (error: any) {
    if (error.status === 404) {
      return null // Fichier n'existe pas
    }
    throw error
  }
}

/**
 * Crée ou met à jour un fichier sur GitHub
 */
export async function updateFileOnGitHub(fileUpdate: GitHubFileUpdate): Promise<{ sha: string }> {
  const octokit = getOctokit()
  const content = Buffer.from(fileUpdate.content, 'utf-8').toString('base64')
  
  const params: any = {
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path: fileUpdate.path,
    message: fileUpdate.message,
    content,
  }

  if (fileUpdate.sha) {
    params.sha = fileUpdate.sha
  }

  const response = await octokit.repos.createOrUpdateFileContents(params)
  
  return {
    sha: response.data.content?.sha || '',
  }
}

/**
 * Supprime un fichier sur GitHub
 */
export async function deleteFileOnGitHub(path: string, message: string): Promise<void> {
  const octokit = getOctokit()
  // D'abord récupérer le SHA du fichier
  const file = await getFileFromGitHub(path)
  if (!file) {
    throw new Error(`Fichier non trouvé : ${path}`)
  }

  await octokit.repos.deleteFile({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path,
    message,
    sha: file.sha,
  })
}

/**
 * Génère le contenu MDX d'un billet
 */
export function generateBilletContent(
  title: string,
  date: string,
  tags: string[],
  excerpt: string,
  content: string
): string {
  return `---
title: "${title}"
date: "${date}"
tags: [${tags.map(tag => `"${tag}"`).join(', ')}]
excerpt: "${excerpt}"
---

${content}`
}