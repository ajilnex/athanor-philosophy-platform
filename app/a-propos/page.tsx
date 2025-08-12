import Link from "next/link";

export const metadata = {
  title: "À propos — L'athanor",
  description:
    "L'athanor : plateforme d’édition philosophique collaborative. Billets en Markdown/MDX, publications académiques en PDF, et un atelier poésie à venir.",
};

export default function AProposPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <header className="space-y-2">
        <p className="text-xs tracking-widest text-subtle uppercase">L'athanor</p>
        <h1 className="text-3xl font-light">À propos</h1>
        <p className="text-subtle font-light">
          L'athanor est une plateforme d’édition philosophique menée par Aubin Robert. 
          Elle conjugue sobriété académique et expérimentation méthodologique : 
          écrire, annoter, relier — avec l’ambition d’une philosophie vivante.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-light">Ce qu’est L'athanor</h2>
        <ul className="list-disc pl-5 space-y-2 text-foreground/90">
          <li>
            <strong>Billets</strong> : textes courts publiés en <code>.md</code> 
            (et bientôt <code>.mdx</code>) — versionnés, normalisés, synchronisés 
            en base, avec tags et recherche plein-texte.
          </li>
          <li>
            <strong>Publications</strong> : articles académiques au format <code>PDF</code>, 
            présentés comme un corpus accessible et citables.
          </li>
          <li>
            <strong>Liens &amp; hypothèses</strong> : une écriture qui assume les 
            connexions (backlinks <code>[[mot]]</code>, tags générés lorsque c’est utile), 
            et documente les pistes autant que les résultats.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-light">Ce que tu peux faire</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Lire &amp; chercher</strong> : la page{" "}
            <Link href="/search" className="underline">
              recherche
            </Link>{" "}
            interroge les billets (titre, tags, contenu).
          </li>
          <li>
            <strong>Contribuer</strong> (bientôt ouvert) : billets en Markdown,
            propositions d’édition, relectures et enrichissements.
          </li>
          <li>
            <strong>Publier</strong> : lorsque c’est mûr, un texte peut migrer vers
            la section <Link href="/publications" className="underline">publications</Link> (PDF).
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-light">Atelier poésie (à venir)</h2>
        <p className="text-foreground/90">
          Un espace dédié à l’édition de poésie : formes brèves, archives sonores,
          variantes, annotations collectives. L’atelier explorera l’édition en MDX
          (composants interactifs) et l’indexation par motifs.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-light">Choix techniques (brefs)</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Next.js 14, rendu sobre ; Tailwind pour la typographie &amp; la grille.</li>
          <li>Billets : fichiers <code>.md</code> normalisés, synchronisés via Prisma
              vers PostgreSQL (Neon).</li>
          <li>Auth : connexion GitHub (NextAuth) et rôle admin pour la modération.</li>
          <li>Recherche : index local des billets (plein-texte) + tags.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-light">Feuille de route</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Édition <code>MDX</code> : notes flottantes, citations actives, visualisations légères.</li>
          <li>Comptes contributeurs &amp; révision éditoriale.</li>
          <li>API de lecture pour interopérer avec d’autres outils.</li>
          <li>Atelier poésie : interface dédiée &amp; publication en revue.</li>
        </ul>
      </section>

      <footer className="border-t border-subtle pt-6 text-sm text-subtle">
        Contact : voir le pied de page du site. 
        <span className="ml-2">
          Dernière mise à jour éditoriale : {new Date().toLocaleDateString("fr-FR")}
        </span>
      </footer>
    </div>
  );
}
