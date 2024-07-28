import pkceChallenge from 'pkce-challenge';

const TOKEN_ENDPOINT = process.env.NEXT_PUBLIC_SMART_TOKEN_URL || '';
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID || '';
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI || '';

export const generateState = () => {
  const state = crypto.randomUUID();
  sessionStorage.setItem('auth_state', state);
  return state;
};

export const generateCodeChallenge = async () => {
  const { code_challenge, code_verifier } = await pkceChallenge();
  sessionStorage.setItem('code_verifier', code_verifier);
  return code_challenge;
};

export const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: CLIENT_ID
    })
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const tokens = await response.json();
  localStorage.setItem('access_token', tokens.access_token);
  localStorage.setItem('expires_in', tokens.expires_in);
  return parseInt(tokens.expires_in, 10);
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('id_token');
  localStorage.removeItem('patient');
  localStorage.removeItem('expires_in');
  sessionStorage.removeItem('auth_state');
  sessionStorage.removeItem('code_verifier');
};

export const exchangeCodeForToken = async (code: string) => {
  const codeVerifier = sessionStorage.getItem('code_verifier');
  if (!codeVerifier) {
    throw new Error('Code verifier not found');
  }

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
  localStorage.setItem('refresh_token', tokens.refresh_token);
  localStorage.setItem('id_token', tokens.id_token);
  localStorage.setItem('patient', tokens.patient);
  localStorage.setItem('expires_in', tokens.expires_in);

  sessionStorage.removeItem('auth_state');
  sessionStorage.removeItem('code_verifier');

  return tokens;
};