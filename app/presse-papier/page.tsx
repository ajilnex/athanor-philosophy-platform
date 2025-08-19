import { getPublishedClips } from '@/lib/presse-papier'

export const metadata = {
  title: 'Presse-papier',
  description: "Articles lus par l'équipe — liens et aperçus",
}

// Ensure fresh data online (ISR): page is regenerated periodically
export const revalidate = 60

export default async function PressePapierPage() {
  const clips = await getPublishedClips()
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-light mb-6">Presse-papier</h1>
      <p className="text-subtle font-light mb-8">Sélection d'articles lus récemment.</p>

      {clips.length === 0 ? (
        <div className="card border-subtle text-center py-12">Aucun lien pour l'instant.</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clips.map(c => (
            <a key={c.id} href={c.url} target="_blank" className="block group" data-graph-shield>
              <div className="rounded-lg overflow-hidden border border-subtle/40 bg-background/80 backdrop-blur-sm">
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt="" className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gray-100" />
                )}
                <div className="p-4">
                  <div className="text-xs text-subtle mb-1">
                    {c.siteName || new URL(c.url).hostname}
                  </div>
                  <h3 className="font-light text-foreground group-hover:underline line-clamp-2">
                    {c.title}
                  </h3>
                  {c.description && (
                    <p className="text-sm text-subtle mt-2 line-clamp-2">{c.description}</p>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
