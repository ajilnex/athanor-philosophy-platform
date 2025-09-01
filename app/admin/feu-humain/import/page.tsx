'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  ArrowLeft,
  Upload,
  FileJson,
  Flame,
  AlertCircle,
  CheckCircle,
  Info,
  Plus,
  RefreshCw,
  Database,
  Clock,
  MessageCircle,
  Users,
} from 'lucide-react'

interface ImportStats {
  existingArchive: boolean
  totalMessagesInFile: number
  existingMessages: number
  newMessages: number
  participants: number
  dateRange: {
    start: string
    end: string
  }
}

export default function FeuHumainImportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [stats, setStats] = useState<ImportStats | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [importProgress, setImportProgress] = useState(0)
  const [importMode, setImportMode] = useState<'new' | 'update'>('new')

  // Protection admin
  useEffect(() => {
    if (status === 'loading') return
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      router.push('/')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Flame className="w-16 h-16 text-orange-500 animate-pulse" />
      </div>
    )
  }

  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return null
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/json') {
      setError('Veuillez sélectionner un fichier JSON')
      return
    }

    if (file.size > 100 * 1024 * 1024) {
      // 100MB max
      setError('Le fichier est trop volumineux (max 100MB)')
      return
    }

    setSelectedFile(file)
    setError('')
    setSuccess('')
    setStats(null)

    // Analyser le fichier
    await analyzeFile(file)
  }

  const analyzeFile = async (file: File) => {
    setIsAnalyzing(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // Envoyer pour analyse
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mode', 'analyze')

      const response = await fetch('/api/admin/feu-humain/import', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de l'analyse")
      }

      const result = await response.json()
      setStats(result)

      // Déterminer le mode automatiquement
      if (result.existingArchive) {
        setImportMode('update')
      } else {
        setImportMode('new')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'analyse du fichier")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleImport = async () => {
    console.log('handleImport called')
    console.log('selectedFile:', selectedFile)
    console.log('stats:', stats)

    if (!selectedFile || !stats) {
      console.error('Missing file or stats')
      return
    }

    setIsImporting(true)
    setError('')
    setSuccess('')
    setImportProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('mode', 'import')
      formData.append('importMode', importMode)

      console.log('Sending import request...')

      const response = await fetch('/api/admin/feu-humain/import', {
        method: 'POST',
        body: formData,
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Import failed:', errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }
        throw new Error(errorData.error || "Erreur lors de l'import")
      }

      const result = await response.json()
      console.log('Import result:', result)

      setSuccess(`Import réussi ! ${result.importedMessages} messages importés.`)

      // Rediriger vers la vue de l'archive après 2 secondes
      setTimeout(() => {
        router.push('/admin/feu-humain')
      }, 2000)
    } catch (err) {
      console.error('Import error:', err)
      setError(err instanceof Error ? err.message : "Erreur lors de l'import")
    } finally {
      setIsImporting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/feu-humain"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'archive
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <Flame className="w-10 h-10 text-orange-500" />
            <h1 className="text-3xl font-light">Import FEU HUMAIN</h1>
          </div>

          <p className="text-gray-400">
            Importez ou mettez à jour l'archive depuis un export Messenger
          </p>
        </div>

        {/* Zone d'upload */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-800 mb-6">
          {!selectedFile && (
            <div className="mb-4 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                <div className="text-sm text-gray-300">
                  <p className="font-medium text-blue-400 mb-1">
                    Pour créer l'archive FEU HUMAIN :
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-400">
                    <li>Cliquez sur la zone ci-dessous pour sélectionner votre fichier JSON</li>
                    <li>Le système analysera automatiquement le fichier</li>
                    <li>Un bouton d'import apparaîtra avec les statistiques</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-orange-500/50 transition">
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              disabled={isAnalyzing || isImporting}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              {selectedFile ? (
                <div className="space-y-4">
                  <FileJson className="w-16 h-16 text-orange-500 mx-auto" />
                  <div>
                    <p className="text-xl font-light">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  {isAnalyzing && (
                    <div className="flex items-center justify-center gap-2 text-orange-400">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Analyse en cours...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <Upload className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-xl font-light mb-2">
                    Cliquez pour sélectionner un fichier JSON
                  </p>
                  <p className="text-sm text-gray-500">
                    Export Messenger (message_1.json) - Max 100MB
                  </p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Statistiques d'analyse */}
        {stats && (
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-800 mb-6">
            <h2 className="text-xl font-light mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-orange-500" />
              Analyse du fichier
            </h2>

            {/* Mode d'import */}
            <div className="mb-4 p-4 bg-gray-800/50 rounded-lg">
              {stats.existingArchive ? (
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-blue-400 font-medium">Archive existante détectée</p>
                    <p className="text-sm text-gray-400 mt-1">
                      L'archive FEU HUMAIN existe déjà. Les nouveaux messages seront ajoutés et les
                      doublons seront automatiquement ignorés.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <Plus className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <p className="text-green-400 font-medium">Nouvelle archive</p>
                    <p className="text-sm text-gray-400 mt-1">
                      L'archive FEU HUMAIN sera créée avec tous les messages du fichier.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <MessageCircle className="w-5 h-5 text-orange-400 mb-2" />
                <div className="text-2xl font-light">
                  {stats.totalMessagesInFile.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Messages total</div>
              </div>

              {stats.existingArchive && (
                <>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <CheckCircle className="w-5 h-5 text-gray-400 mb-2" />
                    <div className="text-2xl font-light">
                      {stats.existingMessages.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Déjà importés</div>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <Plus className="w-5 h-5 text-green-400 mb-2" />
                    <div className="text-2xl font-light text-green-400">
                      {stats.newMessages.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Nouveaux</div>
                  </div>
                </>
              )}

              <div className="bg-gray-800/50 rounded-lg p-4">
                <Users className="w-5 h-5 text-orange-400 mb-2" />
                <div className="text-2xl font-light">{stats.participants}</div>
                <div className="text-xs text-gray-500">Participants</div>
              </div>
            </div>

            {/* Période */}
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>
                Du {formatDate(stats.dateRange.start)} au {formatDate(stats.dateRange.end)}
              </span>
            </div>
          </div>
        )}

        {/* Messages d'erreur/succès */}
        {error && (
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-900/20 border border-green-600 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <p className="text-green-400">{success}</p>
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        {stats && stats.newMessages > 0 ? (
          <div className="flex justify-end gap-4">
            <button
              onClick={() => router.push('/admin/feu-humain')}
              className="px-6 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition"
            >
              Annuler
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Import en cours...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>
                    {stats.existingArchive
                      ? `Importer ${stats.newMessages} nouveaux messages`
                      : "Créer l'archive et importer"}
                  </span>
                </>
              )}
            </button>
          </div>
        ) : !selectedFile ? (
          <div className="text-center py-8 border-t border-gray-800">
            <Flame className="w-12 h-12 text-orange-500/30 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">Aucun fichier sélectionné</p>
            <p className="text-sm text-gray-500">
              Sélectionnez votre fichier message_1.json pour commencer l'import
            </p>
          </div>
        ) : stats && stats.newMessages === 0 ? (
          <div className="text-center py-8 border-t border-gray-800">
            <CheckCircle className="w-12 h-12 text-green-500/30 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">Tous les messages sont déjà importés</p>
            <p className="text-sm text-gray-500">
              Aucun nouveau message à importer dans ce fichier
            </p>
          </div>
        ) : null}

        {/* Note d'information */}
        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="text-sm text-gray-400">
              <p className="mb-2">
                <strong className="text-blue-400">Import incrémental :</strong> Vous pouvez importer
                plusieurs exports successifs. Le système détecte automatiquement les messages déjà
                présents et n'importe que les nouveaux.
              </p>
              <p>
                <strong className="text-blue-400">Médias :</strong> Les références aux médias sont
                conservées. Pour l'instant, les fichiers doivent être placés manuellement dans le
                dossier public/FEU HUMAIN/.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
