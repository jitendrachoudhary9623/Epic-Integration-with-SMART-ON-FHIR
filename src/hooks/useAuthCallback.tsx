import { useCallback, useState, useRef, useEffect } from 'react';

const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID || '7aada79d-32b6-4394-bd8c-d3acf38e3a88';
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3000';
const EPIC_TOKEN_ENDPOINT = process.env.NEXT_PUBLIC_EPIC_TOKEN_URL || 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token';
const CERNER_TOKEN_ENDPOINT = process.env.NEXT_PUBLIC_CERNER_TOKEN_URL || 'https://authorization.cerner.com/tenants/ec2458f2-1e24-41c8-b71b-0e701af7583d/hosts/fhir-myrecord.cerner.com/protocols/oauth2/profiles/smart-v1/token';
const CERNER_CLIENT_ID = process.env.NEXT_PUBLIC_CERNER_CLIENT_ID || "127eeefe-be03-4c9a-b93a-11c3643e82d4";



type EMRConfig = {
  tokenEndpoint: string;
  clientId: string;
  usesPKCE: boolean;
};

const emrConfigs: Record<string, EMRConfig> = {
  "1": { // Epic
    tokenEndpoint: EPIC_TOKEN_ENDPOINT,
    clientId: CLIENT_ID,
    usesPKCE: true,
  },
  "2": { // Cerner
    tokenEndpoint: CERNER_TOKEN_ENDPOINT,
    clientId: CERNER_CLIENT_ID,
    usesPKCE: false,
  },
  // Add configurations for other EMR systems here
};

export const useAuthCallback = (setStatus: (status: string) => void) => {
  const [isProcessingAuth, setIsProcessingAuth] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [selectedEMR, setSelectedEMR] = useState<string>('1');

  useEffect(() => {
    const storedEMR = localStorage.getItem('selectedEMR');
    if (storedEMR && emrConfigs[storedEMR]) {
      setSelectedEMR(storedEMR);
    }
  }, []);

  const verifyStateAndExchangeToken = useCallback(async (code: string, state: string) => {
    if (isProcessingAuth) return;

    setIsProcessingAuth(true);
    setStatus('Verifying...');

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    const storedState = sessionStorage.getItem('auth_state');
    if (state !== storedState) {
      setStatus('Error: Invalid state');
      setIsProcessingAuth(false);
      return;
    }

    const selectedEMR = localStorage.getItem('selectedEMR');
    const config = emrConfigs[selectedEMR || '1'];
    if (!config) {
      setStatus('Error: Invalid EMR configuration');
      setIsProcessingAuth(false);
      return;
    }

    try {
      const bodyParams: Record<string, string> = {
        grant_type: 'authorization_code',
        code: code,
        client_id: config.clientId,
        redirect_uri: REDIRECT_URI,
      };

      if (config.usesPKCE) {
        const codeVerifier = sessionStorage.getItem('code_verifier');
        if (!codeVerifier) {
          setStatus('Error: Code verifier not found');
          setIsProcessingAuth(false);
          return;
        }
        bodyParams.code_verifier = codeVerifier;
      }

      console.log({
        bodyParams
      })

      const response = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(bodyParams),
        signal
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const tokens = await response.json();
      
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('id_token', tokens.id_token);
      if (tokens.patient) {
        localStorage.setItem('patient', tokens.patient);
      }
      localStorage.setItem('expires_in', tokens.expires_in);
      localStorage.setItem('scope', tokens.scope);

      sessionStorage.removeItem('auth_state');
      if (config.usesPKCE) {
        sessionStorage.removeItem('code_verifier');
      }

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
  }, [setStatus, selectedEMR]);

  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProcessingAuth(false);
  }, []);

  return { verifyStateAndExchangeToken, isProcessingAuth, cleanup };
};