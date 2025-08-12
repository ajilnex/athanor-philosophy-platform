import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import { getAllBillets } from '@/lib/billets'
import { LatestActivityCard } from '@/components/home/LatestActivityCard'
import { GraphSVG } from '@/components/GraphSVG'

export default async function HomePage() {
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
      const filteredEdges = graphData.edges.filter((edge: any) => 
        nodeIds.has(edge.source) && nodeIds.has(edge.target)
      )
      graphStats = { nodes: filteredNodes.length, edges: filteredEdges.length }
    }
  } catch (error) {
    console.warn('Could not read graph stats:', error)
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 sm:px-6">
      <main className="max-w-4xl w-full -mt-16">
        {/* Graphe collé au header */}
        <section className="w-full mb-1">
          <GraphSVG />
        </section>

        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground mb-4">
          L'athanor
        </h1>

        <p className="text-base sm:text-lg text-subtle font-light">
         Philosopher - Ecrire - Editer
        </p>

        {/* Barre de recherche (compacte et centrée) */}
        <div className="w-full max-w-lg mx-auto mt-6 mb-8">
          <form action="/search" method="GET" className="relative">
            <input
              type="search"
              name="q"
              placeholder="Rechercher..."
              className="search-input w-full p-3 pl-4 pr-10 text-base"
            />
          </form>
        </div>

        {/* Navigation mobile */}
        <nav className="flex flex-col space-y-4 sm:hidden text-foreground font-light">
          <Link href="/billets" className="hover:text-subtle transition-colors py-2">Billets</Link>
          <Link href="/publications" className="hover:text-subtle transition-colors py-2">Publications</Link>
          <Link href="/a-propos" className="hover:text-subtle transition-colors py-2">À propos</Link>
          <Link href="/search" className="hover:text-subtle transition-colors py-2">Recherche</Link>
        </nav>

        {/* Navigation desktop */}
        <nav className="hidden sm:flex space-x-6 lg:space-x-8 text-foreground font-light justify-center">
          <Link href="/billets" className="hover:text-subtle transition-colors">Billets</Link>
          <Link href="/publications" className="hover:text-subtle transition-colors">Publications</Link>
          <Link href="/a-propos" className="hover:text-subtle transition-colors">À propos</Link>
          <Link href="/search" className="hover:text-subtle transition-colors">Recherche</Link>
        </nav>


        {/* Dernière activité */}
        {latestBillet && (
          <div className="mt-16">
            <LatestActivityCard billet={latestBillet} />
          </div>
        )}
      </main>
    </div>
  )
}
