import localFont from 'next/font/local'

export const iaWriterDuo = localFont({
  src: [
    {
      path: '../../public/fonts/iAWriterDuoS-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/iAWriterDuoS-Italic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../../public/fonts/iAWriterDuoS-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/iAWriterDuoS-BoldItalic.woff2',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: '--font-ia-writer',
  display: 'swap',
})
