// vitals/hooks/useVitalSelection.ts
import { useState } from 'react';

export const useVitalSelection = (initialVital: string = 'Blood Pressure') => {
  const [selectedVital, setSelectedVital] = useState(initialVital);
  const [timeRange, setTimeRange] = useState('all');

  return {
    selectedVital,
    setSelectedVital,
    timeRange,
    setTimeRange,
  };
};