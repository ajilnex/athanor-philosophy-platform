import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import { getAllBillets } from '@/lib/billets'
import { LatestActivityCard } from '@/components/home/LatestActivityCard'
import { InteractiveGraph } from '@/components/graph/InteractiveGraph'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AddBilletFab } from '@/components/billets/AddBilletFab'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  const allBillets = await getAllBillets()
  const latestBillet = allBillets.length > 0 ? allBillets[0] : null

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
              className="inline-flex items-center px-6 py-3 rounded-lg transition-all duration-200 font-light backdrop-blur-sm hover:scale-[1.02] active:scale-95"
              style={{
                backgroundColor: 'var(--sol-base03)',
                color: 'var(--sol-base2)',
                border: '1px solid var(--sol-base01)',
              }}
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
        </div>
        {/* Admin FAB: Nouveau billet direct en Salle du Temps */}
        {(session?.user as any)?.role === 'ADMIN' && <AddBilletFab />}
      </main>
    </>
  )
}
