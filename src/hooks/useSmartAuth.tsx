import { useCallback, useState, useEffect } from 'react';
import pkceChallenge from 'pkce-challenge';

const SMART_AUTH_URL = process.env.NEXT_PUBLIC_SMART_AUTH_URL || '';
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID || '1ad1e95a-d2d1-4a29-a87c-2082f1969a28';
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3000';
const FHIR_BASE_URL = process.env.NEXT_PUBLIC_FHIR_BASE_URL || '';
const CERNER_TENANT_ID = process.env.NEXT_PUBLIC_CERNER_TENANT_ID || 'ec2458f2-1e24-41c8-b71b-0e701af7583d';
const CERNER_CLIENT_ID = process.env.NEXT_PUBLIC_CERNER_CLIENT_ID || "127eeefe-be03-4c9a-b93a-11c3643e82d4";
const ALLSCRIPTS_CLIENT_ID = process.env.NEXT_PUBLIC_ALLSCRIPTS_CLIENT_ID || "237e3cb2-3760-4025-ba1b-309bc3ddf199";
const ALLSCRIPTS_AUTH_URL = process.env.NEXT_PUBLIC_ALLSCRIPTS_AUTH_URL || '';
const ALLSCRIPTS_FHIR_BASE_URL = process.env.NEXT_PUBLIC_ALLSCRIPTS_FHIR_BASE_URL || '';
const ALLSCRIPTS_TOKEN_URL = process.env.NEXT_PUBLIC_ALLSCRIPTS_TOKEN_URL || '';
const ATHENA_CLIENT_ID = process.env.NEXT_PUBLIC_ATHENA_CLIENT_ID || "0oatemfz4jQVLtuJq297";
const ATHENA_AUTH_URL = process.env.NEXT_PUBLIC_ATHENA_AUTH_URL || 'https://api.preview.platform.athenahealth.com/oauth2/v1/authorize';
const ATHENA_FHIR_BASE_URL = process.env.NEXT_PUBLIC_ATHENA_FHIR_BASE_URL || 'https://api.preview.platform.athenahealth.com/fhir/r4';
const ATHENA_TOKEN_URL = process.env.NEXT_PUBLIC_ATHENA_TOKEN_URL || 'https://api.preview.platform.athenahealth.com/oauth2/v1/token';
const ATHENA_REDIRECT_URI = process.env.NEXT_PUBLIC_ATHENA_REDIRECT_URI || REDIRECT_URI;

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
  },
  "3": {
    emr: 'Allscripts',
    authUrl: ALLSCRIPTS_AUTH_URL,
    clientId: ALLSCRIPTS_CLIENT_ID,
    redirectUri: REDIRECT_URI,
    fhirBaseUrl: ALLSCRIPTS_FHIR_BASE_URL,
    scopes: [
      'openid',
      'profile',
      'launch/patient',
      'patient/Patient.read',
      'patient/MedicationRequest.read',
      'patient/Observation.read',
      'patient/Appointment.read',
      'patient/Encounter.read',
      'patient/Procedure.read',
      'patient/AllergyIntolerance.read',
      'patient/Condition.read',
      'patient/DiagnosticReport.read',
      'offline_access'
    ],
  },
  "5": {
    emr: 'Athena',
    authUrl: ATHENA_AUTH_URL,
    clientId: ATHENA_CLIENT_ID,
    redirectUri: ATHENA_REDIRECT_URI,
    fhirBaseUrl: ATHENA_FHIR_BASE_URL,
    scopes: [
      'openid',
      'fhirUser',
      'profile',
      'offline_access',
      'launch/patient',
      'patient/Patient.read',
      'patient/Observation.read',
      'patient/Condition.read',
      'patient/AllergyIntolerance.read',
      'patient/MedicationRequest.read',
      'patient/Medication.read',
      'patient/MedicationStatement.read',
      'patient/Procedure.read',
      'patient/Encounter.read',
      'patient/DiagnosticReport.read',
      'patient/Organization.read',
      'patient/Location.read',
      'patient/Practitioner.read',
      'patient/Device.read',
      'patient/Provenance.read',
    ],
  }
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

    if (config.emr === 'Epic' || config.emr === 'Athena') {
      params.code_challenge = code_challenge;
      params.code_challenge_method = 'S256';
    }

    if (config.additionalParams) {
      Object.assign(params, config.additionalParams);
    }

    authorizationUrl.search = new URLSearchParams(params).toString();

    sessionStorage.setItem('auth_state', state);
    sessionStorage.setItem('code_verifier', code_verifier);

    // Debug logging for Athena
    if (config.emr === 'Athena') {
      console.log('Athena Authorization URL:', authorizationUrl.toString());
      console.log('Athena Params:', params);
    }

    return authorizationUrl.toString();
  }, []);

  const handleLogin = useCallback(async () => {
    const redirectUrl = await generateRedirectUrl();
    window.location.href = redirectUrl;
  }, [generateRedirectUrl]);

  return { generateRedirectUrl, handleLogin, selectedEMR };
};