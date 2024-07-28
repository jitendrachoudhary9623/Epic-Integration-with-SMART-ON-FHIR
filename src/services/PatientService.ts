import axios from 'axios';
import type { Patient } from 'fhir/r4';

const FHIR_SERVER = process.env.FHIR_SERVER;
const DEFAULT_PAGE_SIZE = 10;

export class PatientService {
  private readonly baseUrl: string | undefined;

  constructor(baseUrl: string | undefined = FHIR_SERVER) {
    this.baseUrl = baseUrl;
  }

  async getPatientById(patientId: string): Promise<Patient> {
    const response = await axios.get(`${this.baseUrl}/Patient/${patientId}`);
    return response.data;
  }

  async getPatients(searchTerm: string, page: number, pageSize: number = DEFAULT_PAGE_SIZE) {
    let searchParams: {
      phone?: string | undefined,
      name?: string | undefined
    } = {};

    if (searchTerm) {
      if (this.isPhoneNumber(searchTerm)) {
        searchParams.phone = searchTerm;
      } else {
        searchParams.name = searchTerm;
      }
    }

    const offset = Math.max(0, (page - 1) * pageSize);

    const params = {
      _sort: '-_lastUpdated',
      _count: pageSize,
      _offset: offset,
      _total: 'accurate',
      ...searchParams,
    };

    console.log('params:', params);
    console.log('this.baseUrl:', this.baseUrl);

    const response = await axios.get(`${this.baseUrl}/Patient`, { params });


    return {
      patients: response.data.entry?.map((entry: { resource: any }) => entry.resource) || [],
      total: response.data.total || 0,
    };
  }

  private isPhoneNumber(value: string): boolean {
    return /^\+?[\d\s-()]+$/.test(value);
  }

  async createPatient(patientData: Partial<Patient>): Promise<Patient> {
    const response = await axios.post(`${this.baseUrl}/Patient`, patientData, {
      headers: { 'Content-Type': 'application/fhir+json' },
    });
    return response.data;
  }

  async updatePatient(id: string, patientData: Partial<Patient>): Promise<Patient> {
    const response = await axios.put(`${this.baseUrl}/Patient/${id}`, patientData, {
      headers: { 'Content-Type': 'application/fhir+json' },
    });
    return response.data;
  }
}