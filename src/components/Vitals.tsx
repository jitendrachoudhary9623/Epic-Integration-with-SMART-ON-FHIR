import React, { useState, useMemo } from 'react';
import { Activity, Heart, Thermometer, Weight, Ruler, Droplet, ChevronDown } from 'lucide-react';
import { Observation } from 'fhir/r4';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface VitalsProps {
  vitals: Observation[];
}

const Vitals: React.FC<VitalsProps> = ({ vitals }) => {
  const [selectedVital, setSelectedVital] = useState('bloodPressure');

  const getVitalIcon = (code: string) => {
    switch (code) {
      case '8867-4': return <Heart className="h-5 w-5 text-red-500" />;  // Heart rate
      case '9279-1': return <Activity className="h-5 w-5 text-blue-500" />; // Respiratory rate
      case '8310-5': return <Thermometer className="h-5 w-5 text-orange-500" />; // Body temperature
      case '29463-7': return <Weight className="h-5 w-5 text-green-500" />; // Body weight
      case '8302-2': return <Ruler className="h-5 w-5 text-purple-500" />; // Body height
      case '8480-6': 
      case '8462-4': return <Droplet className="h-5 w-5 text-indigo-500" />; // Blood pressure
      case '2708-6': return <Droplet className="h-5 w-5 text-cyan-500" />; // Oxygen saturation
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getVitalName = (vital: Observation) => {
    return vital.code?.text || 
           vital.code?.coding?.[0]?.display || 
           'Unknown Vital Sign';
  };

  const getVitalValue = (vital: Observation) => {
    if (vital.valueQuantity) {
      return `${vital.valueQuantity.value} ${vital.valueQuantity.unit || ''}`;
    } else if (vital.valueCodeableConcept) {
      return vital.valueCodeableConcept.text || 'N/A';
    } else if (vital.component) {
      // Handle blood pressure
      const systolic = vital.component.find(c => c.code.coding?.[0]?.code === '8480-6');
      const diastolic = vital.component.find(c => c.code.coding?.[0]?.code === '8462-4');
      if (systolic && diastolic) {
        return `${systolic.valueQuantity?.value}/${diastolic.valueQuantity?.value} ${systolic.valueQuantity?.unit || 'mmHg'}`;
      }
    }
    return 'N/A';
  };

  const getInterpretation = (vital: Observation) => {
    if (vital.interpretation && vital.interpretation.length > 0) {
      const code = vital.interpretation[0].coding?.[0]?.code;
      const text = vital.interpretation[0].text || vital.interpretation[0].coding?.[0]?.display;
      let color = 'text-gray-600';
      if (code === 'N') color = 'text-green-600';
      if (code === 'L' || code === 'H') color = 'text-yellow-600';
      if (code === 'LL' || code === 'HH') color = 'text-red-600';
      return <span className={`text-xs font-medium ${color}`}>{text}</span>;
    }
    return null;
  };

  const getReferenceRange = (vital: Observation) => {
    if (vital.referenceRange && vital.referenceRange.length > 0) {
      const range = vital.referenceRange[0];
      if (range.low && range.high) {
        return `${range.low.value} - ${range.high.value} ${range.low.unit || ''}`;
      } else if (range.text) {
        return range.text;
      }
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Invalid date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const chartData = useMemo(() => {
    return vitals.map(vital => {
      const date = new Date(vital.effectiveDateTime || '');
      if (isNaN(date.getTime())) return null;
      const value = vital.valueQuantity?.value;
      const systolic = vital.component?.find(c => c.code.coding?.[0]?.code === '8480-6')?.valueQuantity?.value;
      const diastolic = vital.component?.find(c => c.code.coding?.[0]?.code === '8462-4')?.valueQuantity?.value;
      return {
        date: date.toISOString().split('T')[0],
        value: value,
        systolic: systolic,
        diastolic: diastolic
      };
    }).filter(data => data !== null)
      .sort((a, b) => new Date(a!.date).getTime() - new Date(b!.date).getTime());
  }, [vitals]);

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-blue-500 to-indigo-600">
        <h3 className="text-lg leading-6 font-medium text-white flex items-center">
          <Activity className="mr-2" /> Patient Vitals
        </h3>
      </div>

      
      
      <div className="p-6">


      <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Vital Signs Trend</h4>
            <div className="relative">
              <select
                className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-indigo-500"
                value={selectedVital}
                onChange={(e) => setSelectedVital(e.target.value)}
              >
                <option value="bloodPressure">Blood Pressure</option>
                <option value="heartRate">Heart Rate</option>
                <option value="temperature">Temperature</option>
                <option value="weight">Weight</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              {selectedVital === 'bloodPressure' && (
                <>
                  <Line type="monotone" dataKey="systolic" stroke="#8884d8" name="Systolic" />
                  <Line type="monotone" dataKey="diastolic" stroke="#82ca9d" name="Diastolic" />
                </>
              )}
              {selectedVital !== 'bloodPressure' && (
                <Line type="monotone" dataKey="value" stroke="#8884d8" name={selectedVital} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vitals.map((vital, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {getVitalIcon(vital.code?.coding?.[0]?.code || '')}
                  <h4 className="text-lg font-semibold ml-2">{getVitalName(vital)}</h4>
                </div>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  {vital.status}
                </span>
              </div>
              <p className="text-2xl font-bold text-indigo-600">{getVitalValue(vital)}</p>
              <p className="text-sm text-gray-500 mt-1">
                Recorded: {formatDate(vital.effectiveDateTime || '')}
              </p>
              {getInterpretation(vital) && (
                <p className="text-sm mt-1">
                  Interpretation: {getInterpretation(vital)}
                </p>
              )}
              {getReferenceRange(vital) && (
                <p className="text-xs text-gray-500 mt-1">
                  Reference Range: {getReferenceRange(vital)}
                </p>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Vitals;
