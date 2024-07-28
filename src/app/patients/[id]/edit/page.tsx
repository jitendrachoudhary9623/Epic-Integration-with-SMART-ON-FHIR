"use client";

import React from "react";
import { useParams } from "next/navigation";
import PatientForm from "@/components/PatientForm";
import { useRouter } from "next/navigation";
import { HiSave, HiX, HiArrowLeft } from "react-icons/hi";

const EditPatientPage: React.FC = () => {
  const params = useParams();
  const patientId = params.id as string;
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
      <h1 className="text-2xl font-bold mb-4">Edit Patient</h1>
      <PatientForm patientId={patientId} />
    </div>
  );
};

export default EditPatientPage;
