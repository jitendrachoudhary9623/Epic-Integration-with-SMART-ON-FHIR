// vitals/components/VitalChart.tsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { referenceRanges } from '../utils/vitalUtils';

interface VitalChartProps {
  data: any[];
  selectedVital: string;
}

export const VitalChart: React.FC<VitalChartProps> = ({ data, selectedVital }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        {selectedVital === 'Blood Pressure' ? (
          <>
            <Line type="monotone" dataKey="systolic" stroke="#8884d8" name="Systolic" />
            <Line type="monotone" dataKey="diastolic" stroke="#82ca9d" name="Diastolic" />
            <ReferenceLine y={referenceRanges['Blood Pressure'].systolic.normal} stroke="green" strokeDasharray="3 3" />
            <ReferenceLine y={referenceRanges['Blood Pressure'].diastolic.normal} stroke="green" strokeDasharray="3 3" />
          </>
        ) : (
          <>
            <Line type="monotone" dataKey="value" stroke="#8884d8" name={selectedVital} />
            <ReferenceLine y={referenceRanges[selectedVital]?.normal} stroke="green" strokeDasharray="3 3" />
          </>
        )}
      </LineChart>
    </ResponsiveContainer>
  );
};