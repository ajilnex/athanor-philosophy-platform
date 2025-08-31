import { v2 as cloudinary } from 'cloudinary'
import { promises as fs } from 'fs'
import path from 'path'

// Configuration Cloudinary (utilise les variables d'environnement)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  original_filename?: string
  bytes: number
  format: string
}

export interface UploadProgress {
  filename: string
  status: 'uploading' | 'success' | 'error'
  error?: string
  result?: CloudinaryUploadResult
}

/**
 * Upload un fichier vers Cloudinary
 */
export async function uploadToCloudinary(
  filePath: string,
  folder: string = 'feu-humain'
): Promise<CloudinaryUploadResult> {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto', // Auto-détecte le type (image, video, raw)
      use_filename: true,
      unique_filename: false,
    })

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      original_filename: result.original_filename,
      bytes: result.bytes,
      format: result.format,
    }
  } catch (error) {
    console.error('Erreur upload Cloudinary:', error)
    throw new Error(`Échec upload Cloudinary: ${error}`)
  }
}

/**
 * Upload de tous les médias d'un dossier vers Cloudinary
 */
export async function uploadMediaBatch(
  mediaBasePath: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<Record<string, CloudinaryUploadResult>> {
  const results: Record<string, CloudinaryUploadResult> = {}

  // Dossiers de médias à traiter
  const mediaDirs = ['photos', 'videos', 'audio', 'gifs']

  for (const dir of mediaDirs) {
    const dirPath = path.join(mediaBasePath, dir)

    try {
      const files = await fs.readdir(dirPath)

      for (const file of files) {
        if (file.startsWith('.')) continue // Ignorer les fichiers cachés

        const filePath = path.join(dirPath, file)
        const fileName = `${dir}/${file}`

        onProgress?.({ filename: fileName, status: 'uploading' })

        try {
          const result = await uploadToCloudinary(filePath, `feu-humain/${dir}`)
          results[fileName] = result

          onProgress?.({ filename: fileName, status: 'success', result })
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue'
          onProgress?.({ filename: fileName, status: 'error', error: errorMsg })
          console.error(`Erreur upload ${fileName}:`, error)
        }
      }
    } catch (error) {
      console.error(`Erreur lecture dossier ${dir}:`, error)
    }
  }

  return results
}

/**
 * Génère l'URL Cloudinary pour un média donné
 */
export function getCloudinaryUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    secure: true,
    fetch_format: 'auto',
    quality: 'auto',
  })
}

/**
 * Vérifie si Cloudinary est correctement configuré
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}
