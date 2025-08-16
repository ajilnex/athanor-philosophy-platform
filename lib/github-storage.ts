// Simple GitHub-based file storage for PDFs
// Uses GitHub's raw file serving as free CDN

export async function uploadToGitHub(file: File, fileName: string): Promise<string> {
  // For now, return a placeholder URL
  // In production, this would use GitHub API to upload files
  const baseUrl = 'https://raw.githubusercontent.com/ajilnex/athanor/main/public/pdfs'
  const fileUrl = `${baseUrl}/${fileName}`

  console.log('📁 GitHub storage placeholder for:', fileName)
  console.log('🔗 Would be accessible at:', fileUrl)

  return fileUrl
}

export function getGitHubFileUrl(fileName: string): string {
  return `https://raw.githubusercontent.com/ajilnex/athanor/main/public/pdfs/${fileName}`
}
