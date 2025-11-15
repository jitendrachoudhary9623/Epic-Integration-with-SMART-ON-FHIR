/**
 * Dashboard Component - Refactored with FHIR SDK
 *
 * This replaces usePatientData hook with the SDK's useFHIR hook.
 * All data fetching, token management, and error handling is automatic!
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Bell, Calendar, Pill, Activity, FileText, Stethoscope, ChevronRight, Plus } from 'lucide-react';
import Appointments from './Appointments';
import Medications from './Medications';
import Vitals from './Vitals';
import VitalsWithToggle from './VitalsWithToggle';
import LabReports from './LabReports';
import Encounters from './Encounters';
import Procedure from './Procedure';
import HealthTrendsChart from './HealthTrendsChart';
import MedicalTimeline from './MedicalTimeline';
import HealthInsights from './HealthInsights';
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
import { motion } from 'framer-motion';
import { useFHIR } from '@nirmiteeio/fhir-sdk';

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

  // Get provider ID from storage
  const [providerId, setProviderId] = useState<string>('');

  useEffect(() => {
    const savedProviderId = localStorage.getItem('selected_provider_id') || 'epic';
    setProviderId(savedProviderId);
  }, []);

  // 🎉 ONE HOOK TO RULE THEM ALL! 🎉
  // This replaces: usePatientData, useFetchPatientData, useAuth, all API calls!
  const {
    // Auth
    isAuthenticated,
    isAuthLoading,
    logout: sdkLogout,

    // All patient data - automatically fetched!
    patient,
    medications,
    vitals,
    labReports,
    appointments,
    encounters,
    procedures,

    // Loading and errors
    isDataLoading,
    errors,
    refetch,
  } = useFHIR(providerId || 'epic');

  // Session timer - calculate from token expiry
  const [expiryTime, setExpiryTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const tokenExpiry = localStorage.getItem('fhir_sdk_token_expiry');
    if (tokenExpiry) {
      setExpiryTime(parseInt(tokenExpiry, 10));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!expiryTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = expiryTime - now;

      if (diff <= 0) {
        setTimeLeft('Session expired');
        handleLogout();
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryTime]);

  const handleLogout = useCallback(async () => {
    await sdkLogout();
    router.push('/');
  }, [sdkLogout, router]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  const formatTime = useCallback(() => timeLeft, [timeLeft]);

  const tabContent = useMemo(() => ({
    overview: (
      <div className="space-y-4 sm:space-y-6">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl sm:text-2xl font-bold"
        >
          Welcome back, {patient?.name?.[0]?.given?.[0] || 'Patient'}!
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[
            { title: "Steps Today", value: 6500, total: 10000, unit: "steps", icon: Activity },
            { title: "Medications Taken", value: 3, total: 4, unit: "doses", icon: Pill },
            { title: "Appointments This Week", value: 2, total: 3, unit: "", icon: Calendar }
          ].map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <HealthSummaryCard {...card} />
            </motion.div>
          ))}
        </div>

        {/* AI Health Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <HealthInsights
            vitals={vitals}
            medications={medications}
            labReports={labReports}
            encounters={encounters}
          />
        </motion.div>

        {/* Health Trends Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <HealthTrendsChart vitals={vitals} />
        </motion.div>

        <h3 className="text-lg sm:text-xl font-semibold mt-4 sm:mt-6">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {[
            { icon: Calendar, title: "Schedule Appointment", description: "Book your next visit", action: () => console.log('Schedule appointment') },
            { icon: Pill, title: "Refill Medication", description: "Request a prescription refill", action: () => console.log('Refill medication') },
            { icon: FileText, title: "View Lab Results", description: "Check your recent test results", action: () => setActiveTab('labReports') },
            { icon: Stethoscope, title: "Telemedicine", description: "Start a virtual consultation", action: () => console.log('Start telemedicine') }
          ].map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <QuickActionCard
                icon={action.icon}
                title={action.title}
                description={action.description}
                onClick={action.action}
              />
            </motion.div>
          ))}
        </div>

        {/* Show errors if any */}
        {Object.keys(errors).length > 0 && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Some data couldn't be loaded:</h3>
              <ul className="text-sm text-yellow-700">
                {Object.entries(errors).map(([key, msg]) => (
                  <li key={key}>• {key}: {msg}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    ),
    vitals: (
      <>
        <HealthTrendsChart vitals={vitals} />
        <div className="mt-6">
          <VitalsWithToggle vitals={vitals} />
        </div>
      </>
    ),
    medications: <Medications medications={medications} />,
    labReports: <LabReports labReports={labReports} />,
    procedures: <Procedure procedures={procedures} />,
    appointments: <Appointments appointments={appointments} />,
    encounters: <Encounters encounters={encounters} />,
    timeline: (
      <MedicalTimeline
        medications={medications}
        vitals={vitals}
        labReports={labReports}
        appointments={appointments}
        encounters={encounters}
        procedures={procedures}
      />
    ),
  }), [vitals, medications, labReports, procedures, appointments, encounters, patient, setActiveTab, errors]);

  // Show loading if auth is being checked
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-16 w-16 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col transition-colors duration-300">
      <DashboardHeader
        formatTime={formatTime}
        expiryTime={expiryTime}
        handleLogout={handleLogout}
      />
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden p-3 sm:p-6 gap-4 sm:gap-6">
        <aside className="w-full lg:w-1/4 space-y-4 sm:space-y-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              {isDataLoading ? (
                <PatientInfoShimmer />
              ) : (
                <>
                  <div className="flex items-center space-x-3 sm:space-x-4 mb-4">
                    <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                      <AvatarImage src={patient?.photo?.[0]?.url} alt={patient?.name?.[0]?.text} />
                      <AvatarFallback>{patient?.name?.[0]?.given?.[0]?.[0]}{patient?.name?.[0]?.family?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold truncate">{patient?.name?.[0]?.text}</h2>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">Patient ID: {patient?.id}</p>
                    </div>
                  </div>
                  <PatientInfoRenderer patient={patient} />
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => refetch()}
                  >
                    Refresh Data
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="hidden lg:block">
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
        <main className="flex-1 overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full transition-colors duration-300">
          <Card className="h-full">
            <CardContent className="p-3 sm:p-6">
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="mb-4 w-full overflow-x-auto flex-nowrap justify-start">
                  {tabConfig.map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id} className="whitespace-nowrap flex-shrink-0">
                      <tab.icon size={16} className="sm:mr-2" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                {Object.entries(tabContent).map(([key, content]) => (
                  <TabsContent key={key} value={key}>
                    <ScrollArea className="h-[calc(100vh-16rem)] sm:h-[calc(100vh-12rem)]">
                      {isDataLoading ? <TabContentShimmer /> : content}
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
