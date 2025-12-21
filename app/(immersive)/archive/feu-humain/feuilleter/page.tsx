import FeuilleterClient from './client'

export const metadata = {
    title: 'FEUilleter | Archive Feu Humain',
    description: 'Parcourez les extraits de texte des photos de l\'archive Feu l\'Humanité'
}

export default function FeuilleterPage() {
    return <FeuilleterClient archiveSlug="feu-humain" />
}
