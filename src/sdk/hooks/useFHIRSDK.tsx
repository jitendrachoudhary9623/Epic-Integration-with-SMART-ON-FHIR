/**
 * React Hooks for FHIR SDK
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SMARTAuthClient } from '../core/auth-client';
import { FHIRClient } from '../core/fhir-client';
import { PatientService } from '../services';
import type {
  Patient,
  MedicationRequest,
  Observation,
  Appointment,
  Encounter,
  Procedure,
} from '../types';

/**
 * Hook to initialize and manage SMART authentication
 */
export function useAuth(providerId: string) {
  // Use useMemo instead of useState to recreate client when providerId changes
  const authClient = useMemo(() => new SMARTAuthClient(providerId), [providerId]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [patientId, setPatientId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await authClient.isAuthenticated();
        setIsAuthenticated(authenticated);

        if (authenticated) {
          const pid = await authClient.getPatientId();
          setPatientId(pid);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [authClient]);

  const login = useCallback(async () => {
    try {
      const authUrl = await authClient.authorize();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, [authClient]);

  const handleCallback = useCallback(async (callbackUrl: string) => {
    try {
      setIsLoading(true);
      await authClient.handleCallback(callbackUrl);
      const authenticated = await authClient.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const pid = await authClient.getPatientId();
        setPatientId(pid);
      }
    } catch (error) {
      console.error('Callback handling failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authClient]);

  const logout = useCallback(async () => {
    try {
      await authClient.logout();
      setIsAuthenticated(false);
      setPatientId(null);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }, [authClient]);

  return {
    authClient,
    isAuthenticated,
    isLoading,
    patientId,
    login,
    handleCallback,
    logout,
  };
}

/**
 * Hook to access FHIR client
 */
export function useFHIRClient(providerId: string, authClient: SMARTAuthClient) {
  const fhirClient = useMemo(() => {
    const client = new FHIRClient({
      providerId,
      autoRefreshToken: true,
    });
    client.setAuthClient(authClient);
    return client;
  }, [providerId, authClient]);

  return fhirClient;
}

/**
 * Hook to access patient service
 */
export function usePatientService(fhirClient: FHIRClient) {
  const patientService = useMemo(() => {
    return new PatientService(fhirClient);
  }, [fhirClient]);

  return patientService;
}

/**
 * Hook to fetch patient data
 */
export function usePatientData(patientId: string | null, patientService: PatientService) {
  const [data, setData] = useState<{
    patient: Patient | null;
    medications: MedicationRequest[];
    vitals: Observation[];
    labReports: Observation[];
    appointments: Appointment[];
    encounters: Encounter[];
    procedures: Procedure[];
  }>({
    patient: null,
    medications: [],
    vitals: [],
    labReports: [],
    appointments: [],
    encounters: [],
    procedures: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!patientId) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await patientService.getAllPatientData(patientId);
        setData({
          patient: result.patient,
          medications: result.medications,
          vitals: result.vitals,
          labReports: result.labReports,
          appointments: result.appointments,
          encounters: result.encounters,
          procedures: result.procedures,
        });
        setErrors(result.errors);
      } catch (error) {
        console.error('Failed to fetch patient data:', error);
        setErrors({
          general: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [patientId, patientService]);

  const refetch = useCallback(async () => {
    if (!patientId) return;

    try {
      setIsLoading(true);
      const result = await patientService.getAllPatientData(patientId);
      setData({
        patient: result.patient,
        medications: result.medications,
        vitals: result.vitals,
        labReports: result.labReports,
        appointments: result.appointments,
        encounters: result.encounters,
        procedures: result.procedures,
      });
      setErrors(result.errors);
    } catch (error) {
      console.error('Failed to refetch patient data:', error);
      setErrors({
        general: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [patientId, patientService]);

  return {
    ...data,
    isLoading,
    errors,
    refetch,
  };
}

/**
 * All-in-one hook that combines auth, client, and data fetching
 */
export function useFHIR(providerId: string) {
  const auth = useAuth(providerId);
  const fhirClient = useFHIRClient(providerId, auth.authClient);
  const patientService = usePatientService(fhirClient);
  const patientData = usePatientData(auth.patientId, patientService);

  return {
    // Auth
    isAuthenticated: auth.isAuthenticated,
    isAuthLoading: auth.isLoading,
    patientId: auth.patientId,
    login: auth.login,
    handleCallback: auth.handleCallback,
    logout: auth.logout,

    // Client
    fhirClient,
    patientService,

    // Data
    patient: patientData.patient,
    medications: patientData.medications,
    vitals: patientData.vitals,
    labReports: patientData.labReports,
    appointments: patientData.appointments,
    encounters: patientData.encounters,
    procedures: patientData.procedures,
    isDataLoading: patientData.isLoading,
    errors: patientData.errors,
    refetch: patientData.refetch,
  };
}
