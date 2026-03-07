import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/context/AppContext'
import { AuthProvider } from '@/context/AuthContext'
import ThemeProvider from '@/components/ThemeProvider'

type StorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
  clear: () => void
  key: (index: number) => string | null
  readonly length: number
}

const createMemoryStorage = (): StorageLike => {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size
    }
  }
}

const ensureServerStorageShape = () => {
  if (typeof window !== 'undefined') return
  const g = globalThis as unknown as {
    localStorage?: Partial<StorageLike>
    sessionStorage?: Partial<StorageLike>
  }

  if (typeof g.localStorage?.getItem !== 'function') {
    g.localStorage = createMemoryStorage()
  }

  if (typeof g.sessionStorage?.getItem !== 'function') {
    g.sessionStorage = createMemoryStorage()
  }
}

ensureServerStorageShape()

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
                  var storage = window.localStorage;
                  if (!storage || typeof storage.getItem !== 'function') {
                    return;
                  }
                  const theme = storage.getItem('sheSync_theme');
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
              <div className="min-h-screen transition-all duration-500 bg-white dark:bg-[#17121F]">
                {children}
              </div>
            </ThemeProvider>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
