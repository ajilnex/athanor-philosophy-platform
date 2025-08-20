import Link from 'next/link'
import Image from 'next/image'
import fs from 'fs'
import path from 'path'
import { getAllBillets } from '@/lib/billets'
import { LatestActivityCard } from '@/components/home/LatestActivityCard'
import { getPublishedClips } from '@/lib/presse-papier'
import { InteractiveGraph } from '@/components/graph/InteractiveGraph'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AddBilletFab } from '@/components/billets/AddBilletFab'

// Refresh home periodically so recent press clips appear online without a full redeploy
export const revalidate = 60

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  const allBillets = await getAllBillets()
  const latestBillet = allBillets.length > 0 ? allBillets[0] : null
  const latestClips = await getPublishedClips(3)

  // Read graph stats for meta info
  let graphStats = { nodes: 0, edges: 0 }
  try {
    const graphPath = path.join(process.cwd(), 'public', 'graph-billets.json')
    if (fs.existsSync(graphPath)) {
      const graphData = JSON.parse(fs.readFileSync(graphPath, 'utf8'))
      // Count filtered nodes (degree >= 1, top 30)
      const filteredNodes = graphData.nodes
        .filter((node: any) => (node.degree || 0) >= 1)
        .slice(0, 30)
      const nodeIds = new Set(filteredNodes.map((n: any) => n.id))
      const filteredEdges = graphData.edges.filter(
        (edge: any) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
      )
      graphStats = { nodes: filteredNodes.length, edges: filteredEdges.length }
    }
  } catch (error) {
    console.warn('Could not read graph stats:', error)
  }
  return (
    <>
      {/* Couche 1: Le Graphe en Arrière-Plan - Constellation intégrée */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <InteractiveGraph className="w-full h-full" interactive={false} />
      </div>

      {/* Couche 2: Le Contenu au Premier Plan */}
      <main
        className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4 sm:px-6"
        data-graph-shield
      >
        <div className="max-w-4xl w-full">
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground mb-8 py-4 px-6 animate-fadeIn">
            L'athanor
          </h1>

          {/* Barre de recherche (compacte et centrée) */}
          <div className="w-full max-w-lg mx-auto mt-6 mb-8" data-graph-shield>
            <form action="/search" method="GET" className="relative">
              <input
                type="search"
                name="q"
                placeholder="Rechercher..."
                className="search-input w-full p-3 pl-4 pr-10 text-base bg-background/70 backdrop-blur-md"
                aria-label="Rechercher dans le site"
              />
            </form>
          </div>

          {/* Maison d'édition */}
          <div className="my-12 text-center" data-graph-shield>
            <Link
              href="/edition"
              className="inline-flex items-center px-6 py-3 bg-slate-900/90 hover:bg-slate-800/95 rounded-lg text-slate-50 transition-all duration-200 font-light border border-slate-700/30 backdrop-blur-sm"
            >
              Maison d'édition
            </Link>
          </div>

          {/* Activité récente */}
          {latestBillet && (
            <div className="mt-16" data-graph-shield>
              <LatestActivityCard billet={latestBillet} />
            </div>
          )}

          {/* Presse-papier */}
          <div className="mt-10" data-graph-shield>
            <div className="w-full max-w-lg mx-auto">
              <h2 className="font-serif text-lg text-subtle mb-3 text-center">Presse-papier</h2>
              <div
                className="block p-4 transition-all duration-300 bg-background/95 backdrop-blur-sm rounded-lg border border-subtle/10"
                data-graph-shield
              >
                {latestClips.length === 0 ? (
                  <p className="text-sm text-subtle text-center">Aucun lien pour l'instant</p>
                ) : (
                  <>
                    {/* Mobile: carrousel horizontal */}
                    <div className="sm:hidden -mx-2 px-2 overflow-x-auto no-scrollbar flex gap-3 snap-x snap-mandatory">
                      {latestClips.map(c => (
                        <a
                          key={c.id}
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-w-[68%] snap-start"
                          aria-label={c.title}
                        >
                          <div className="rounded-lg overflow-hidden border border-subtle/40 bg-background/80 backdrop-blur-sm">
                            {c.image ? (
                              <Image
                                src={c.image}
                                alt={c.title || 'Image de prévisualisation'}
                                width={280}
                                height={96}
                                className="w-full h-24 object-cover"
                                loading="lazy"
                                unoptimized={!c.image.includes('res.cloudinary.com')}
                              />
                            ) : (
                              <div className="w-full h-24 bg-gray-100" />
                            )}
                            <div className="p-2">
                              <div className="text-[11px] text-subtle line-clamp-2">{c.title}</div>
                              <div className="mt-1 text-[10px] text-subtle/80 truncate">
                                {c.siteName || new URL(c.url).hostname}
                              </div>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>

                    {/* ≥ sm: grille compacte */}
                    <div className="hidden sm:grid grid-cols-3 gap-3">
                      {latestClips.map(c => (
                        <a
                          key={c.id}
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-start hover:opacity-90 transition"
                        >
                          {c.image ? (
                            <Image
                              src={c.image}
                              alt={c.title || 'Image de prévisualisation'}
                              width={200}
                              height={80}
                              className="w-full h-20 object-cover rounded"
                              loading="lazy"
                              unoptimized={!c.image.includes('res.cloudinary.com')}
                            />
                          ) : (
                            <div className="w-full h-20 bg-gray-100 rounded" />
                          )}
                          <div className="mt-2 text-[11px] text-subtle line-clamp-2">{c.title}</div>
                          <div className="text-[10px] text-subtle/80 truncate">
                            {c.siteName || new URL(c.url).hostname}
                          </div>
                        </a>
                      ))}
                    </div>
                  </>
                )}
                <div className="mt-3 text-right text-xs underline">
                  <a href="/presse-papier">Voir tout</a>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Admin FAB: Nouveau billet direct en Salle du Temps */}
        {(session?.user as any)?.role === 'ADMIN' && <AddBilletFab />}
      </main>
    </>
  )
}
