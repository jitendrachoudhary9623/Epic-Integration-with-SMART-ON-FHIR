'use client';

import { useState, useEffect } from 'react';
import PatientList from '@/components/PatientList';
import PatientForm from '@/components/PatientForm';
import SearchBar from '@/components/SearchBar';

export default function Home() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rowCount, setRowCount] = useState(10);

  useEffect(() => {
    fetchPatients();
  }, [currentPage, rowCount, searchTerm]);

  const fetchPatients = async () => {
    // Ensure that searchTerm, currentPage, and rowCount are properly defined in your component's state
    const response = await fetch(`/api/patients?search=${encodeURIComponent(searchTerm)}&page=${currentPage}&pageSize=${rowCount}`);
    const data = await response.json();

    // Assuming the API returns data in the format specified in your GET function
    if (data.patients && data.total) {
        setPatients(data.patients); // Set the patient data
        setTotalPages(Math.ceil(data.total / rowCount)); // Calculate total pages based on the total number of records
    } else if (data.error) {
        // Handle potential errors that might be returned by the API
        console.error('Failed to fetch patients:', data.error);
    }
};


  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);  // Reset to first page on new search
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowCountChange = (count: number) => {
    setRowCount(count);
    setCurrentPage(1);  // Reset to first page when changing row count
  };

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Patient Management App</h1>
      <SearchBar onSearch={handleSearch} />
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/2 pr-4">
          <PatientList 
            patients={patients} 
            onSelectPatient={setSelectedPatient}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onRowCountChange={handleRowCountChange}
            rowCount={rowCount}
          />
        </div>
        <div className="md:w-1/2 pl-4">
          <PatientForm 
            patient={selectedPatient} 
            onSave={() => {
              fetchPatients();
              setSelectedPatient(null);
            }}
          />
        </div>
      </div>
    </main>
  );
}