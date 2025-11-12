'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { BarChart3, Table as TableIcon, TrendingUp, AlertCircle, List, Calendar, Activity } from 'lucide-react';
import { Observation } from 'fhir/r4';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import HealthTrendsChart from './HealthTrendsChart';

interface VitalsWithToggleProps {
  vitals: Observation[];
}

type ViewMode = 'table' | 'accordion';

interface VitalReading {
  date: Date;
  dateStr: string;
  bloodPressure?: { systolic: number; diastolic: number };
  heartRate?: number;
  temperature?: number;
  respRate?: number;
  o2Saturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
}

const VitalsWithToggle: React.FC<VitalsWithToggleProps> = ({ vitals }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('accordion');

  // Group vitals by date for accordion view
  const groupedByDate = useMemo(() => {
    if (!vitals || vitals.length === 0) return {};

    const grouped: Record<string, Observation[]> = {};
    vitals.forEach((vital) => {
      const date = vital.effectiveDateTime ? format(parseISO(vital.effectiveDateTime), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(vital);
    });

    return grouped;
  }, [vitals]);

  // Group vitals by type for accordion view
  const groupedByType = useMemo(() => {
    if (!vitals || vitals.length === 0) return {};

    const grouped: Record<string, Observation[]> = {};
    vitals.forEach((vital) => {
      const vitalName = vital.code?.coding?.[0]?.display || 'Unknown';
      if (!grouped[vitalName]) {
        grouped[vitalName] = [];
      }
      grouped[vitalName].push(vital);
    });

    return grouped;
  }, [vitals]);

  const processedVitals = useMemo<VitalReading[]>(() => {
    if (!vitals || vitals.length === 0) return [];

    const vitalsByDate = new Map<string, VitalReading>();

    vitals.forEach((vital) => {
      const date = vital.effectiveDateTime ? parseISO(vital.effectiveDateTime) : new Date();
      const dateKey = format(date, 'yyyy-MM-dd HH:mm:ss');

      if (!vitalsByDate.has(dateKey)) {
        vitalsByDate.set(dateKey, {
          date,
          dateStr: format(date, 'MM/dd/yyyy HH:mm'),
        });
      }

      const reading = vitalsByDate.get(dateKey)!;
      const display = vital.code?.coding?.[0]?.display?.toLowerCase() || '';

      // Blood Pressure
      if (display.includes('blood pressure')) {
        const systolic = vital.component?.find(c =>
          c.code?.coding?.[0]?.display?.toLowerCase().includes('systolic')
        );
        const diastolic = vital.component?.find(c =>
          c.code?.coding?.[0]?.display?.toLowerCase().includes('diastolic')
        );

        if (systolic && diastolic) {
          reading.bloodPressure = {
            systolic: systolic.valueQuantity?.value || 0,
            diastolic: diastolic.valueQuantity?.value || 0,
          };
        }
      }

      // Heart Rate
      if (display.includes('heart rate') || display.includes('pulse')) {
        reading.heartRate = vital.valueQuantity?.value;
      }

      // Temperature
      if (display.includes('temperature')) {
        reading.temperature = vital.valueQuantity?.value;
      }

      // Respiratory Rate
      if (display.includes('respiratory') || display.includes('respiration')) {
        reading.respRate = vital.valueQuantity?.value;
      }

      // O2 Saturation
      if (display.includes('oxygen') || display.includes('saturation')) {
        reading.o2Saturation = vital.valueQuantity?.value;
      }

      // Weight
      if (display.includes('weight') && !display.includes('birth')) {
        reading.weight = vital.valueQuantity?.value;
      }

      // Height
      if (display.includes('height') || display.includes('body height')) {
        reading.height = vital.valueQuantity?.value;
      }

      // BMI
      if (display.includes('bmi') || display.includes('body mass')) {
        reading.bmi = vital.valueQuantity?.value;
      }
    });

    return Array.from(vitalsByDate.values())
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 20);
  }, [vitals]);

  const isAbnormal = (type: string, value: number) => {
    switch (type) {
      case 'systolic':
        return value < 90 || value > 140;
      case 'diastolic':
        return value < 60 || value > 90;
      case 'heartRate':
        return value < 60 || value > 100;
      case 'temperature':
        return value < 36.1 || value > 37.2;
      case 'respRate':
        return value < 12 || value > 20;
      case 'o2Saturation':
        return value < 95;
      case 'bmi':
        return value < 18.5 || value > 30;
      default:
        return false;
    }
  };

  const getCellClassName = (isAbnormal: boolean) => {
    return isAbnormal
      ? 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200 font-semibold'
      : '';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Complete Vitals History
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs mr-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Critical</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>High</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Low</span>
              </div>
            </div>
            <Button
              variant={viewMode === 'accordion' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('accordion')}
            >
              <List className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">List</span>
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <TableIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Table</span>
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Hover over values for detailed information and normal ranges
        </p>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {viewMode === 'accordion' ? (
            <motion.div
              key="accordion"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Tabs defaultValue="date-wise" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="date-wise" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="hidden sm:inline">Date-wise View</span>
                    <span className="sm:hidden">By Date</span>
                  </TabsTrigger>
                  <TabsTrigger value="vital-wise" className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <span className="hidden sm:inline">Vital-wise View</span>
                    <span className="sm:hidden">By Type</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="date-wise">
                  <Accordion type="single" collapsible className="w-full">
                    {Object.entries(groupedByDate)
                      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                      .map(([date, dateVitals], index) => (
                        <AccordionItem value={`date-${index}`} key={index}>
                          <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                              <Badge variant="outline" className="ml-2">{dateVitals.length}</Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pt-2">
                              {dateVitals.map((vital, vitalIndex) => (
                                <div key={vitalIndex} className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-semibold">{vital.code?.coding?.[0]?.display || 'Vital Sign'}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {vital.effectiveDateTime && format(parseISO(vital.effectiveDateTime), 'HH:mm:ss')}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-lg font-bold">
                                        {vital.valueQuantity?.value} {vital.valueQuantity?.unit}
                                      </p>
                                      {vital.component && (
                                        <p className="text-sm text-muted-foreground">
                                          {vital.component.map(c => `${c.valueQuantity?.value} ${c.valueQuantity?.unit}`).join(' / ')}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                  </Accordion>
                </TabsContent>

                <TabsContent value="vital-wise">
                  <Accordion type="single" collapsible className="w-full">
                    {Object.entries(groupedByType).map(([vitalName, typeVitals], index) => (
                      <AccordionItem value={`vital-${index}`} key={index}>
                        <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            {vitalName}
                            <Badge variant="outline" className="ml-2">{typeVitals.length}</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pt-2">
                            {typeVitals
                              .sort((a, b) => {
                                const dateA = a.effectiveDateTime ? new Date(a.effectiveDateTime) : new Date();
                                const dateB = b.effectiveDateTime ? new Date(b.effectiveDateTime) : new Date();
                                return dateB.getTime() - dateA.getTime();
                              })
                              .map((vital, vitalIndex) => (
                                <div key={vitalIndex} className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm text-muted-foreground">
                                        {vital.effectiveDateTime && format(parseISO(vital.effectiveDateTime), 'MM/dd/yyyy HH:mm:ss')}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-lg font-bold">
                                        {vital.valueQuantity?.value} {vital.valueQuantity?.unit}
                                      </p>
                                      {vital.component && (
                                        <p className="text-sm text-muted-foreground">
                                          {vital.component.map(c => `${c.valueQuantity?.value} ${c.valueQuantity?.unit}`).join(' / ')}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </TabsContent>
              </Tabs>
            </motion.div>
          ) : viewMode === 'table' ? (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="overflow-x-auto"
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="min-w-[140px] font-semibold">Date & Time</TableHead>
                    <TableHead className="text-center font-semibold">Blood Pressure</TableHead>
                    <TableHead className="text-center font-semibold">Heart Rate</TableHead>
                    <TableHead className="text-center font-semibold">Temperature</TableHead>
                    <TableHead className="text-center font-semibold">Resp. Rate</TableHead>
                    <TableHead className="text-center font-semibold">O2 Saturation</TableHead>
                    <TableHead className="text-center font-semibold">Weight</TableHead>
                    <TableHead className="text-center font-semibold">Height</TableHead>
                    <TableHead className="text-center font-semibold">BMI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedVitals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No vital signs data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    processedVitals.map((reading, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b hover:bg-muted/30"
                      >
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="font-semibold">{format(reading.date, 'MM/dd/yyyy')}</span>
                            <span className="text-xs text-muted-foreground">{format(reading.date, 'HH:mm:ss')}</span>
                          </div>
                        </TableCell>
                        <TableCell
                          className={`text-center ${reading.bloodPressure && (
                            isAbnormal('systolic', reading.bloodPressure.systolic) ||
                            isAbnormal('diastolic', reading.bloodPressure.diastolic)
                          ) ? getCellClassName(true) : ''}`}
                        >
                          {reading.bloodPressure
                            ? `${reading.bloodPressure.systolic}/${reading.bloodPressure.diastolic}`
                            : '-'}
                        </TableCell>
                        <TableCell
                          className={`text-center ${reading.heartRate && isAbnormal('heartRate', reading.heartRate) ? getCellClassName(true) : ''}`}
                        >
                          {reading.heartRate || '-'}
                        </TableCell>
                        <TableCell
                          className={`text-center ${reading.temperature && isAbnormal('temperature', reading.temperature) ? getCellClassName(true) : ''}`}
                        >
                          {reading.temperature || '-'}
                        </TableCell>
                        <TableCell
                          className={`text-center ${reading.respRate && isAbnormal('respRate', reading.respRate) ? getCellClassName(true) : ''}`}
                        >
                          {reading.respRate || '-'}
                        </TableCell>
                        <TableCell
                          className={`text-center ${reading.o2Saturation && isAbnormal('o2Saturation', reading.o2Saturation) ? getCellClassName(true) : ''}`}
                        >
                          {reading.o2Saturation || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {reading.weight || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {reading.height || '-'}
                        </TableCell>
                        <TableCell
                          className={`text-center ${reading.bmi && isAbnormal('bmi', reading.bmi) ? getCellClassName(true) : ''}`}
                        >
                          {reading.bmi || '-'}
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default VitalsWithToggle;
