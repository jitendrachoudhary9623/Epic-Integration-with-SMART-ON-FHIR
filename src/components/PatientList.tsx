import React from 'react';

interface Name {
  given?: string[];
  family?: string;
}

interface Telecom {
  system: string;
  value: string;
  use?: string;
}

interface Address {
  line?: string[];
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface Patient {
  resource: {
    id: string;
    name?: Name[];
    gender?: string;
    birthDate?: string;
    telecom?: Telecom[];
    address?: Address[];
    meta?: {
      lastUpdated?: string;
    };
  };
}

interface PatientListProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient['resource']) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRowCountChange: (rowCount: number) => void;
  rowCount: number;
}

const PatientList: React.FC<PatientListProps> = ({
  patients,
  onSelectPatient,
  currentPage,
  totalPages,
  onPageChange,
  onRowCountChange,
  rowCount
}) => {
  const getPatientName = (name?: Name[]): string => {
    if (!name || name.length === 0) return 'Unknown';
    const firstName = name[0].given?.join(' ') || '';
    const lastName = name[0].family || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown';
  };

  const getContactNumber = (telecom?: Telecom[]): string => {
    const phone = telecom?.find(t => t.system === 'phone');
    return phone ? phone.value : 'Unknown';
  };

  const getAddress = (address?: Address[]): string => {
    if (!address || address.length === 0) return 'Unknown';
    const lines = address[0].line?.join(', ') || '';
    const city = address[0].city || '';
    const state = address[0].state || '';
    const postalCode = address[0].postalCode || '';
    const country = address[0].country || '';
    return `${lines}, ${city}, ${state} ${postalCode}, ${country}`.trim() || 'Unknown';
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <h2 className="text-2xl font-bold p-4 bg-blue-500 text-white">Patient List</h2>
      <div className="p-4 border-b">
        <label className="mr-2">Rows per page:</label>
        <select 
          value={rowCount} 
          onChange={(e) => onRowCountChange(Number(e.target.value))}
          className="border rounded p-1"
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </div>
      <ul className="divide-y divide-gray-200">
        {patients.map((patient) => (
          <li 
            key={patient.resource.id} 
            className="p-4 hover:bg-gray-50 cursor-pointer transition duration-150 ease-in-out"
            onClick={() => onSelectPatient(patient.resource)}
          >
            <div className="flex justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {getPatientName(patient.resource.name)}
                </p>
                <p className="text-sm text-gray-500">
                  Gender: {patient.resource.gender || 'Unknown'}
                </p>
                <p className="text-sm text-gray-500">
                  DoB: {patient.resource.birthDate || 'Unknown'}
                </p>
                <p className="text-sm text-gray-500">
                  Phone: {getContactNumber(patient.resource.telecom)}
                </p>
                <p className="text-sm text-gray-500">
                  Address: {getAddress(patient.resource.address)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  Last Updated:
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(patient.resource.meta?.lastUpdated)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {patients.length === 0 && (
        <p className="p-4 text-center text-gray-500">No patients found.</p>
      )}

<div className="p-4 flex justify-between items-center">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 border rounded bg-blue-500 text-white disabled:bg-gray-300"
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-4 py-2 border rounded bg-blue-500 text-white disabled:bg-gray-300"
        >
          Next
        </button>
        </div>
    </div>
  );
};

export default PatientList;
