import { NextRequest, NextResponse } from 'next/server';
import { PatientService } from '../../../../services/PatientService';
import type { Patient } from 'fhir/r4';

const patientService = new PatientService(process.env.FHIR_SERVER);

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const patientData: Partial<Patient> = await request.json();
  const { id } = params;

  console.log('patientData:', { id });

  if (!id) {
    return NextResponse.json({ error: 'Patient ID is required for updates', params }, { status: 400 });
  }

  try {
    const updatedPatient = await patientService.updatePatient(id, { ...patientData, id });
    return NextResponse.json(updatedPatient);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ 
      error: 'Failed to update patient', 
      details: error instanceof Error ? error.message : String(error),
      patientData 
    }, { status: 500 });
  }
}