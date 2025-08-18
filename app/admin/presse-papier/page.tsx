import Link from 'next/link'
import { ArrowLeft, ExternalLink, Eye, EyeOff, Trash2, Plus } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAllClipsAdmin } from '@/lib/presse-papier'
import { actionAddClip, actionDeleteClip, actionToggleClipPublished } from './actions'

export default async function AdminPressePapierPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    redirect('/admin')
  }

  const clips = await getAllClipsAdmin()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center text-subtle hover:text-foreground mb-6 font-light"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour à l'administration
        </Link>

        <h1 className="text-2xl sm:text-3xl font-light text-foreground mb-4">Presse-papier</h1>
        <p className="text-sm sm:text-base text-subtle font-light">
          Ajoutez des articles lus (liens) avec aperçu.
        </p>
      </div>

      <form
        action={async (formData: FormData) => {
          'use server'
          await actionAddClip(formData)
        }}
        method="post"
        className="card border-subtle p-4 sm:p-6 mb-8"
      >
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="flex-1">
            <label className="block text-xs text-subtle mb-1">URL</label>
            <input
              name="url"
              type="url"
              required
              placeholder="https://exemple.com/article"
              className="w-full input"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-subtle mb-1">Note (optionnelle)</label>
            <input
              name="note"
              type="text"
              placeholder="Pourquoi c'est intéressant"
              className="w-full input"
            />
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:opacity-90 transition rounded">
            <Plus className="h-4 w-4" /> Ajouter
          </button>
        </div>
      </form>

      {clips.length === 0 ? (
        <div className="card border-subtle text-center py-12">
          <p className="text-subtle">Aucun lien pour l'instant.</p>
        </div>
      ) : (
        <div className="card border-subtle overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-subtle text-left">
                <th className="py-3 px-2 font-light">Aperçu</th>
                <th className="py-3 px-2 font-light">Titre</th>
                <th className="py-3 px-2 font-light hidden sm:table-cell">Site</th>
                <th className="py-3 px-2 font-light hidden md:table-cell">Date</th>
                <th className="py-3 px-2 font-light text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {clips.map(c => (
                <tr key={c.id} className="align-top">
                  <td className="py-3 px-2">
                    {c.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.image} alt="" className="w-16 h-10 object-cover rounded" />
                    ) : (
                      <div className="w-16 h-10 bg-gray-100 rounded" />
                    )}
                  </td>
                  <td className="py-3 px-2 max-w-[28rem]">
                    <div className="font-light text-foreground line-clamp-2">
                      <a
                        href={c.url}
                        target="_blank"
                        className="underline inline-flex items-center gap-1"
                      >
                        {c.title}
                        <ExternalLink className="h-3 w-3 text-subtle" />
                      </a>
                    </div>
                    {c.note && <p className="text-xs text-subtle mt-1">{c.note}</p>}
                  </td>
                  <td className="py-3 px-2 text-subtle hidden sm:table-cell">
                    {c.siteName || new URL(c.url).hostname}
                  </td>
                  <td className="py-3 px-2 text-subtle hidden md:table-cell">
                    {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 px-2">
                    <form
                      action={async () => {
                        'use server'
                        await actionToggleClipPublished(c.id)
                      }}
                      className="inline"
                    >
                      <button
                        title={c.isPublished ? 'Dépublier' : 'Publier'}
                        className="px-2 py-1 hover:opacity-80"
                      >
                        {c.isPublished ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                    </form>
                    <form
                      action={async () => {
                        'use server'
                        await actionDeleteClip(c.id)
                      }}
                      className="inline"
                    >
                      <button title="Supprimer" className="px-2 py-1 text-red-600 hover:opacity-80">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
