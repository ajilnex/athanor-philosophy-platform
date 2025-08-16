import fs from 'fs'
import path from 'path'

export async function GraphSVG() {
  try {
    const svgPath = path.join(process.cwd(), 'public', 'graph-billets.svg')

    // Check if SVG file exists
    if (!fs.existsSync(svgPath)) {
      return (
        <div className="w-full h-48 flex items-center justify-center border border-subtle/20 rounded-lg bg-background/50">
          <p className="text-subtle text-sm">Graphe en cours de génération...</p>
        </div>
      )
    }

    // Read SVG content
    const svgContent = fs.readFileSync(svgPath, 'utf8')

    // Remove XML declaration for inline use
    const cleanSvgContent = svgContent.replace(/<\?xml[^>]*\?>/, '')

    // Use dangerouslySetInnerHTML to inject the SVG
    return (
      <div
        className="w-full opacity-100 transition-opacity duration-500"
        style={{ lineHeight: 0 }}
        dangerouslySetInnerHTML={{ __html: cleanSvgContent }}
        aria-label="Constellation des idées du site - Les nœuds principaux sont cliquables"
      />
    )
  } catch (error) {
    console.error('Error loading SVG:', error)
    return (
      <div className="w-full h-48 flex items-center justify-center border border-subtle/20 rounded-lg bg-background/50">
        <p className="text-subtle text-sm">Erreur de chargement du graphe</p>
      </div>
    )
  }
}
