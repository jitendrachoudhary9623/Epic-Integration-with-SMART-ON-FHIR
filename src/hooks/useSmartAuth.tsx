import { useCallback, useState, useEffect } from 'react';
import pkceChallenge from 'pkce-challenge';

const SMART_AUTH_URL = process.env.NEXT_PUBLIC_SMART_AUTH_URL || '';
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID || '1ad1e95a-d2d1-4a29-a87c-2082f1969a28';
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3000';
const FHIR_BASE_URL = process.env.NEXT_PUBLIC_FHIR_BASE_URL || '';
const CERNER_TENANT_ID = process.env.NEXT_PUBLIC_CERNER_TENANT_ID || 'ec2458f2-1e24-41c8-b71b-0e701af7583d';
const CERNER_CLIENT_ID = process.env.NEXT_PUBLIC_CERNER_CLIENT_ID || "127eeefe-be03-4c9a-b93a-11c3643e82d4";

type EMRConfig = {
  emr: string;
  authUrl: string;
  clientId: string;
  redirectUri: string;
  fhirBaseUrl: string;
  scopes: string[];
  additionalParams?: Record<string, string>;
};

const emrConfigs: Record<string, EMRConfig> = {
  "1": {
    emr: 'Epic', 
    authUrl: SMART_AUTH_URL,
    clientId: CLIENT_ID,
    redirectUri: REDIRECT_URI,
    fhirBaseUrl: FHIR_BASE_URL,
    scopes: ['openid', 'fhirUser'],
  },
  "2": {
    emr: 'Cerner',
    authUrl: `https://authorization.cerner.com/tenants/${CERNER_TENANT_ID}/protocols/oauth2/profiles/smart-v1/personas/patient/authorize`,
    clientId: CERNER_CLIENT_ID,
    redirectUri: REDIRECT_URI,
    fhirBaseUrl: `https://fhir-myrecord.cerner.com/r4/${CERNER_TENANT_ID}`,
    scopes: [
      'openid',
      'fhirUser',
      'profile',
      'offline_access',
      'launch/patient',
      'patient/Patient.read',
      'patient/MedicationRequest.read',
      'patient/Observation.read',
      'patient/Appointment.read',
      'patient/Encounter.read',
      'patient/Procedure.read',
      'patient/VitalSigns.read',
      'patient/Medication.read',
      'patient/Encounter.read',
      'patient/LabResult.read'
    ],
  }
  // Add configurations for other EMR systems here
};

export const useSmartAuth = () => {
  const [selectedEMR, setSelectedEMR] = useState<string>('1');

  useEffect(() => {
    const storedEMR = localStorage.getItem('selectedEMR');
    if (storedEMR && emrConfigs[storedEMR]) {
      setSelectedEMR(storedEMR);
    } else {
      setSelectedEMR('1'); // Default to Epic if no valid EMR is stored
    }
  }, []);

  const generateRedirectUrl = useCallback(async () => {
    const storedEMR = localStorage.getItem('selectedEMR');
    const currentEMR = storedEMR && emrConfigs[storedEMR] ? storedEMR : '1';
    const config = emrConfigs[currentEMR];
    localStorage.setItem('fhirBaseUrl', config.fhirBaseUrl);

    const authorizationUrl = new URL(config.authUrl);
    const state = crypto.randomUUID();
    const { code_challenge, code_verifier } = await pkceChallenge();

    const params: Record<string, string> = {
      client_id: config.clientId,
      scope: config.scopes.join(' '),
      redirect_uri: config.redirectUri,
      response_type: 'code',
      state: state,
      aud: config.fhirBaseUrl,
    };

    if (config.emr === 'Epic') {
      params.code_challenge = code_challenge;
      params.code_challenge_method = 'S256';
    }

    if (config.additionalParams) {
      Object.assign(params, config.additionalParams);
    }

    authorizationUrl.search = new URLSearchParams(params).toString();

    sessionStorage.setItem('auth_state', state);
    sessionStorage.setItem('code_verifier', code_verifier);

    return authorizationUrl.toString();
  }, []);

  const handleLogin = useCallback(async () => {
    const redirectUrl = await generateRedirectUrl();
    window.location.href = redirectUrl;
  }, [generateRedirectUrl]);

  return { generateRedirectUrl, handleLogin, selectedEMR };
};