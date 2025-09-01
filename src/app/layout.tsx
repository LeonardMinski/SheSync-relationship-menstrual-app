import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/context/AppContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SheSync+ | Cycle-Powered Wellbeing & Intimacy',
  description: 'The ultimate cycle-powered wellbeing, connection & intimacy app — for women and their partners.',
  keywords: ['menstrual cycle', 'wellness', 'intimacy', 'relationships', 'women health'],
  authors: [{ name: 'SheSync+ Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AppProvider>
          <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 transition-colors duration-300">
            {children}
          </div>
        </AppProvider>
      </body>
    </html>
  )
}
