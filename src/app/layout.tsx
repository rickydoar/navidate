import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Navidate - AI-Powered Date Planning',
  description: 'Plan perfect dates with AI-powered recommendations tailored to your preferences, budget, and location.',
  keywords: ['date planning', 'AI', 'recommendations', 'restaurants', 'activities'],
  authors: [{ name: 'Navidate Team' }],
  creator: 'Navidate',
  publisher: 'Navidate',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="relative flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
        </div>
      </body>
    </html>
  )
} 