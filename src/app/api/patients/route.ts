import { NextRequest, NextResponse } from 'next/server';
import { PatientService } from '../../../services/PatientService';

const patientService = new PatientService(process.env.FHIR_SERVER);
const DEFAULT_PAGE_SIZE = 10;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const patientId = searchParams.get('id');
  console.log('searchParams:', searchParams);
  try {
    if (patientId) {
      // Fetch single patient
      const data = await patientService.getPatientById(patientId);
      return NextResponse.json(data);
    } else {
      // Fetch multiple patients
      const search = searchParams.get('search') || '';
      const page = parseInt(searchParams.get('page') || '0', 10);
      const { patients, total } = await patientService.getPatients(search, page, DEFAULT_PAGE_SIZE);
      
      return NextResponse.json({
        patients,
        total,
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
      });
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const patientData = await request.json();

  try {
    const data = await patientService.createPatient(patientData);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const patientData = await request.json();

  try {
    const data = await patientService.updatePatient(id, patientData);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 });
  }
}