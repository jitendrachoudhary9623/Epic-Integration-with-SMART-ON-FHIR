'use client'

import { Inter } from 'next/font/google'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import Login from '@/components/Login'
import './globals.css'
import  useAuth  from '@/hooks/useAuth'
import useLayoutManager  from '@/hooks/useLayoutManager'
import { ThemeProvider } from '@/contexts/ThemeContext'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoggedIn } = useAuth()
  const { showSidebar, showTopBar, toggleSidebar, toggleTopBar } = useLayoutManager(isLoggedIn)

  if (!isLoggedIn) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <ThemeProvider>
            <Login />
          </ThemeProvider>
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            {/* {showSidebar && <Sidebar />} */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* {showTopBar && <TopBar toggleSidebar={toggleSidebar} />} */}
              <main className="flex-1 overflow-x-hidden overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}