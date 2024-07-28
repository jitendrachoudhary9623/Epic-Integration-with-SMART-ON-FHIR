'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Clock, LogOut, Calendar, Activity, FileText, Pill } from 'lucide-react';
import PatientInfo from './PatientInfo';
import Appointments from './Appointments';
import Medications from './Medications';
import Vitals from './Vitals';
import LabReports from './LabReports';
import { refreshToken, logout } from '@/lib/auth';
import { fetchPatientData, fetchPatientAppointments, fetchPatientMedications, fetchPatientVitals, fetchPatientLabReports } from '@/lib/api';

const Dashboard = () => {
  const router = useRouter();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [medications, setMedications] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [expiryTime, setExpiryTime] = useState(0);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token') || '';
    const expiresAt = localStorage.getItem('expires_at') || '0';
    const patientId = localStorage.getItem('patient') || '';

    // if (!accessToken) {
    //   router.push('/');
    //   return;
    // }

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = Math.max(0, parseInt(expiresAt, 10) - now);
    setExpiryTime(expiresIn);

    const fetchData = async () => {
      try {
        const [patientData, appointmentsData, medicationsData, vitalsData, labReportsData] = await Promise.all([
          fetchPatientData(patientId, accessToken),
          fetchPatientAppointments(patientId, accessToken),
          fetchPatientMedications(patientId, accessToken),
          fetchPatientVitals(patientId, accessToken),
          fetchPatientLabReports(patientId, accessToken)
        ]);

        setPatient(patientData);
        setAppointments(appointmentsData);
        setMedications(medicationsData);
        setVitals(vitalsData);
        setLabReports(labReportsData);
      } catch (error) {
        console.error('Error fetching patient data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setExpiryTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
         // refreshToken().catch(() => router.push('/'));
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const formatTime = (seconds: any) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold mb-4">Loading patient data...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <Clock className="inline-block mr-1" size={16} />
              Session expires in: {formatTime(expiryTime)}
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <LogOut size={18} className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>
      <div className="flex max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <nav className="w-64 bg-white shadow-lg rounded-lg mr-8 p-6">
          <div className="flex items-center justify-center mb-8">
            <div className="w-24 h-24 bg-gray-300 rounded-full overflow-hidden">
              <User size={96} className="text-gray-600" />
            </div>
          </div>
          <ul>
            <li className="mb-4">
              <button
                onClick={() => setActiveTab('info')}
                className={`flex items-center text-gray-700 hover:text-blue-500 w-full ${activeTab === 'info' ? 'text-blue-500 font-bold' : ''}`}
              >
                <FileText size={20} className="mr-2" />
                Patient Info
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={() => setActiveTab('appointments')}
                className={`flex items-center text-gray-700 hover:text-blue-500 w-full ${activeTab === 'appointments' ? 'text-blue-500 font-bold' : ''}`}
              >
                <Calendar size={20} className="mr-2" />
                Appointments
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={() => setActiveTab('medications')}
                className={`flex items-center text-gray-700 hover:text-blue-500 w-full ${activeTab === 'medications' ? 'text-blue-500 font-bold' : ''}`}
              >
                <Pill size={20} className="mr-2" />
                Medications
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={() => setActiveTab('vitals')}
                className={`flex items-center text-gray-700 hover:text-blue-500 w-full ${activeTab === 'vitals' ? 'text-blue-500 font-bold' : ''}`}
              >
                <Pill size={20} className="mr-2" />
                Vitals
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={() => setActiveTab('labReports')}
                className={`flex items-center text-gray-700 hover:text-blue-500 w-full ${activeTab === 'labReports' ? 'text-blue-500 font-bold' : ''}`}
              >
                <Pill size={20} className="mr-2" />
                Lab Reports
              </button>
            </li>
          </ul>
        </nav>
        <main className="flex-1">
          {activeTab === 'info' && <PatientInfo patient={patient} />}
          {activeTab === 'appointments' && <Appointments appointments={appointments} />}
          {activeTab === 'medications' && <Medications medications={medications} />}
          {activeTab === 'vitals' && <Vitals vitals={vitals} />}
          {activeTab === 'labReports' && <LabReports labReports={labReports} />}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;