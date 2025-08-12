export function Footer() {
  return (
    <footer className="bg-background border-t border-subtle mt-16">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center">
          <p className="text-subtle text-sm font-light">
            <a href="mailto:aub.robert@gmail.com" className="hover:text-foreground transition-colors">
              aub.robert@gmail.com
            </a>
          </p>
          <div className="mt-4">
            <a href="/admin" className="text-subtle text-xs hover:text-foreground transition-colors">
              Admin
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}