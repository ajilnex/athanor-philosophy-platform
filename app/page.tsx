import Link from 'next/link'
import { BookOpen, Search, User, FileText } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-primary-900 mb-6">
              🏛️ Athanor
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Une collection d'articles de philosophie contemporaine, 
              explorant les questions fondamentales de notre époque
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/articles"
                className="btn-primary text-lg px-8 py-4 inline-flex items-center space-x-2"
              >
                <BookOpen className="h-5 w-5" />
                <span>Explorer les Articles</span>
              </Link>
              <Link
                href="/search"
                className="btn-secondary text-lg px-8 py-4 inline-flex items-center space-x-2"
              >
                <Search className="h-5 w-5" />
                <span>Rechercher</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-primary-900 mb-4">
              Une Plateforme Moderne pour la Philosophie
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Découvrez, lisez et explorez des textes philosophiques dans un environnement numérique optimisé
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 card hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="h-8 w-8 text-primary-700" />
              </div>
              <h3 className="text-xl font-semibold text-primary-900 mb-4">
                Lecture PDF Intégrée
              </h3>
              <p className="text-gray-600">
                Lisez les articles directement dans votre navigateur avec notre visualiseur PDF optimisé
              </p>
            </div>
            
            <div className="text-center p-8 card hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-8 w-8 text-primary-700" />
              </div>
              <h3 className="text-xl font-semibold text-primary-900 mb-4">
                Recherche Intelligente
              </h3>
              <p className="text-gray-600">
                Trouvez rapidement les sujets qui vous intéressent grâce à notre moteur de recherche avancé
              </p>
            </div>
            
            <div className="text-center p-8 card hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="h-8 w-8 text-primary-700" />
              </div>
              <h3 className="text-xl font-semibold text-primary-900 mb-4">
                Interface Intuitive
              </h3>
              <p className="text-gray-600">
                Une expérience utilisateur pensée pour la lecture et l'exploration philosophique
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-serif font-bold text-primary-900 mb-4">
            Commencez Votre Exploration
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Plongez dans notre collection d'articles et découvrez de nouvelles perspectives philosophiques
          </p>
          <Link
            href="/articles"
            className="btn-primary text-lg px-8 py-4 inline-flex items-center space-x-2"
          >
            <BookOpen className="h-5 w-5" />
            <span>Voir Tous les Articles</span>
          </Link>
        </div>
      </div>
    </div>
  )
}