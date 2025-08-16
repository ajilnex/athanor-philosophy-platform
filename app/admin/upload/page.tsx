'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, Upload, FileText, Plus, X } from 'lucide-react'

export default function UploadPage() {
  const { data: session, status } = useSession()
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: '',
    tags: '',
    category: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  // 🛡️ PROTECTION: Vérifier l'autorisation admin
  useEffect(() => {
    if (status === 'loading') return // Attendre le chargement

    if (!session || session.user?.role !== 'ADMIN') {
      router.push('/') // Rediriger vers la page d'accueil
    }
  }, [session, status, router])

  // Afficher un loading pendant la vérification
  if (status === 'loading') {
    return <div className="max-w-4xl mx-auto px-6 py-12">Chargement...</div>
  }

  // Ne rien afficher si pas autorisé (la redirection va s'effectuer)
  if (!session || session.user?.role !== 'ADMIN') {
    return null
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Veuillez sélectionner un fichier PDF')
        return
      }
      if (file.size > 50 * 1024 * 1024) {
        // 50MB limit
        setError('Le fichier est trop volumineux (max 50MB)')
        return
      }
      setSelectedFile(file)
      setError('')

      // Auto-fill title from filename if not already set
      if (!formData.title) {
        const fileName = file.name.replace('.pdf', '')
        setFormData(prev => ({ ...prev, title: fileName }))
      }
    }
  }

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedFile) {
      setError('Veuillez sélectionner un fichier PDF')
      return
    }

    if (!formData.title.trim()) {
      setError('Le titre est requis')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', selectedFile)
      uploadFormData.append('title', formData.title.trim())
      uploadFormData.append('description', formData.description.trim())
      uploadFormData.append('author', formData.author.trim())
      uploadFormData.append('category', formData.category.trim())

      // Convert tags string to array for the server action
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
      uploadFormData.append('tags', JSON.stringify(tagsArray))

      // Call server action directly
      const { uploadArticle } = await import('@/app/admin/actions')
      const result = await uploadArticle(uploadFormData)

      if (result && !result.success) {
        setError(result.error || "Erreur lors de l'upload")
      } else {
        setSuccess('Publication ajoutée avec succès!')
        // Redirect to publications page after success
        setTimeout(() => {
          router.push('/publications')
        }, 1500)
      }
    } catch (error) {
      setError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center text-subtle hover:text-foreground mb-6 font-light"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à l'administration
        </Link>

        <h1 className="text-2xl sm:text-3xl font-light text-foreground mb-4">
          Ajouter une Publication
        </h1>
        <p className="text-sm sm:text-base text-subtle font-light">
          Uploadez un nouveau fichier PDF et renseignez ses métadonnées.
        </p>
      </div>

      <div className="card border-subtle">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Fichier PDF *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-primary-400 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {selectedFile ? (
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="h-8 w-8 text-primary-600" />
                    <div>
                      <p className="text-sm sm:text-lg font-medium text-gray-900">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs sm:text-sm text-subtle">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm sm:text-lg font-medium text-gray-900 mb-2">
                      Cliquez pour sélectionner un fichier PDF
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">Taille maximale: 50MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-xs sm:text-sm font-medium text-gray-700 mb-2"
            >
              Titre *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="input-field"
              placeholder="Titre de l'article"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-xs sm:text-sm font-medium text-gray-700 mb-2"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="input-field resize-none"
              placeholder="Description courte de l'article..."
            />
          </div>

          {/* Author */}
          <div>
            <label
              htmlFor="author"
              className="block text-xs sm:text-sm font-medium text-gray-700 mb-2"
            >
              Auteur
            </label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleInputChange}
              className="input-field"
              placeholder="Nom de l'auteur"
            />
          </div>

          {/* Tags */}
          <div>
            <label
              htmlFor="tags"
              className="block text-xs sm:text-sm font-medium text-gray-700 mb-2"
            >
              Mots-clés
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="input-field"
              placeholder="philosophie, éthique, métaphysique (séparés par des virgules)"
            />
            <p className="text-xs sm:text-xs text-gray-500 mt-1">
              Séparez les mots-clés par des virgules
            </p>
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-xs sm:text-sm font-medium text-gray-700 mb-2"
            >
              Catégorie
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="input-field"
            >
              <option value="">Sélectionner une catégorie</option>
              <option value="Philosophie de l'esprit">Philosophie de l'esprit</option>
              <option value="Éthique">Éthique</option>
              <option value="Métaphysique">Métaphysique</option>
              <option value="Épistémologie">Épistémologie</option>
              <option value="Philosophie politique">Philosophie politique</option>
              <option value="Esthétique">Esthétique</option>
              <option value="Philosophie des sciences">Philosophie des sciences</option>
              <option value="Histoire de la philosophie">Histoire de la philosophie</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <Link href="/admin" className="btn-secondary">
              Annuler
            </Link>
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Upload en cours...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Ajouter la Publication</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
