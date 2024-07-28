import { useState } from 'react';
import { useRouter } from 'next/navigation';

const useHandleFormSubmit = (patientId: string | undefined, router: ReturnType<typeof useRouter>) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);

    const patientData = {
      resourceType: 'Patient',
      name: [
        {
          use: 'official',
          family: data.familyName,
          given: [data.givenName],
        },
      ],
      gender: data.gender,
      birthDate: data.birthDate,
      telecom: [
        { system: 'phone', value: data.phone },
        { system: 'email', value: data.email },
      ],
      address: [
        {
          use: 'home',
          line: [data?.address?.line1],
          city: data?.address?.city,
          state: data?.address?.state,
          postalCode: data?.address?.postalCode,
        },
      ],
    };

    try {
      const url = patientId ? `/api/patients/${patientId}` : '/api/patients';
      const method = patientId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      });

      if (!response.ok) throw new Error('Failed to save patient data');

      setMessage(patientId ? 'Patient data updated successfully' : 'Patient data saved successfully');
      setTimeout(() => router.push('/patients'), 2000);
    } catch (err) {
      setError('Failed to save patient data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, message, onSubmit };
};

export default useHandleFormSubmit;