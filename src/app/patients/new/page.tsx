'use client';

import React from 'react';
import PatientForm from '@/components/PatientForm';
import { HiSave, HiX, HiArrowLeft } from 'react-icons/hi';
import { useRouter } from 'next/navigation';

const AddPatientPage: React.FC = () => {
    const router = useRouter();

  return (
    <div className="container mx-auto p-4">
      <div
        className=" py-1 rounded focus:outline-none focus:shadow-outline flex items-center"
        onClick={() => router.back()}
      >
        <HiArrowLeft className="mr-1" />
        Back
      </div>
      <h1 className="text-2xl font-bold mb-4">Add New Patient</h1>
      <PatientForm />
    </div>
  );
};

export default AddPatientPage;