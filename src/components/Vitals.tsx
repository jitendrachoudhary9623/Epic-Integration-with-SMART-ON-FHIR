// vitals/Vitals.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useVitalsData } from '../hooks/vitals/useVitalsData';
import { useVitalSelection } from '../hooks/vitals/useVitalSelection';
import { HealthSummary } from './HealthSummary';
import { VitalChart } from './VitalChart';
import { VitalTabs } from './VitalTabs';
import { Observation } from 'fhir/r4';

interface VitalsProps {
  vitals: Observation[];
  patient: {
    reference: string;
    display: string;
  };
  encounter: {
    reference: string;
    identifier: {
      use: string;
      system: string;
      value: string;
    };
    display: string;
  };
}

const Vitals: React.FC<VitalsProps> = ({ vitals, patient, encounter }) => {
  const { selectedVital, setSelectedVital, timeRange, setTimeRange } = useVitalSelection();
  const { filteredChartData, groupedByDate, groupedByVital } = useVitalsData(vitals, timeRange);

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <HealthSummary groupedByVital={groupedByVital} />
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Vital Signs Trend</h3>
            <div className="flex space-x-4">
              <Select
                value={selectedVital}
                onValueChange={setSelectedVital}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Vital" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(groupedByVital).map((vitalName, index) => (
                    <SelectItem key={index} value={vitalName}>{vitalName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={timeRange}
                onValueChange={setTimeRange}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <VitalChart 
            data={filteredChartData.filter(data => data.vitalName === selectedVital)}
            selectedVital={selectedVital}
          />
        </div>
        <VitalTabs groupedByDate={groupedByDate} groupedByVital={groupedByVital} />
      </CardContent>
    </Card>
  );
};

export default Vitals;