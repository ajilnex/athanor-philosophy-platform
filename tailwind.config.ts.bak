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
        background: '#f8f8f7',
        foreground: '#1c1c1c',
        subtle: '#6b7280',
        transparent: 'transparent',
        white: '#ffffff',
        black: '#000000',
      },
      fontFamily: {
        serif: ['IBM Plex Serif', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
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