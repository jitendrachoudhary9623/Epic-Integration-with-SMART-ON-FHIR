// vitals/hooks/useVitalsData.ts
import { useMemo } from 'react';
import { Observation } from 'fhir/r4';

export const useVitalsData = (vitals: Observation[], timeRange: string) => {
  const chartData = useMemo(() => {
    return vitals.map(vital => {
      const date = new Date(vital.effectiveDateTime || '');
      if (isNaN(date.getTime())) return null;
      let value = vital.valueQuantity?.value;
      let systolic, diastolic, unit;
      if (vital.component) {
        const systolicComponent = vital.component.find(c => c.code.coding?.[0]?.code === '8480-6');
        const diastolicComponent = vital.component.find(c => c.code.coding?.[0]?.code === '8462-4');
        systolic = systolicComponent?.valueQuantity?.value;
        diastolic = diastolicComponent?.valueQuantity?.value;
        unit = systolicComponent?.valueQuantity?.unit || diastolicComponent?.valueQuantity?.unit || 'mmHg';
      } else {
        unit = vital.valueQuantity?.unit || '';
      }
      return {
        date: date.toISOString().split('T')[0],
        value: value,
        systolic: systolic,
        diastolic: diastolic,
        vitalName: getVitalName(vital),
        vitalCode: vital.code?.coding?.[0]?.code,
        unit: unit,
      };
    }).filter(data => data !== null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [vitals]);

  const filteredChartData = useMemo(() => {
    const now = new Date();
    const timeRangeFilter = (date) => {
      const dataDate = new Date(date);
      switch (timeRange) {
        case 'week':
          return now.getTime() - dataDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
        case 'month':
          return now.getTime() - dataDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
        case 'year':
          return now.getTime() - dataDate.getTime() <= 365 * 24 * 60 * 60 * 1000;
        default:
          return true;
      }
    };
    return chartData.filter(data => timeRangeFilter(data.date));
  }, [chartData, timeRange]);

  const groupedByDate = useMemo(() => {
    const grouped = {};
    filteredChartData.forEach(data => {
      if (!grouped[data.date]) {
        grouped[data.date] = [];
      }
      grouped[data.date].push(data);
    });
    return grouped;
  }, [filteredChartData]);

  const groupedByVital = useMemo(() => {
    const grouped = {};
    filteredChartData.forEach(data => {
      if (!grouped[data.vitalName]) {
        grouped[data.vitalName] = [];
      }
      grouped[data.vitalName].push(data);
    });
    return grouped;
  }, [filteredChartData]);

  return { filteredChartData, groupedByDate, groupedByVital };
};

function getVitalName(vital: Observation) {
  return vital.code?.text || 
         vital.code?.coding?.[0]?.display || 
         'Unknown Vital Sign';
}