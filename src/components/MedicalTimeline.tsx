'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Pill, Activity, FileText, Stethoscope, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';

interface TimelineEvent {
  id: string;
  type: 'medication' | 'vital' | 'lab' | 'appointment' | 'encounter' | 'procedure';
  title: string;
  description: string;
  date: Date;
  status?: string;
}

interface MedicalTimelineProps {
  medications: any[];
  vitals: any[];
  labReports: any[];
  appointments: any[];
  encounters: any[];
  procedures: any[];
}

const MedicalTimeline: React.FC<MedicalTimelineProps> = ({
  medications,
  vitals,
  labReports,
  appointments,
  encounters,
  procedures,
}) => {
  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [];

    // Add medications
    if (Array.isArray(medications)) {
      medications.forEach((med) => {
        events.push({
          id: `med-${med.id}`,
          type: 'medication',
          title: med.medicationCodeableConcept?.text || med.medicationCodeableConcept?.coding?.[0]?.display || 'Medication',
          description: `Status: ${med.status}`,
          date: med.authoredOn ? parseISO(med.authoredOn) : new Date(),
          status: med.status,
        });
      });
    }

    // Add vitals
    if (Array.isArray(vitals)) {
      vitals.slice(0, 5).forEach((vital) => {
        events.push({
          id: `vital-${vital.id}`,
          type: 'vital',
          title: vital.code?.coding?.[0]?.display || 'Vital Sign',
          description: `${vital.valueQuantity?.value} ${vital.valueQuantity?.unit || ''}`,
          date: vital.effectiveDateTime ? parseISO(vital.effectiveDateTime) : new Date(),
        });
      });
    }

    // Add appointments
    if (Array.isArray(appointments)) {
      appointments.forEach((apt) => {
        events.push({
          id: `apt-${apt.id}`,
          type: 'appointment',
          title: apt.appointmentType?.text || 'Appointment',
          description: apt.description || 'Scheduled appointment',
          date: apt.start ? parseISO(apt.start) : new Date(),
          status: apt.status,
        });
      });
    }

    // Add encounters
    if (Array.isArray(encounters)) {
      encounters.slice(0, 5).forEach((enc) => {
        events.push({
          id: `enc-${enc.id}`,
          type: 'encounter',
          title: enc.type?.[0]?.text || enc.class?.display || 'Encounter',
          description: enc.reasonCode?.[0]?.text || `Status: ${enc.status}`,
          date: enc.period?.start ? parseISO(enc.period.start) : new Date(),
          status: enc.status,
        });
      });
    }

    // Add procedures
    if (Array.isArray(procedures)) {
      procedures.slice(0, 5).forEach((proc) => {
        events.push({
          id: `proc-${proc.id}`,
          type: 'procedure',
          title: proc.code?.text || proc.code?.coding?.[0]?.display || 'Procedure',
          description: `Status: ${proc.status}`,
          date: proc.performedDateTime ? parseISO(proc.performedDateTime) : (proc.performedPeriod?.start ? parseISO(proc.performedPeriod.start) : new Date()),
          status: proc.status,
        });
      });
    }

    // Sort by date (most recent first)
    return events.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 20);
  }, [medications, vitals, labReports, appointments, encounters, procedures]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'medication':
        return <Pill className="h-4 w-4" />;
      case 'vital':
        return <Activity className="h-4 w-4" />;
      case 'lab':
        return <FileText className="h-4 w-4" />;
      case 'appointment':
        return <Calendar className="h-4 w-4" />;
      case 'encounter':
        return <Stethoscope className="h-4 w-4" />;
      case 'procedure':
        return <FileText className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'medication':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'vital':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'lab':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'appointment':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'encounter':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'procedure':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Medical Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[17px] top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

            {timelineEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative flex gap-4 pb-6"
              >
                {/* Icon circle */}
                <div className={`relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-white dark:border-gray-900 ${getColor(event.type)}`}>
                  {getIcon(event.type)}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1 pt-0.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm">{event.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(event.date, 'PPp')}
                  </p>
                  {event.status && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      {event.status}
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}

            {timelineEvents.length === 0 && (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                No medical history available
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MedicalTimeline;
