import { FileText, Calendar, Pill, Activity } from 'lucide-react';

export const sidebarConfig = [
  {
    id: 'info',
    label: 'Patient Info',
    icon: FileText,
  },
  {
    id: 'appointments',
    label: 'Appointments',
    icon: Calendar,
  },
  {
    id: 'medications',
    label: 'Medications',
    icon: Pill,
  },
  {
    id: 'vitals',
    label: 'Vitals',
    icon: Activity,
  },
  {
    id: 'labReports',
    label: 'Lab Reports',
    icon: FileText,
  },
];