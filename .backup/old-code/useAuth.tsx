'use client';
import { useEffect, useState } from 'react'
import { jwtDecode } from 'jwt-decode'

interface JwtPayload {
  exp: number;
  // Add other fields from your JWT payload as needed
}

const useAuth = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    const checkLoginStatus = () => {
      const accessToken = localStorage.getItem('access_token')
      const idToken = localStorage.getItem('id_token')
      const expiresIn = localStorage.getItem('expires_in')
      const tokenTimestamp = localStorage.getItem('token_timestamp')

      if (!accessToken) {
        setIsLoggedIn(false)
        return
      }

      // Try to validate using id_token (JWT format) if available
      if (idToken) {
        try {
          const decodedToken = jwtDecode<JwtPayload>(idToken)
          const currentTime = Date.now() / 1000
          if (decodedToken.exp > currentTime) {
            setIsLoggedIn(true)
            return
          } else {
            // Token is expired
            clearAuthTokens()
            setIsLoggedIn(false)
            return
          }
        } catch (error) {
          console.error('Error decoding id_token:', error)
          // Fall through to expires_in check
        }
      }

      // Fallback: check expiration using expires_in and token_timestamp
      if (expiresIn && tokenTimestamp) {
        const expirationTime = parseInt(tokenTimestamp) + (parseInt(expiresIn) * 1000)
        const currentTime = Date.now()
        if (currentTime < expirationTime) {
          setIsLoggedIn(true)
        } else {
          // Token is expired
          clearAuthTokens()
          setIsLoggedIn(false)
        }
      } else {
        // If we have access_token but no way to validate expiration, assume it's valid
        setIsLoggedIn(true)
      }
    }

    const clearAuthTokens = () => {
      localStorage.removeItem('access_token')
      localStorage.removeItem('id_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('patient')
      localStorage.removeItem('expires_in')
      localStorage.removeItem('token_timestamp')
      localStorage.removeItem('scope')
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