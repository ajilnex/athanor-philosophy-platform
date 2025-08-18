import localFont from 'next/font/local'

export const iaWriterDuo = localFont({
  src: [
    {
      path: '../../public/fonts/ia-writer/iAWriterDuoV.ttf',
      weight: '100 900',
      style: 'normal',
    },
    {
      path: '../../public/fonts/ia-writer/iAWriterDuoV-Italic.ttf',
      weight: '100 900',
      style: 'italic',
    },
  ],
  variable: '--font-ia-writer',
  display: 'swap',
})
