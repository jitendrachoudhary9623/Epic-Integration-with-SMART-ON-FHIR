// vitals/components/HealthSummary.tsx
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { getVitalStatus, renderVitalValue } from '@/utils/vitalUtils';

interface HealthSummaryProps {
  groupedByVital: Record<string, any[]>;
}

export const HealthSummary: React.FC<HealthSummaryProps> = ({ groupedByVital }) => {
  const abnormalVitals = Object.entries(groupedByVital).filter(([name, measurements]) => {
    const latestMeasurement = measurements[0];
    return getVitalStatus(name, latestMeasurement.value) !== 'normal';
  });

  return (
    <Alert className="mb-4">
      <AlertTitle>Health Summary</AlertTitle>
      <AlertDescription>
        {abnormalVitals.length === 0 ? (
          <p>All your vital signs are within normal ranges. Keep up the good work!</p>
        ) : (
          <div>
            <p>The following vital signs require attention:</p>
            <ul>
              {abnormalVitals.map(([name, measurements]) => (
                <li key={name}>
                  {name}: {renderVitalValue(measurements[0])} ({getVitalStatus(name, measurements[0].value)})
                </li>
              ))}
            </ul>
            <p>Consider consulting with your healthcare provider about these readings.</p>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};