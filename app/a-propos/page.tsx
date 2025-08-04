export default function AProposPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-light text-foreground mb-4">
          À propos
        </h1>
      </div>

      <div className="prose max-w-none">
        <p className="text-foreground leading-relaxed mb-6 font-light">
          Aubin Robert est philosophe.
        </p>
        <p className="text-foreground leading-relaxed mb-6 font-light">
          Il travaille sur la logique, la sémiotique, et la phénoménologie de l'enquête. 
          Ce site rassemble ses textes, ses billets de travail et ses références de recherche.
        </p>
        <p className="text-foreground leading-relaxed font-light">
          Contact : <a href="mailto:aub.robert@gmail.com" className="underline hover:text-subtle transition-colors">aub.robert@gmail.com</a>
        </p>
      </div>
    </div>
  )
}