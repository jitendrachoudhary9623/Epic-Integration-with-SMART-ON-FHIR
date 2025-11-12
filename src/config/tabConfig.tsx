import { Calendar, Pill, Activity, FileText, Clock, TrendingUp } from 'lucide-react';

export const tabConfig = [
  {
    id: 'overview',
    label: 'Summary',
    icon: TrendingUp,
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: Clock,
  },
  {
    id: 'vitals',
    label: 'Vitals',
    icon: Activity,
  },
  {
    id: 'medications',
    label: 'Medications',
    icon: Pill,
  },
  {
    id: 'appointments',
    label: 'Appointments',
    icon: Calendar,
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