import { Calendar, Pill, Activity, FileText } from 'lucide-react';

export const tabConfig = [
  {
    id: 'overview',
    label: 'Summary',
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
    {
        id: 'encounters',
        label: 'Encounters',
        icon: FileText,
    },
    {
        id: 'procedures',
        label: 'Procedures',
        icon: FileText,
    },
];