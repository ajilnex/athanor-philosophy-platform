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
  author?: {
    name: string
    email: string
    role: 'ADMIN' | 'USER'
  }
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

/**
 * Crée une nouvelle branche basée sur main
 */
export async function createBranch(branchName: string): Promise<void> {
  const octokit = getOctokit()
  
  // Récupérer le SHA de main
  const mainBranch = await octokit.repos.getBranch({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    branch: 'main'
  })
  
  // Créer la nouvelle branche
  await octokit.git.createRef({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    ref: `refs/heads/${branchName}`,
    sha: mainBranch.data.commit.sha
  })
}

/**
 * Crée une Pull Request
 */
export async function createPullRequest(
  branchName: string,
  title: string,
  body: string
): Promise<{ number: number; html_url: string }> {
  const octokit = getOctokit()
  
  const response = await octokit.pulls.create({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    title,
    head: branchName,
    base: 'main',
    body
  })
  
  return {
    number: response.data.number,
    html_url: response.data.html_url
  }
}

/**
 * Version améliorée de updateFileOnGitHub qui gère les contributions USER vs ADMIN
 */
export async function updateFileWithContribution(fileUpdate: GitHubFileUpdate): Promise<{ 
  sha?: string
  pullRequest?: { number: number; html_url: string }
}> {
  const octokit = getOctokit()
  
  // Si c'est un ADMIN, écrire directement sur main
  if (fileUpdate.author?.role === 'ADMIN') {
    const result = await updateFileOnGitHub(fileUpdate)
    return { sha: result.sha }
  }
  
  // Si c'est un USER, créer une branche et une PR
  if (fileUpdate.author?.role === 'USER') {
    const timestamp = Date.now()
    const branchName = `contribution/${fileUpdate.author.email.split('@')[0]}-${timestamp}`
    
    // Créer la branche
    await createBranch(branchName)
    
    // Créer le fichier sur la branche
    const content = Buffer.from(fileUpdate.content, 'utf-8').toString('base64')
    
    const params: any = {
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: fileUpdate.path,
      message: fileUpdate.message,
      content,
      branch: branchName
    }

    if (fileUpdate.sha) {
      params.sha = fileUpdate.sha
    }

    await octokit.repos.createOrUpdateFileContents(params)
    
    // Créer la Pull Request
    const pullRequest = await createPullRequest(
      branchName,
      `Contribution: ${fileUpdate.path}`,
      `Cette modification a été proposée par ${fileUpdate.author.name} (${fileUpdate.author.email}).\n\n**Message de commit :**\n${fileUpdate.message}\n\n---\n🤖 Généré automatiquement par L'athanor`
    )
    
    return { pullRequest }
  }
  
  // Fallback: si pas d'auteur spécifié, comportement par défaut (ADMIN)
  const result = await updateFileOnGitHub(fileUpdate)
  return { sha: result.sha }
}