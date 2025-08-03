export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} Athanor - Plateforme Philosophique
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Une collection d'articles de philosophie contemporaine
          </p>
        </div>
      </div>
    </footer>
  )
}