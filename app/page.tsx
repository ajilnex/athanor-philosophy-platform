import Link from 'next/link'
import { BookOpen, Search, FileText, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-accent-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-primary-900 mb-6">
              Athanor
            </h1>
            <p className="text-xl md:text-2xl text-primary-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              Une collection d'articles de philosophie contemporaine explorant les grandes questions 
              de notre époque avec rigueur académique et accessibilité moderne.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/articles" className="btn-primary inline-flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Découvrir les Articles</span>
              </Link>
              <Link href="/search" className="btn-secondary inline-flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Rechercher</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-serif font-semibold text-center text-primary-900 mb-12">
            Une Plateforme Moderne pour la Philosophie
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-primary-700" />
              </div>
              <h3 className="text-xl font-serif font-semibold mb-3">Visualiseur PDF Intégré</h3>
              <p className="text-gray-600">
                Lisez directement les articles dans votre navigateur avec un visualiseur 
                PDF optimisé pour l'expérience de lecture académique.
              </p>
            </div>
            <div className="card text-center">
              <div className="bg-accent-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-accent-700" />
              </div>
              <h3 className="text-xl font-serif font-semibold mb-3">Recherche Avancée</h3>
              <p className="text-gray-600">
                Trouvez rapidement les articles qui vous intéressent grâce à notre 
                système de recherche par titre, auteur, mots-clés et contenu.
              </p>
            </div>
            <div className="card text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary-700" />
              </div>
              <h3 className="text-xl font-serif font-semibold mb-3">Interface Moderne</h3>
              <p className="text-gray-600">
                Une expérience utilisateur contemporaine qui respecte les traditions 
                académiques tout en embrassant la modernité numérique.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-primary-700 to-primary-800">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-serif font-semibold text-white mb-6">
            Explorez l'Univers Philosophique
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Découvrez une collection soigneusement sélectionnée d'articles qui interrogent 
            et éclairent les enjeux fondamentaux de notre existence.
          </p>
          <Link href="/articles" className="bg-white text-primary-700 hover:bg-gray-50 px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
            Commencer la Lecture
          </Link>
        </div>
      </section>
    </div>
  )
}