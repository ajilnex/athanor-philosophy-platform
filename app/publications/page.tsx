export default function PublicationsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-light text-foreground mb-4">
          Publications
        </h1>
        <p className="text-base text-subtle font-light">
          Articles et ouvrages publiés dans des revues académiques et éditions spécialisées.
        </p>
      </div>

      <div className="text-center py-12">
        <p className="text-subtle font-light">
          Publications en cours de mise en ligne.
        </p>
      </div>
    </div>
  )
}