import type { Metadata } from 'next'
import Link from 'next/link'
import { Dodecahedron, Icosahedron, Tetrahedron, Hexahedron, Octahedron } from '@/components/ui/PlatonicIcons'

export const metadata: Metadata = {
    title: 'Jeux | Athanor',
    description: 'Section ludique de la plateforme Athanor',
}

export default function JeuxPage() {
    return (
        <div className="min-h-screen bg-[var(--sol-base3)]">
            {/* Header */}
            <header className="border-b-2 border-[var(--sol-base02)] bg-[var(--sol-base3)]">
                <div className="max-w-4xl mx-auto px-6 py-12 text-center">
                    <div className="flex justify-center gap-2 mb-4">
                        <Tetrahedron className="w-6 h-6 text-[var(--sol-magenta)]" />
                        <Hexahedron className="w-6 h-6 text-[var(--sol-blue)]" />
                        <Octahedron className="w-6 h-6 text-[var(--sol-green)]" />
                        <Dodecahedron className="w-6 h-6 text-[var(--sol-orange)]" />
                        <Icosahedron className="w-6 h-6 text-[var(--sol-cyan)]" />
                    </div>
                    <h1 className="text-3xl font-serif font-semibold text-[var(--sol-base02)] tracking-tight">
                        Ludothèque
                    </h1>
                    <p className="text-sm font-mono text-[var(--sol-base01)] uppercase tracking-widest mt-2">
                        Διαγωνία · Jeux de l&apos;esprit
                    </p>
                </div>
            </header>

            {/* Games Grid */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Naupēgia - Bataille Navale */}
                    <Link
                        href="/jeux/naupegia"
                        className="group border-2 border-[var(--sol-base02)] bg-[var(--sol-base3)] hover:bg-[var(--sol-base2)] transition-colors"
                    >
                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <Icosahedron className="w-8 h-8 text-[var(--sol-cyan)] group-hover:scale-110 transition-transform" />
                                <div>
                                    <h2 className="text-xl font-serif font-semibold text-[var(--sol-base02)]">
                                        Naupēgia
                                    </h2>
                                    <p className="text-xs font-mono text-[var(--sol-base01)] uppercase tracking-wider">
                                        ναυπηγία · bataille navale
                                    </p>
                                </div>
                            </div>
                            <p className="text-[var(--sol-base01)] font-serif leading-relaxed">
                                Affrontez un autre membre d&apos;Athanor dans une bataille de constellations platoniciennes sur les eaux numériques.
                            </p>
                            <div className="mt-6 flex items-center gap-2 text-xs font-mono text-[var(--sol-base1)] uppercase">
                                <span className="px-2 py-1 border border-[var(--sol-base1)]">2 joueurs</span>
                                <span className="px-2 py-1 border border-[var(--sol-base1)]">tour par tour</span>
                            </div>
                        </div>
                    </Link>

                    {/* Coming Soon Placeholder */}
                    <div className="border-2 border-dashed border-[var(--sol-base1)] bg-[var(--sol-base2)]/30">
                        <div className="p-8 text-center">
                            <Dodecahedron className="w-8 h-8 text-[var(--sol-base1)] mx-auto mb-4" />
                            <p className="text-[var(--sol-base1)] font-mono text-sm uppercase tracking-wider">
                                D&apos;autres jeux à venir...
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t-2 border-[var(--sol-base02)] mt-16 py-6">
                <p className="text-center text-xs font-mono text-[var(--sol-base1)] uppercase tracking-widest">
                    Ludothèque · Athanor
                </p>
            </footer>
        </div>
    )
}
