'use client';

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Observation } from 'fhir/r4';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HealthTrendsChartProps {
  vitals: Observation[];
}

const HealthTrendsChart: React.FC<HealthTrendsChartProps> = ({ vitals }) => {
  const chartData = useMemo(() => {
    if (!vitals || vitals.length === 0) return { bloodPressure: [], heartRate: [], temperature: [], weight: [] };

    const bloodPressure: any[] = [];
    const heartRate: any[] = [];
    const temperature: any[] = [];
    const weight: any[] = [];

    vitals.forEach((vital) => {
      const date = vital.effectiveDateTime ? new Date(vital.effectiveDateTime) : new Date();
      const formattedDate = format(date, 'MMM dd');

      // Blood Pressure (systolic/diastolic)
      if (vital.code?.coding?.[0]?.display?.toLowerCase().includes('blood pressure')) {
        const systolic = vital.component?.find(c => c.code?.coding?.[0]?.display?.toLowerCase().includes('systolic'));
        const diastolic = vital.component?.find(c => c.code?.coding?.[0]?.display?.toLowerCase().includes('diastolic'));

        if (systolic && diastolic) {
          bloodPressure.push({
            date: formattedDate,
            systolic: systolic.valueQuantity?.value || 0,
            diastolic: diastolic.valueQuantity?.value || 0,
          });
        }
      }

      // Heart Rate
      if (vital.code?.coding?.[0]?.display?.toLowerCase().includes('heart rate')) {
        heartRate.push({
          date: formattedDate,
          value: vital.valueQuantity?.value || 0,
          unit: vital.valueQuantity?.unit || 'bpm',
        });
      }

      // Temperature
      if (vital.code?.coding?.[0]?.display?.toLowerCase().includes('temperature')) {
        temperature.push({
          date: formattedDate,
          value: vital.valueQuantity?.value || 0,
          unit: vital.valueQuantity?.unit || '°F',
        });
      }

      // Weight
      if (vital.code?.coding?.[0]?.display?.toLowerCase().includes('weight') ||
          vital.code?.coding?.[0]?.display?.toLowerCase().includes('body mass')) {
        weight.push({
          date: formattedDate,
          value: vital.valueQuantity?.value || 0,
          unit: vital.valueQuantity?.unit || 'kg',
        });
      }
    });

    return {
      bloodPressure: bloodPressure.slice(-10).reverse(),
      heartRate: heartRate.slice(-10).reverse(),
      temperature: temperature.slice(-10).reverse(),
      weight: weight.slice(-10).reverse(),
    };
  }, [vitals]);

  const getTrendIndicator = (data: any[]) => {
    if (data.length < 2) return <Minus className="h-4 w-4 text-gray-400" />;
    const latest = data[data.length - 1].value;
    const previous = data[data.length - 2].value;
    if (latest > previous) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (latest < previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value} {entry.payload.unit || ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Health Trends & Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="bloodPressure" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="bloodPressure" className="text-xs sm:text-sm">
              Blood Pressure
            </TabsTrigger>
            <TabsTrigger value="heartRate" className="text-xs sm:text-sm">
              Heart Rate
            </TabsTrigger>
            <TabsTrigger value="temperature" className="text-xs sm:text-sm">
              Temperature
            </TabsTrigger>
            <TabsTrigger value="weight" className="text-xs sm:text-sm">
              Weight
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bloodPressure" className="mt-4">
            {chartData.bloodPressure.length > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-muted-foreground">Trend:</span>
                  {getTrendIndicator(chartData.bloodPressure.map(d => ({ value: d.systolic })))}
                  <span className="text-sm font-semibold">
                    {chartData.bloodPressure[chartData.bloodPressure.length - 1]?.systolic}/
                    {chartData.bloodPressure[chartData.bloodPressure.length - 1]?.diastolic} mmHg
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.bloodPressure}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} name="Systolic" dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} name="Diastolic" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No blood pressure data available
              </div>
            )}
          </TabsContent>

          <TabsContent value="heartRate" className="mt-4">
            {chartData.heartRate.length > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-muted-foreground">Trend:</span>
                  {getTrendIndicator(chartData.heartRate)}
                  <span className="text-sm font-semibold">
                    {chartData.heartRate[chartData.heartRate.length - 1]?.value} {chartData.heartRate[0]?.unit}
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData.heartRate}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} name="Heart Rate" />
                  </AreaChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No heart rate data available
              </div>
            )}
          </TabsContent>

          <TabsContent value="temperature" className="mt-4">
            {chartData.temperature.length > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-muted-foreground">Trend:</span>
                  {getTrendIndicator(chartData.temperature)}
                  <span className="text-sm font-semibold">
                    {chartData.temperature[chartData.temperature.length - 1]?.value} {chartData.temperature[0]?.unit}
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.temperature}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} name="Temperature" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No temperature data available
              </div>
            )}
          </TabsContent>

          <TabsContent value="weight" className="mt-4">
            {chartData.weight.length > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-muted-foreground">Trend:</span>
                  {getTrendIndicator(chartData.weight)}
                  <span className="text-sm font-semibold">
                    {chartData.weight[chartData.weight.length - 1]?.value} {chartData.weight[0]?.unit}
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData.weight}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Weight" />
                  </AreaChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No weight data available
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default HealthTrendsChart;
