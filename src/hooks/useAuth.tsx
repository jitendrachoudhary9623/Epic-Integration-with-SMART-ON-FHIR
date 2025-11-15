'use client';

/**
 * useAuth Hook - SDK Version
 * Simple wrapper around SDK's authentication for backward compatibility
 */

import { useEffect, useState } from 'react';

const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const checkLoginStatus = () => {
    // Check SDK token storage
    const accessToken = localStorage.getItem('fhir_sdk_access_token');
    const tokenExpiry = localStorage.getItem('fhir_sdk_token_expiry');

    if (!accessToken) {
      setIsLoggedIn(false);
      return;
    }

    // Check if token is expired
    if (tokenExpiry) {
      const expiry = parseInt(tokenExpiry, 10);
      const now = Date.now();

      if (now < expiry) {
        setIsLoggedIn(true);
      } else {
        // Token expired
        setIsLoggedIn(false);
      }
    } else {
      // No expiry info, assume valid
      setIsLoggedIn(true);
    }
  };

  useEffect(() => {
    checkLoginStatus();
    window.addEventListener('storage', checkLoginStatus);
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, []);

  return { isLoggedIn };
};

export default useAuth;
