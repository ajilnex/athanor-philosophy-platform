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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
      <h1 className="font-serif text-4xl text-foreground mb-4">
        {authorName}
      </h1>
      <p className="text-subtle text-lg mb-8">
        Cette page est en cours de création et accueillera bientôt les textes de cette poétesse.
      </p>
      <div className="text-6xl mb-4">🚧</div>
      <p className="text-subtle/60 text-sm">
        Page en construction
      </p>
    </div>
  )
}