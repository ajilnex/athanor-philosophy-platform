/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)

        // ?title=<title>
        const hasTitle = searchParams.has('title')
        const title = hasTitle
            ? searchParams.get('title')?.slice(0, 100)
            : "L'athanor — Plateforme philosophique"

        // ?date=<date>
        const date = searchParams.get('date')

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#fdf6e3', // Solarized Base3 (Cream)
                        backgroundImage: 'radial-gradient(circle at 25px 25px, #eee8d5 2%, transparent 0%), radial-gradient(circle at 75px 75px, #eee8d5 2%, transparent 0%)',
                        backgroundSize: '100px 100px',
                        fontFamily: 'serif',
                    }}
                >
                    {/* Cadre décoratif */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 20,
                            left: 20,
                            right: 20,
                            bottom: 20,
                            border: '2px solid rgba(181, 137, 0, 0.2)', // Yellow subtle
                            borderRadius: 12,
                        }}
                    />

                    {/* Logo / Nom du site */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 40,
                            color: '#2aa198', // Cyan
                            fontSize: 24,
                            fontWeight: 600,
                            letterSpacing: 2,
                            textTransform: 'uppercase',
                        }}
                    >
                        L'athanor
                    </div>

                    {/* Titre */}
                    <div
                        style={{
                            display: 'flex',
                            textAlign: 'center',
                            fontSize: 60,
                            fontStyle: 'normal',
                            fontWeight: 'bold',
                            color: '#073642', // Base02 (Dark)
                            lineHeight: 1.1,
                            padding: '0 60px',
                            maxWidth: 1000,
                            textWrap: 'balance',
                        }}
                    >
                        {title}
                    </div>

                    {/* Date (optionnel) */}
                    {date && (
                        <div
                            style={{
                                marginTop: 30,
                                fontSize: 24,
                                color: '#93a1a1', // Base1
                            }}
                        >
                            {new Date(date).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </div>
                    )}
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        )
    } catch (e: any) {
        console.log(`${e.message}`)
        return new Response(`Failed to generate the image`, {
            status: 500,
        })
    }
}
