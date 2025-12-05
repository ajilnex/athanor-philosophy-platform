import { redirect } from 'next/navigation'

// Page publique Archive - redirige vers l'archive principale
export default function ArchivePage() {
    // Rediriger vers l'archive feu-humain dans le groupe immersive
    redirect('/archive/feu-humain')
}
