import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { User, Bell, Calendar, Pill, Activity, FileText, Stethoscope, ChevronRight, Plus } from 'lucide-react';
import Appointments from './Appointments';
import Medications from './Medications';
import Vitals from './Vitals';
import LabReports from './LabReports';
import Encounters from './Encounters';
import Procedure from './Procedure';
import { logout } from '@/lib/auth';
import { usePatientData } from '@/hooks/usePatientData';
import { useSessionTimer } from '@/hooks/useSessionTimer';
import { tabConfig } from '@/config/tabConfig';
import PatientInfoRenderer from './PatientInfoRenderer';
import DashboardHeader from "./DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const Shimmer: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 ${className}`} />
);

// Patient info shimmer
const PatientInfoShimmer = () => (
  <div className="space-y-4">
    <Shimmer className="h-16 w-16 rounded-full" />
    <Shimmer className="h-6 w-3/4 rounded" />
    <Shimmer className="h-4 w-1/2 rounded" />
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <Shimmer key={i} className="h-4 w-full rounded" />
      ))}
    </div>
  </div>
);

// Tab content shimmer
const TabContentShimmer = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <Shimmer key={i} className="h-12 w-full rounded" />
    ))}
  </div>
);
const QuickActionCard = ({ icon: Icon, title, description, onClick }) => (
  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
    <CardContent className="flex items-center p-4">
      <Icon className="h-8 w-8 text-primary mr-4" />
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="ml-auto" />
    </CardContent>
  </Card>
);

const HealthSummaryCard = ({ title, value, total, unit, icon: Icon }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <h3 className="font-semibold text-sm">{title}</h3>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value} <span className="text-sm font-normal text-muted-foreground">/ {total} {unit}</span></div>
      <Progress value={(value / total) * 100} className="mt-2" />
    </CardContent>
  </Card>
);

const NotificationCard = ({ title, date, isNew }) => (
  <Card className={`mb-2 ${isNew ? 'bg-primary/5' : ''}`}>
    <CardContent className="p-4 flex items-center">
      <Bell className="h-5 w-5 mr-3 text-primary" />
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm text-muted-foreground">{date}</p>
      </div>
      {isNew && <Badge className="ml-auto">New</Badge>}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const { patient, appointments, medications, vitals, labReports, isLoading, encounters, procedures } = usePatientData();
  const { expiryTime, formatTime } = useSessionTimer();

  const handleLogout = useCallback(() => {
    logout();
    router.push('/');
  }, [router]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  const tabContent = useMemo(() => ({
    overview: (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Welcome back, {patient?.name?.[0]?.given?.[0] || 'Patient'}!</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <HealthSummaryCard title="Steps Today" value={6500} total={10000} unit="steps" icon={Activity} />
          <HealthSummaryCard title="Medications Taken" value={3} total={4} unit="doses" icon={Pill} />
          <HealthSummaryCard title="Appointments This Week" value={2} total={3} unit="" icon={Calendar} />
        </div>
        <h3 className="text-xl font-semibold mt-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickActionCard
            icon={Calendar}
            title="Schedule Appointment"
            description="Book your next visit"
            onClick={() => console.log('Schedule appointment')}
          />
          <QuickActionCard
            icon={Pill}
            title="Refill Medication"
            description="Request a prescription refill"
            onClick={() => console.log('Refill medication')}
          />
          <QuickActionCard
            icon={FileText}
            title="View Lab Results"
            description="Check your recent test results"
            onClick={() => setActiveTab('labReports')}
          />
          <QuickActionCard
            icon={Stethoscope}
            title="Telemedicine"
            description="Start a virtual consultation"
            onClick={() => console.log('Start telemedicine')}
          />
        </div>
      </div>
    ),
    vitals: <Vitals vitals={vitals} />,
    medications: <Medications medications={medications} />,
    labReports: <LabReports labReports={labReports} />,
    procedures: <Procedure procedures={procedures} />,
    appointments: <Appointments appointments={appointments} />,
    encounters: <Encounters encounters={encounters} />,
  }), [vitals, medications, labReports, procedures, appointments, encounters, patient, setActiveTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 flex flex-col">
      <DashboardHeader
        formatTime={formatTime}
        expiryTime={expiryTime}
        handleLogout={handleLogout}
      />
      <div className="flex flex-1 overflow-hidden p-6 space-x-6">
        <aside className="w-1/4 space-y-6">
          <Card>
            <CardContent className="p-6">
              {isLoading ? (
                <PatientInfoShimmer />
              ) : (
                <>
                  <div className="flex items-center space-x-4 mb-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={patient?.photo?.[0]?.url} alt={patient?.name?.[0]?.text} />
                      <AvatarFallback>{patient?.name?.[0]?.given?.[0]?.[0]}{patient?.name?.[0]?.family?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-bold">{patient?.name?.[0]?.text}</h2>
                      <p className="text-sm text-muted-foreground">Patient ID: {patient?.id}</p>
                    </div>
                  </div>
                  <PatientInfoRenderer patient={patient} />
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Recent Notifications</h3>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <NotificationCard title="Appointment Reminder" date="Tomorrow, 10:00 AM" isNew={true} />
                <NotificationCard title="Lab Results Available" date="2 days ago" isNew={false} />
                <NotificationCard title="Medication Refill Due" date="1 week ago" isNew={false} />
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full"><Plus className="mr-2 h-4 w-4" /> Add Reminder</Button>
            </CardFooter>
          </Card>
        </aside>
        <main className="flex-1 overflow-hidden bg-white rounded-lg shadow-lg">
          <Card className="h-full">
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="mb-4">
                  {tabConfig.map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id}>
                      <tab.icon size={20} className="mr-2" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {Object.entries(tabContent).map(([key, content]) => (
                  <TabsContent key={key} value={key}>
                    <ScrollArea className="h-[calc(100vh-12rem)]">
                      {isLoading ? <TabContentShimmer /> : content}
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;