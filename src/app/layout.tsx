import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/context/AppContext'
import { AuthProvider } from '@/context/AuthContext'
import ThemeProvider from '@/components/ThemeProvider'

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('sheSync_theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <AppProvider>
            <ThemeProvider>
              <div className="min-h-screen transition-all duration-500 bg-white dark:bg-[#0F0A1A]">
                {children}
              </div>
            </ThemeProvider>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
