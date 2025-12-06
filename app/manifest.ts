import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "L'athanor",
        short_name: 'Athanor',
        description: 'Plateforme philosophique — Articles et réflexions de philosophie contemporaine',
        start_url: '/',
        display: 'standalone',
        background_color: '#fdf6e3',
        theme_color: '#002b36',
        icons: [
            { src: '/icon.png', sizes: '512x512', type: 'image/png' },
            { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
        ],
    }
}
