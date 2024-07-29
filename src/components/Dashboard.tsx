import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Clock, LogOut } from 'lucide-react';
import Appointments from './Appointments';
import Medications from './Medications';
import Vitals from './Vitals';
import LabReports from './LabReports';
import { logout } from '@/lib/auth';
import { usePatientData } from '@/hooks/usePatientData';
import { useSessionTimer } from '@/hooks/useSessionTimer';
import { tabConfig } from '@/config/tabConfig';
import PatientInfoRenderer from './PatientInfoRenderer';

import DashboardHeader from "./DashboardHeader"
// Import shadcn/ui components
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Encounters from './Encounters';
import Procedure from './Procedure';

const Dashboard = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('appointments');
  const { patient, appointments, medications, vitals, labReports, isLoading, encounters, procedures } = usePatientData();
  const { expiryTime, formatTime } = useSessionTimer();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
        <Card>
          <CardContent>
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">Loading patient data...</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 flex flex-col">
      <DashboardHeader 
        formatTime={formatTime}
        expiryTime={expiryTime}
        handleLogout={handleLogout}
      />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-1/5 p-6 overflow-y-auto">
          <div className="flex items-center justify-center mb-6">
            <div className="w-24 h-24 bg-white rounded-full overflow-hidden flex items-center justify-center shadow-lg">
              <User size={64} className="text-primary" />
            </div>
          </div>
          <PatientInfoRenderer patient={patient} />
        </aside>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white">
          <div className="max-w-full mx-auto px-6 py-8">
            <Card>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    {tabConfig.map((tab) => (
                      <TabsTrigger key={tab.id} value={tab.id}>
                        <tab.icon size={20} className="mr-2" />
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsContent value="appointments">
                    <Appointments appointments={appointments} />
                  </TabsContent>
                  <TabsContent value="medications">
                    <Medications medications={medications} />
                  </TabsContent>
                  <TabsContent value="vitals">
                    <Vitals vitals={vitals} />
                  </TabsContent>
                  <TabsContent value="labReports">
                    <LabReports labReports={labReports} />
                  </TabsContent>
                  <TabsContent value="encounters">
                    <Encounters encounters={encounters} />
                    </TabsContent>
                    <TabsContent value="procedures">
                        <Procedure procedures={procedures} />
                    </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );;
};

export default Dashboard;