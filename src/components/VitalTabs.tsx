// vitals/components/VitalTabs.tsx
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Calendar, BarChart2 } from 'lucide-react';
import { VitalCard } from './VitalCard';
import { getVitalIcon, getVitalStatus, getTrend } from '../utils/vitalUtils';

interface VitalTabsProps {
  groupedByDate: Record<string, any[]>;
  groupedByVital: Record<string, any[]>;
}

export const VitalTabs: React.FC<VitalTabsProps> = ({ groupedByDate, groupedByVital }) => {
  return (
    <Tabs defaultValue="date-wise" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="date-wise" className="flex items-center"><Calendar className="mr-2" /> Date-wise View</TabsTrigger>
        <TabsTrigger value="vital-wise" className="flex items-center"><BarChart2 className="mr-2" /> Vital-wise View</TabsTrigger>
      </TabsList>
      <TabsContent value="date-wise">
        <Accordion type="single" collapsible className="w-full">
          {Object.entries(groupedByDate).map(([date, vitals], index) => (
            <AccordionItem value={`date-${index}`} key={index}>
              <AccordionTrigger className="text-lg font-semibold">
                {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vitals.map((vital, vitalIndex) => (
                    <VitalCard 
                      key={vitalIndex}
                      vital={vital}
                      trend={getTrend(groupedByVital[vital.vitalName])}
                      status={getVitalStatus(vital.vitalName, vital.value)}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </TabsContent>
      <TabsContent value="vital-wise">
        <Accordion type="single" collapsible className="w-full">
          {Object.entries(groupedByVital).map(([vitalName, measurements], index) => (
            <AccordionItem value={`vital-${index}`} key={index}>
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center space-x-2">
                  {getVitalIcon(measurements[0].vitalCode)}
                  <span>{vitalName}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {measurements.map((measurement, measurementIndex) => (
                    <VitalCard 
                      key={measurementIndex}
                      vital={measurement}
                      trend={getTrend(measurements)}
                      status={getVitalStatus(vitalName, measurement.value)}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </TabsContent>
    </Tabs>
  );
};