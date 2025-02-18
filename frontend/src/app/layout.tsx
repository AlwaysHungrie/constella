import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/app/providers'

export const metadata: Metadata = {
  title: 'Constella One',
  description: 'Autonomy and sentience mission to Earth',
  icons: {
    icon: '/one.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={'antialiased'}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
