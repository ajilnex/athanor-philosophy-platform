import { NextResponse } from 'next/server'
import { getAllBillets } from '@/lib/billets'

export async function GET() {
  try {
    const billets = await getAllBillets()

    // Format de retour simplifié pour la palette de recherche
    const billetsList = billets.map(billet => ({
      slug: billet.slug,
      title: billet.title,
      date: billet.date,
    }))

    // Tri stable par date descendante (plus récent en premier)
    billetsList.sort((a, b) => (a.date < b.date ? 1 : -1))

    return NextResponse.json(billetsList, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des billets:', error)

    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des billets' },
      { status: 500 }
    )
  }
}
