import { useCallback, useState, useRef } from 'react';

const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID || '';
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI || '';
const TOKEN_ENDPOINT = process.env.NEXT_PUBLIC_SMART_TOKEN_URL || '';

export const useAuthCallback = (setStatus: (status: string) => void) => {
  const [isProcessingAuth, setIsProcessingAuth] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const verifyStateAndExchangeToken = useCallback(async (code: string, state: string) => {
    if (isProcessingAuth) return;

    setIsProcessingAuth(true);
    setStatus('Verifying...');

    // Create a new AbortController for this authentication attempt
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    const storedState = sessionStorage.getItem('auth_state');
    if (state !== storedState) {
      setStatus('Error: Invalid state');
      setIsProcessingAuth(false);
      return;
    }

    const codeVerifier = sessionStorage.getItem('code_verifier');
    if (!codeVerifier) {
      setStatus('Error: Code verifier not found');
      setIsProcessingAuth(false);
      return;
    }

    try {
      const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          client_id: CLIENT_ID,
          redirect_uri: REDIRECT_URI,
          code_verifier: codeVerifier
        }),
        signal // Pass the AbortController's signal to the fetch call
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const tokens = await response.json();
      
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('id_token', tokens.id_token);
      localStorage.setItem('patient', tokens.patient);
      localStorage.setItem('expires_in', tokens.expires_in);
      localStorage.setItem('scope', tokens.scope);

      sessionStorage.removeItem('auth_state');
      sessionStorage.removeItem('code_verifier');

      setStatus('Login successful!');
      
      setTimeout(() => window.location.href = '/dashboard', 2000);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted');
          setStatus('Authentication cancelled');
        } else {
          console.error('Token exchange error:', error);
          setStatus(`Error: ${error.message}`);
        }
      } else {
        console.error('An unknown error occurred:', error);
        setStatus('An unknown error occurred');
      }
    } finally {
      setIsProcessingAuth(false);
      abortControllerRef.current = null;
    }
  }, [setStatus]);

  // Cleanup function to abort any ongoing authentication process
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProcessingAuth(false);
  }, []);

  return { verifyStateAndExchangeToken, isProcessingAuth, cleanup };
};