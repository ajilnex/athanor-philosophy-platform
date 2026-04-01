import Link from 'next/link'

export const metadata = {
  title: "À propos — L'athanor",
  description:
    "L'athanor : plateforme d'édition philosophique. Billets en MDX, publications académiques, graphe de connaissances et archives conversationnelles.",
}

export default function AProposPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <header className="space-y-2">
        <p className="text-xs tracking-widest text-subtle uppercase">L'athanor</p>
        <h1 className="text-3xl font-light">À propos</h1>
        <p className="text-subtle font-light">
          L'athanor est une plateforme d'édition philosophique menée par Aubin Robert. Elle conjugue
          sobriété académique et expérimentation méthodologique : écrire, annoter, relier — avec
          l'ambition d'une philosophie vivante.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-light">Ce qu'est L'athanor</h2>
        <ul className="list-disc pl-5 space-y-2 text-foreground/90">
          <li>
            <strong>Billets</strong> : textes courts en <code>MDX</code> — versionnés par Git,
            enrichis de backlinks <code>[[mot]]</code>, citations Zotero et composants interactifs.
          </li>
          <li>
            <strong>Publications</strong> : articles académiques au format <code>PDF</code>,
            hébergés sur Cloudinary, indexés en plein texte et citables.
          </li>
          <li>
            <strong>Constellation</strong> : un{' '}
            <Link href="/constellation" className="underline">
              graphe de force
            </Link>{' '}
            qui relie billets, tags et auteurs — les connexions se dessinent d'elles-mêmes au fil de
            l'écriture.
          </li>
          <li>
            <strong>Le Mur</strong> : un{' '}
            <Link href="/mur" className="underline">
              espace social
            </Link>{' '}
            pour poster des réflexions courtes, des images et réagir avec les solides platoniques.
          </li>
          <li>
            <strong>Archives</strong> : conservation d'archives conversationnelles avec extraction
            OCR, timeline et galerie de médias.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-light">Ce que tu peux faire</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Lire &amp; chercher</strong> : la{' '}
            <Link href="/search" className="underline">
              recherche
            </Link>{' '}
            interroge billets et publications (titre, contenu, tags).
          </li>
          <li>
            <strong>Explorer</strong> : naviguer dans le{' '}
            <Link href="/constellation" className="underline">
              graphe
            </Link>{' '}
            pour découvrir les connexions entre les idées.
          </li>
          <li>
            <strong>Contribuer</strong> : créer un compte pour publier sur le Mur, commenter les
            billets et proposer des textes.
          </li>
          <li>
            <strong>Publier</strong> : lorsque c'est mûr, un texte peut migrer vers les{' '}
            <Link href="/publications" className="underline">
              publications
            </Link>{' '}
            (PDF).
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-light">Bibliographie &amp; citations</h2>
        <p className="text-foreground/90">
          L'athanor est relié à un groupe Zotero partagé. Chaque billet peut citer des références
          avec <code>&lt;Cite item=&quot;Clé&quot; /&gt;</code> — les citations sont validées au
          build, et la bibliographie complète est consultable depuis les{' '}
          <Link href="/refs/Adorno1984" className="underline">
            fiches de référence
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-light">Choix techniques</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Next.js, TypeScript strict, Tailwind CSS — palette Solarized.</li>
          <li>
            Billets en <code>.mdx</code>, versionnés par Git (Git-as-CMS).
          </li>
          <li>PostgreSQL (Neon) via Prisma, auth NextAuth (GitHub + credentials).</li>
          <li>Recherche hybride Fuse.js + Lunr, graphe D3-force, PDFs sur Cloudinary.</li>
        </ul>
      </section>

      <footer className="border-t border-subtle pt-6 text-sm text-subtle">
        Contact :{' '}
        <a href="mailto:aub.robert@gmail.com" className="underline hover:text-foreground">
          aub.robert@gmail.com
        </a>
      </footer>
    </div>
  )
}
