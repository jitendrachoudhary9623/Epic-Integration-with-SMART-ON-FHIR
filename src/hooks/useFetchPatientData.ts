import exp from 'constants';
import { useState, useEffect } from 'react';

const useFetchPatientData = (patientId: string | undefined, reset: (data: any) => void) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (patientId) {
      const fetchPatientData = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/patients?id=${patientId}`);
          if (!response.ok) throw new Error('Failed to fetch patient data');
          const patientData = await response.json();
          reset({
            givenName: patientData.name?.[0]?.given?.join(' ') || '',
            familyName: patientData.name?.[0]?.family || '',
            gender: patientData.gender || '',
            birthDate: patientData.birthDate || '',
            phone: patientData.telecom?.find((t: any) => t.system === 'phone')?.value || '',
            email: patientData.telecom?.find((t: any) => t.system === 'email')?.value || '',
            address: {
              line1: patientData.address?.[0]?.line?.[0] || '',
              city: patientData.address?.[0]?.city || '',
              state: patientData.address?.[0]?.state || '',
              postalCode: patientData.address?.[0]?.postalCode || '',
            },
          });
        } catch (err) {
          setError('Failed to load patient data. Please try again.');
        } finally {
          setLoading(false);
        }
      };

      fetchPatientData();
    }
  }, [patientId, reset]);

  return { loading, error };
};

export default useFetchPatientData;