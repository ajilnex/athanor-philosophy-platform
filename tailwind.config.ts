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
        // Semantic colors (from CSS variables)
        background: 'var(--background)',
        'background-elevated': 'var(--background-elevated)',
        foreground: 'var(--foreground)',
        subtle: 'var(--subtle)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        destructive: 'var(--destructive)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        muted: 'var(--muted)',

        // Solarized palette (direct access)
        sol: {
          base03: 'var(--sol-base03)',
          base02: 'var(--sol-base02)',
          base01: 'var(--sol-base01)',
          base00: 'var(--sol-base00)',
          base0: 'var(--sol-base0)',
          base1: 'var(--sol-base1)',
          base2: 'var(--sol-base2)',
          base3: 'var(--sol-base3)',
          yellow: 'var(--sol-yellow)',
          orange: 'var(--sol-orange)',
          red: 'var(--sol-red)',
          magenta: 'var(--sol-magenta)',
          violet: 'var(--sol-violet)',
          blue: 'var(--sol-blue)',
          cyan: 'var(--sol-cyan)',
          green: 'var(--sol-green)',
        },

        transparent: 'transparent',
        white: '#ffffff',
        black: '#000000',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'serif'],
        'ia-writer': ['var(--font-ia-writer)', 'serif'],
      },
      backgroundImage: {
        'aurore-gradient':
          'radial-gradient(120% 120% at 50% 0%, hsl(var(--background)) 50%, hsl(var(--accent) / 0.1))',
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
