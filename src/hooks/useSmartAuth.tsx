import { useCallback } from 'react';
import pkceChallenge from 'pkce-challenge';

const SMART_AUTH_URL = process.env.NEXT_PUBLIC_SMART_AUTH_URL || '';
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID || '';
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI || '';
const FHIR_BASE_URL = process.env.NEXT_PUBLIC_FHIR_BASE_URL || '';

export const useSmartAuth = () => {
  const generateRedirectUrl = useCallback(async () => {
    const authorizationUrl = new URL(SMART_AUTH_URL);
    const state = crypto.randomUUID();
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
  }, []);

  const handleLogin = useCallback(async () => {
    const redirectUrl = await generateRedirectUrl();
    window.location.href = redirectUrl;
  }, [generateRedirectUrl]);

  return { generateRedirectUrl, handleLogin };
};