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

      <div className="relative z-20 max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl text-gray-800 mb-4 drop-shadow-lg">{authorName}</h1>
        </div>

        {/* Section Non-biographie pour Luce */}
        {slug === 'luce-lefebvre-goldmann' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-xl p-8 mb-8 border border-gray-200/50">
            <h2 className="font-serif text-2xl text-gray-800 mb-6 text-center italic">
              Non-biographie
            </h2>

            <div className="prose prose-lg mx-auto text-gray-700 leading-relaxed">
              <p className="font-light italic text-lg mb-6 text-center">
                « Car mes poèmes parlent de moi-même, et j'espère, par eux même, et car toujours je
                suis extrême, j'extermine aujourd'hui la sempiternelle biographie, pour préférer
                introduire mon diadème. »
              </p>

              <div className="space-y-4 text-base">
                <p>
                  J'ai été proclamée par mon cher Aubin, autour de l'année 2020,
                  <span className="font-medium text-purple-700"> l'Impératrice du Drama</span>.
                </p>

                <p>
                  L'intensité était mon maître mot. Il l'est toujours, d'ailleurs. Mais comme ma
                  couronne, j'ai réussi à les apprivoiser.
                </p>

                <p className="italic">
                  Le reste, et plus encore, vous le trouverez dans mes mots et entre mes lignes,
                  entrelacés comme tous les vaisseaux qui font vivre mon corps.
                </p>

                <p className="text-center font-medium text-purple-800 text-lg">
                  L'écriture est mon exutoire, et j'exulte de partager ce tumulte avec vous.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Message général pour les autres auteurs */}
        {slug !== 'luce-lefebvre-goldmann' && (
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-lg shadow-xl p-8">
            <p className="text-gray-700 text-lg mb-8 drop-shadow">
              Cette page est en cours de création et accueillera bientôt les textes de cet auteur.
            </p>
            <div className="text-6xl mb-4 drop-shadow-lg">🚧</div>
            <p className="text-gray-600 text-sm drop-shadow">Page en construction</p>
          </div>
        )}
      </div>
    </div>
  )
}
