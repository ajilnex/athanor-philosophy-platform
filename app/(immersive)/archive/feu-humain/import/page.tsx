'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  ArrowLeft,
  Upload,
  FileJson,
  Terminal,
  AlertCircle,
  CheckCircle,
  Info,
  Plus,
  RefreshCw,
  Database,
  Clock,
  MessageCircle,
  Users,
  Loader2,
} from 'lucide-react'
import { GlassDashboard } from '../components/GlassDashboard'

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
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-[#00f0ff] text-xs animate-pulse">INITIALIZING SYSTEM...</p>
        </div>
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
      setError('INVALID_FILE_FORMAT: JSON_REQUIRED')
      return
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('FILE_SIZE_EXCEEDED: MAX_100MB')
      return
    }

    setSelectedFile(file)
    setError('')
    setSuccess('')
    setStats(null)

    await analyzeFile(file)
  }

  const analyzeFile = async (file: File) => {
    setIsAnalyzing(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('mode', 'analyze')

      const response = await fetch('/api/admin/feu-humain/import', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'ANALYSIS_FAILED')
      }

      const result = await response.json()
      setStats(result)

      if (result.existingArchive) {
        setImportMode('update')
      } else {
        setImportMode('new')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ANALYSIS_ERROR')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleImport = async () => {
    if (!selectedFile || !stats) return

    setIsImporting(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('mode', 'import')
      formData.append('importMode', importMode)

      const response = await fetch('/api/admin/feu-humain/import', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }
        throw new Error(errorData.error || 'IMPORT_FAILED')
      }

      const result = await response.json()
      setSuccess(`IMPORT_SUCCESS: ${result.importedMessages} MESSAGES_PROCESSED`)

      setTimeout(() => {
        router.push('/admin/feu-humain')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'IMPORT_ERROR')
    } finally {
      setIsImporting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <GlassDashboard>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/admin/feu-humain"
            className="inline-flex items-center gap-2 text-white/50 hover:text-[#00f0ff] transition mb-8 font-mono text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            RETURN_TO_ARCHIVE
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-[#00f0ff]/10 rounded-lg border border-[#00f0ff]/20">
              <Terminal className="w-8 h-8 text-[#00f0ff]" />
            </div>
            <div>
              <h1 className="text-2xl font-mono tracking-wider text-white">SYSTEM IMPORT</h1>
              <p className="text-xs font-mono text-[#00f0ff]/60 mt-1">
                SECURE_DATA_INGESTION_PROTOCOL
              </p>
            </div>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="glass-panel p-8 rounded-lg mb-8 relative group">
          {/* Tech Corners */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00f0ff]/50" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00f0ff]/50" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00f0ff]/50" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00f0ff]/50" />

          {!selectedFile && (
            <div className="mb-6 p-4 bg-[#00f0ff]/5 border border-[#00f0ff]/10 rounded">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-[#00f0ff] mt-0.5" />
                <div className="text-xs font-mono text-white/70 space-y-2">
                  <p className="text-[#00f0ff]">INSTRUCTION_SET:</p>
                  <ol className="list-decimal list-inside space-y-1 opacity-80">
                    <li>SELECT_SOURCE_FILE (JSON)</li>
                    <li>WAIT_FOR_ANALYSIS</li>
                    <li>EXECUTE_IMPORT_SEQUENCE</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          <div className="border border-dashed border-white/10 rounded bg-black/20 p-12 text-center hover:border-[#00f0ff]/50 transition group-hover:bg-[#00f0ff]/5">
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              disabled={isAnalyzing || isImporting}
            />
            <label htmlFor="file-upload" className="cursor-pointer block w-full h-full">
              {selectedFile ? (
                <div className="space-y-4">
                  <FileJson className="w-12 h-12 text-[#00f0ff] mx-auto animate-pulse" />
                  <div>
                    <p className="text-lg font-mono text-white">{selectedFile.name}</p>
                    <p className="text-xs font-mono text-white/40">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  {isAnalyzing && (
                    <div className="flex items-center justify-center gap-2 text-[#00f0ff] font-mono text-xs">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>ANALYZING_DATA_STRUCTURE...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-white/20 mx-auto mb-4 group-hover:text-[#00f0ff] transition-colors" />
                  <p className="text-sm font-mono text-white/60 mb-2">CLICK_TO_UPLOAD</p>
                  <p className="text-[10px] font-mono text-white/30">
                    ACCEPTED_FORMAT: JSON (MAX 100MB)
                  </p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Analysis Stats */}
        {stats && (
          <div className="glass-panel p-6 rounded-lg mb-8 animate-fadeIn">
            <h2 className="text-sm font-mono text-[#00f0ff] mb-6 flex items-center gap-2 border-b border-white/5 pb-2">
              <Database className="w-4 h-4" />
              DATA_ANALYSIS_REPORT
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="TOTAL_MESSAGES"
                value={stats.totalMessagesInFile}
                icon={MessageCircle}
              />

              {stats.existingArchive && (
                <>
                  <StatCard
                    label="EXISTING_RECORDS"
                    value={stats.existingMessages}
                    icon={CheckCircle}
                    color="text-white/40"
                  />
                  <StatCard
                    label="NEW_RECORDS"
                    value={stats.newMessages}
                    icon={Plus}
                    color="text-[#00f0ff]"
                  />
                </>
              )}

              <StatCard label="PARTICIPANTS" value={stats.participants} icon={Users} />
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-white/40 bg-white/5 p-2 rounded">
              <Clock className="w-3 h-3" />
              <span>
                TIMEFRAME: {formatDate(stats.dateRange.start)} - {formatDate(stats.dateRange.end)}
              </span>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <p className="text-red-500 font-mono text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-[#00f0ff]/10 border border-[#00f0ff]/50 rounded p-4 mb-6 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-[#00f0ff] mt-0.5" />
            <p className="text-[#00f0ff] font-mono text-sm">{success}</p>
          </div>
        )}

        {/* Actions */}
        {stats && stats.newMessages > 0 ? (
          <div className="flex justify-end gap-4">
            <button
              onClick={() => router.push('/admin/feu-humain')}
              className="px-6 py-2 border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition font-mono text-xs rounded-sm"
            >
              ABORT
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="px-6 py-2 bg-[#00f0ff]/10 border border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff]/20 transition font-mono text-xs rounded-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  PROCESSING...
                </>
              ) : (
                <>
                  <Database className="w-3 h-3" />
                  EXECUTE_IMPORT
                </>
              )}
            </button>
          </div>
        ) : !selectedFile ? (
          <div className="text-center py-8 border-t border-white/5">
            <p className="text-xs font-mono text-white/30 animate-pulse">WAITING_FOR_INPUT...</p>
          </div>
        ) : stats && stats.newMessages === 0 ? (
          <div className="text-center py-8 border-t border-white/5">
            <CheckCircle className="w-8 h-8 text-[#00f0ff]/30 mx-auto mb-4" />
            <p className="text-xs font-mono text-white/50">SYSTEM_UP_TO_DATE</p>
          </div>
        ) : null}
      </div>
    </GlassDashboard>
  )
}

function StatCard({ label, value, icon: Icon, color = 'text-white' }: any) {
  return (
    <div className="bg-white/5 border border-white/5 p-4 rounded hover:border-[#00f0ff]/30 transition group">
      <Icon
        className={`w-4 h-4 mb-2 ${color} opacity-50 group-hover:opacity-100 transition-opacity`}
      />
      <div className={`text-xl font-light ${color} font-mono`}>{value.toLocaleString()}</div>
      <div className="text-[10px] text-white/30 font-mono mt-1">{label}</div>
    </div>
  )
}
