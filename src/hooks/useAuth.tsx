'use client';
import { useEffect, useState } from 'react'
import { jwtDecode } from 'jwt-decode'
import exp from 'constants';

interface JwtPayload {
  exp: number;
  // Add other fields from your JWT payload as needed
}

const useAuth = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
  
    const checkLoginStatus = () => {
      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          const decodedToken = jwtDecode<JwtPayload>(token)
          const currentTime = Date.now() / 1000
          if (decodedToken.exp > currentTime) {
            setIsLoggedIn(true)
          } else {
            // Token is expired
            localStorage.removeItem('access_token')
            setIsLoggedIn(false)
          }
        } catch (error) {
          console.error('Error decoding token:', error)
          setIsLoggedIn(false)
        }
      } else {
        setIsLoggedIn(false)
      }
    }
  
    useEffect(() => {
      checkLoginStatus()
      window.addEventListener('storage', checkLoginStatus)
      return () => {
        window.removeEventListener('storage', checkLoginStatus)
      }
    }, [])
  
    return { isLoggedIn }
  }

export default useAuth