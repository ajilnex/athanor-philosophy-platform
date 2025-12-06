import { ImageResponse } from 'next/og'
import { getBilletBySlug } from '@/lib/billets'

export const runtime = 'edge'
export const alt = "L'athanor — Billet"
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { slug: string } }) {
    const billet = await getBilletBySlug(params.slug)

    if (!billet) {
        return new ImageResponse(
            (
                <div style={{
                    background: 'linear-gradient(135deg, #002b36 0%, #073642 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Georgia, serif',
                }}>
                    <div style={{ color: '#fdf6e3', fontSize: 48 }}>L'athanor</div>
                </div>
            ),
            { ...size }
        )
    }

    // Clean excerpt - remove markdown formatting
    const excerpt = (billet.excerpt || billet.content.slice(0, 200))
        .replace(/[#*_\[\]`]/g, '')
        .replace(/\n+/g, ' ')
        .trim()
        .slice(0, 150) + '...'

    // Format date
    const date = new Date(billet.date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })

    return new ImageResponse(
        (
            <div
                style={{
                    background: '#fdf6e3',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '60px',
                    fontFamily: 'Georgia, serif',
                }}
            >
                {/* Header with logo area */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
                    {/* Logo circle */}
                    <div
                        style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: '#2aa198',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '20px',
                        }}
                    >
                        <div style={{ color: '#fdf6e3', fontSize: '24px', fontWeight: 'bold' }}>A</div>
                    </div>
                    <div style={{ color: '#586e75', fontSize: '28px' }}>L'athanor</div>
                </div>

                {/* Title */}
                <div
                    style={{
                        color: '#002b36',
                        fontSize: '52px',
                        fontWeight: '400',
                        lineHeight: 1.2,
                        marginBottom: '24px',
                        maxWidth: '1000px',
                    }}
                >
                    {billet.title}
                </div>

                {/* Excerpt */}
                <div
                    style={{
                        color: '#586e75',
                        fontSize: '24px',
                        lineHeight: 1.5,
                        marginBottom: '40px',
                        maxWidth: '900px',
                    }}
                >
                    {excerpt}
                </div>

                {/* Footer with date and tags */}
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ color: '#93a1a1', fontSize: '20px' }}>{date}</div>
                    {billet.tags && billet.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {billet.tags.slice(0, 3).map((tag, i) => (
                                <div
                                    key={i}
                                    style={{
                                        background: '#eee8d5',
                                        color: '#586e75',
                                        padding: '6px 14px',
                                        borderRadius: '6px',
                                        fontSize: '16px',
                                    }}
                                >
                                    {tag}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bottom accent line */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '8px',
                        background: 'linear-gradient(90deg, #2aa198, #268bd2)',
                    }}
                />
            </div>
        ),
        { ...size }
    )
}
