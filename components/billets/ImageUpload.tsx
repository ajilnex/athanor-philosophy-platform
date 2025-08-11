'use client'

import { useState, useRef } from 'react'
import { Upload, Image as ImageIcon, X, Check } from 'lucide-react'

interface ImageUploadProps {
  onImageUploaded?: (url: string) => void
  className?: string
}

export function ImageUpload({ onImageUploaded, className = "" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validation simple
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image valide')
      return
    }

    if (file.size > 20 * 1024 * 1024) { // 20MB max (Cloudinary s'occupe de l'optimisation)
      setError('Image trop volumineuse (max 20MB)')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload')
      }

      const result = await response.json()
      setUploadedUrl(result.url)
      onImageUploaded?.(result.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsUploading(false)
    }
  }

  const resetUpload = () => {
    setUploadedUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (uploadedUrl) {
    return (
      <div className={`p-4 border border-green-200 rounded-lg bg-green-50 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-green-700">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">Image uploadée !</span>
          </div>
          <button
            onClick={resetUpload}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mb-2">
          <img 
            src={uploadedUrl} 
            alt="Image uploadée"
            className="max-w-full h-auto max-h-48 rounded border"
          />
        </div>
        <div className="text-xs text-gray-600 bg-white p-2 rounded border font-mono">
          {uploadedUrl}
        </div>
      </div>
    )
  }

  return (
    <div className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {error && (
        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col items-center space-y-2">
        <ImageIcon className="h-8 w-8 text-gray-400" />
        <div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="h-4 w-4" />
            <span>{isUploading ? 'Upload...' : 'Choisir une image'}</span>
          </button>
        </div>
        <p className="text-xs text-gray-500">
          JPG, PNG, GIF jusqu'à 20MB (optimisation Cloudinary)
        </p>
      </div>
    </div>
  )
}