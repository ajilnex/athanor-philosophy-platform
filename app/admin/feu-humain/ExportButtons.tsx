'use client'

import React, { useState, useCallback } from 'react'
import { Download, FileText, FileImage, Share2, Printer, Copy, Check, Loader } from 'lucide-react'

interface Message {
  sender_name: string
  timestamp_ms: number
  content?: string
  photos?: Array<{ uri: string }>
  videos?: Array<{ uri: string }>
  reactions?: Array<{ reaction: string; actor: string }>
}

interface ExportButtonsProps {
  messages: Message[]
  title: string
  participants: Array<{ name: string }>
}

export default function ExportButtons({ messages, title, participants }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const exportAsText = useCallback(() => {
    const text = messages
      .map(msg => {
        const date = new Date(msg.timestamp_ms).toLocaleString('fr-FR')
        let content = `[${date}] ${msg.sender_name}: ${msg.content || '[Média]'}`

        if (msg.reactions && msg.reactions.length > 0) {
          const reactions = msg.reactions.map(r => r.reaction).join(' ')
          content += ` (${reactions})`
        }

        return content
      })
      .join('\n\n')

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '_')}_archive.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [messages, title])

  const exportAsJSON = useCallback(() => {
    const data = {
      title,
      participants: participants.map(p => p.name),
      exportDate: new Date().toISOString(),
      messageCount: messages.length,
      messages: messages.map(msg => ({
        sender: msg.sender_name,
        timestamp: msg.timestamp_ms,
        date: new Date(msg.timestamp_ms).toISOString(),
        content: msg.content,
        hasPhotos: msg.photos ? msg.photos.length : 0,
        hasVideos: msg.videos ? msg.videos.length : 0,
        reactions: msg.reactions?.map(r => ({
          emoji: r.reaction,
          by: r.actor,
        })),
      })),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '_')}_export.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [messages, title, participants])

  const copyShareLink = useCallback(() => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])

  const printConversation = useCallback(() => {
    window.print()
  }, [])

  const handleExport = useCallback(
    async (format: string) => {
      setIsExporting(true)
      setExportFormat(format)

      try {
        switch (format) {
          case 'txt':
            exportAsText()
            break
          case 'json':
            exportAsJSON()
            break
          default:
            console.error('Format non supporté:', format)
        }
      } catch (error) {
        console.error("Erreur lors de l'export:", error)
      } finally {
        setIsExporting(false)
        setExportFormat(null)
      }
    },
    [exportAsText, exportAsJSON]
  )

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleExport('txt')}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition disabled:opacity-50"
        title="Exporter en texte brut"
      >
        {isExporting && exportFormat === 'txt' ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">Texte</span>
      </button>

      <button
        onClick={() => handleExport('json')}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition disabled:opacity-50"
        title="Exporter en JSON"
      >
        {isExporting && exportFormat === 'json' ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">JSON</span>
      </button>

      <div className="w-px bg-gray-700 mx-2" />

      <button
        onClick={copyShareLink}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
        title="Copier le lien"
      >
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        <span className="hidden sm:inline">{copied ? 'Copié!' : 'Copier'}</span>
      </button>

      <button
        onClick={printConversation}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
        title="Imprimer"
      >
        <Printer className="w-4 h-4" />
        <span className="hidden sm:inline">Imprimer</span>
      </button>
    </div>
  )
}
