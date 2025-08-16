export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  // Pour l'instant, nous affichons le même message pour tout le monde.
  // À l'avenir, on pourrait récupérer le nom de l'auteur à partir du slug.
  const getAuthorName = (slug: string) => {
    switch (slug) {
      case 'luce-lefebvre-goldmann':
        return 'Luce Lefèbvre-Goldmann'
      default:
        return 'Auteur'
    }
  }

  const { slug } = await params
  const authorName = getAuthorName(slug)

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Image de fond tournée */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/images/luce-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: 'rotate(180deg)',
        }}
      ></div>

      {/* Overlay léger pour améliorer la lisibilité */}
      <div className="absolute inset-0 bg-white/40 z-10"></div>

      <div className="relative z-20 max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="font-serif text-4xl text-gray-800 mb-4 drop-shadow-lg">{authorName}</h1>
        <p className="text-gray-700 text-lg mb-8 drop-shadow">
          Cette page est en cours de création et accueillera bientôt les textes de cette poétesse.
        </p>
        <div className="text-6xl mb-4 drop-shadow-lg">🚧</div>
        <p className="text-gray-600 text-sm drop-shadow">Page en construction</p>
      </div>
    </div>
  )
}
