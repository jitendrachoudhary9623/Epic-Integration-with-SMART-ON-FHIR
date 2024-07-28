'use client'

import { Inter } from 'next/font/google'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import Login from '@/components/Login'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('access_token') // or any other key you use for authentication
      setIsLoggedIn(!!token)
    }

    checkLoginStatus()
    
    // Optional: Add event listener for storage changes
    window.addEventListener('storage', checkLoginStatus)

    return () => {
      window.removeEventListener('storage', checkLoginStatus)
    }
  }, [])

  if (!isLoggedIn) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <Login />
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen bg-gray-100">
          {/* <Sidebar /> */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* <TopBar /> */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto p-4">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}