import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    default: 'Mascot Chinese Cuisine — Authentic Chinese Food in Mascot, Sydney',
    template: '%s | Mascot Chinese Cuisine',
  },
  description:
    'Order authentic Northeastern Chinese dishes online for pickup or delivery. Noodles, seafood, rice bowls, soups, and classic Chinese cuisine in Mascot, NSW 2020.',
  keywords: [
    'Chinese restaurant Mascot',
    'Chinese food delivery Sydney',
    'Northeastern Chinese cuisine',
    'online ordering Chinese food',
    'Mascot NSW restaurant',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://mascotchinese.com.au',
    siteName: 'Mascot Chinese Cuisine',
    title: 'Mascot Chinese Cuisine — Authentic Chinese Food in Mascot',
    description:
      'Order authentic Northeastern Chinese dishes online for pickup or delivery in Mascot, NSW.',
    // TODO: Add og:image when restaurant provides brand imagery
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-AU" className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-restaurant-bg font-sans antialiased" style={{ backgroundColor: '#FFF8F0' }}>
        <Providers>
          <main className="flex-1" id="main-content">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
