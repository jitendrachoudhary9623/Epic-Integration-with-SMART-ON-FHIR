import React, { useCallback, useEffect, useState } from 'react';
import { Lock, Hospital } from 'lucide-react';
import pkceChallenge from 'pkce-challenge';

const SMART_AUTH_URL = process.env.NEXT_PUBLIC_SMART_AUTH_URL || '';
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID || '';
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI || '';
const FHIR_BASE_URL = process.env.NEXT_PUBLIC_FHIR_BASE_URL || '';
const TOKEN_ENDPOINT = process.env.NEXT_PUBLIC_SMART_TOKEN_URL || '';

const Login = () => {
  const [status, setStatus] = useState<string>('');
  const [isProcessingAuth, setIsProcessingAuth] = useState<boolean>(false);

  const generateRedirectUrl = useCallback(async () => {
    const authorizationUrl = new URL(SMART_AUTH_URL);
    const state = crypto.randomUUID(); // Using built-in UUID generation
    const { code_challenge, code_verifier } = await pkceChallenge();

    authorizationUrl.searchParams.set('client_id', CLIENT_ID);
    authorizationUrl.searchParams.set('scope', 'openid fhirUser');
    authorizationUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authorizationUrl.searchParams.set('response_type', 'code');
    authorizationUrl.searchParams.set('state', state);
    authorizationUrl.searchParams.set('aud', FHIR_BASE_URL);
    authorizationUrl.searchParams.set('code_challenge', code_challenge);
    authorizationUrl.searchParams.set('code_challenge_method', 'S256');
    
    sessionStorage.setItem('auth_state', state);
    sessionStorage.setItem('code_verifier', code_verifier);

    return authorizationUrl.toString();
  }, []); // No dependencies needed here

  const handleLogin = async () => {
    const redirectUrl = await generateRedirectUrl();
    window.location.href = redirectUrl;
  };

  const verifyStateAndExchangeToken = useCallback(async (code: string, state: string) => {
    setStatus('Verifying...');

    const storedState = sessionStorage.getItem('auth_state');
    if (state !== storedState) {
      setStatus('Error: Invalid state');
      return;
    }

    const codeVerifier = sessionStorage.getItem('code_verifier');
    if (!codeVerifier) {
      setStatus('Error: Code verifier not found');
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
        })
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
      
      // Redirect to the main application page or dashboard
      setTimeout(() => window.location.href = '/dashboard', 2000);
    } catch (error) {
      console.log({ error, TOKEN_ENDPOINT });
      console.error('Token exchange error:', error);
      setStatus('Error: Failed to exchange code for token');
    }
  }, []); // No dependencies needed here

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state && !isProcessingAuth) {
      setIsProcessingAuth(true);
      verifyStateAndExchangeToken(code, state);
    }
  }, [verifyStateAndExchangeToken, isProcessingAuth]);

  if (status) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold mb-4">Authentication in progress</h2>
          <p>{status}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 space-y-4">
          <h2 className="text-2xl font-bold text-center text-gray-800">Login to Your EMR</h2>
          <p className="text-center text-gray-600">
            Connect securely with EPIC EMR using SMART on FHIR
          </p>
          <div className="flex justify-center">
            <div className="p-6 bg-blue-100 rounded-full">
              <Hospital size={48} className="text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 text-center">
            Click the button below to securely connect with your EPIC EMR account.
          </p>
        </div>
        <div className="px-6 pb-6">
          <button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
            onClick={handleLogin}
          >
            <Lock size={18} className="mr-2" />
            Connect to EPIC EMR
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;