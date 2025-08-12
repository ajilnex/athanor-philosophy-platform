import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))', // Fond principal
        foreground: 'hsl(var(--foreground))', // Texte principal
        subtle: 'hsl(var(--subtle))',         // Texte secondaire, bordures
        accent: 'hsl(var(--accent))',         // Couleur d'accentuation (liens, focus)
        destructive: 'hsl(var(--destructive))', // Couleur d'erreur/danger
        success: 'hsl(var(--success))',       // Couleur de succès
        muted: 'hsl(var(--muted))',          // Arrière-plans neutres
        transparent: 'transparent',
        white: '#ffffff',
        black: '#000000',
      },
      fontFamily: {
        serif: ['IBM Plex Serif', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'aurore-gradient': 'radial-gradient(120% 120% at 50% 0%, hsl(var(--background)) 50%, hsl(var(--accent) / 0.1))',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#334155',
            lineHeight: '1.7',
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
export default config