import { Heart, Thermometer, Activity, Weight, Ruler, Droplet, Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const referenceRanges = {
    'Blood Pressure': {
      systolic: { low: 90, normal: 120, high: 140 },
      diastolic: { low: 60, normal: 80, high: 90 },
      unit: 'mmHg',
      insights: {
        low: 'Low blood pressure may cause dizziness or fainting. Consider increasing salt intake and staying hydrated.',
        normal: 'Your blood pressure is within a healthy range. Maintain a balanced diet and regular exercise.',
        high: 'High blood pressure increases risk of heart disease and stroke. Consider reducing salt intake and increasing physical activity.'
      }
    },
    'Heart Rate': {
      low: 60, normal: 80, high: 100,
      unit: 'bpm',
      insights: {
        low: 'A low heart rate may indicate excellent cardiovascular fitness or an underlying condition. Consult your doctor if you experience symptoms.',
        normal: 'Your heart rate is within a normal range. Regular aerobic exercise can help maintain a healthy heart rate.',
        high: 'An elevated heart rate may indicate stress, physical exertion, or an underlying condition. Monitor your stress levels and consult your doctor if persistent.'
      }
    },
    'Body Temperature': {
      low: 35, normal: 37.2, high: 38,
      unit: '°C',
      insights: {
        low: 'A low body temperature may indicate hypothermia. Warm up gradually and seek medical attention if symptoms persist.',
        normal: 'Your body temperature is within a normal range. This is a good sign of overall health.',
        high: 'An elevated temperature may indicate fever or infection. Rest, stay hydrated, and consult a doctor if it persists or is accompanied by other symptoms.'
      }
    },
    'Respiratory Rate': {
      low: 12, normal: 16, high: 20,
      unit: 'breaths/min',
      insights: {
        low: 'A low respiratory rate may indicate respiratory depression. Practice deep breathing exercises and consult a doctor if accompanied by other symptoms.',
        normal: 'Your respiratory rate is within a normal range. Regular exercise can help maintain healthy lung function.',
        high: 'An elevated respiratory rate may indicate respiratory distress or anxiety. Practice calm breathing and seek medical attention if accompanied by difficulty breathing.'
      }
    },
    'Oxygen Saturation': {
      low: 95, normal: 98, high: 100,
      unit: '%',
      insights: {
        low: 'Low oxygen saturation may indicate respiratory issues. Practice deep breathing exercises and consult a doctor if it persists.',
        normal: 'Your oxygen saturation is within a healthy range. Regular cardiovascular exercise can help maintain good oxygen levels.',
        high: 'Oxygen saturation is optimal. Continue with your current health practices.'
      }
    },
    'Weight': {
      unit: 'kg',
      insights: {
        trend: 'Monitor your weight trend. Sudden changes may indicate fluid retention or loss, or changes in diet and exercise habits.'
      }
    },
    'BMI': {
      low: 18.5, normal: 24.9, high: 29.9,
      unit: 'kg/m²',
      insights: {
        low: 'A low BMI may indicate underweight. Consider consulting a nutritionist for a balanced diet plan.',
        normal: 'Your BMI is within a healthy range. Maintain a balanced diet and regular exercise routine.',
        high: 'An elevated BMI may indicate overweight or obesity. Consider increasing physical activity and consulting a nutritionist for dietary advice.'
      }
    },
  };

export const getVitalIcon = (code: string) => {
  switch (code) {
    case '8867-4': return <Heart className="h-6 w-6 text-red-500" />;
    case '8310-5': return <Thermometer className="h-6 w-6 text-orange-500" />;
    case '9279-1': return <Activity className="h-6 w-6 text-blue-500" />;
    case '29463-7': return <Weight className="h-6 w-6 text-green-500" />;
    case '8302-2': return <Ruler className="h-6 w-6 text-purple-500" />;
    case '8480-6': 
    case '8462-4': return <Droplet className="h-6 w-6 text-indigo-500" />;
    case '2708-6': return <Droplet className="h-6 w-6 text-cyan-500" />;
    case '39156-5': return <Brain className="h-6 w-6 text-pink-500" />;
    default: return <Activity className="h-6 w-6 text-gray-500" />;
  }
};

export const formatDate = (dateString: string) => {
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

export const getVitalStatus = (vitalName, value) => {
  const range = referenceRanges[vitalName];
  if (!range) return 'unknown';

  if (vitalName === 'Blood Pressure') {
    let systolic, diastolic;
    if (typeof value === 'string') {
      [systolic, diastolic] = value.split('/').map(v => parseFloat(v));
    } else if (typeof value === 'object') {
      systolic = value.systolic;
      diastolic = value.diastolic;
    }

    if (isNaN(systolic) || isNaN(diastolic)) return 'unknown';

    if (systolic < range.systolic.low || diastolic < range.diastolic.low) return 'low';
    if (systolic > range.systolic.high || diastolic > range.diastolic.high) return 'high';
    return 'normal';
  }

  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) return 'unknown';
  
  if (numericValue < range.low) return 'low';
  if (numericValue > range.high) return 'high';
  return 'normal';
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'low': return 'text-blue-600';
    case 'normal': return 'text-green-600';
    case 'high': return 'text-red-600';
    default: return 'text-gray-600';
  }
};


  export const getReferenceRange = (vitalName) => {
    const range = referenceRanges[vitalName];
    if (!range) return 'N/A';
    if (vitalName === 'Blood Pressure') {
      return `${range.systolic.normal}/${range.diastolic.normal} ${range.unit}`;
    }
    return `${range.low} - ${range.high} ${range.unit}`;
  };

export const getInsight = (vitalName, status) => {
  const range = referenceRanges[vitalName];
  return range?.insights[status] || 'No specific insight available.';
};

export const renderVitalValue = (vital) => {
  if (vital.vitalName === 'Blood Pressure') {
    return `${vital.systolic || 'N/A'}/${vital.diastolic || 'N/A'} ${vital.unit}`;
  } else {
    return `${vital.value || 'N/A'} ${vital.unit}`;
  }
};



export const getTrend = (measurements) => {
  if (measurements.length < 2) return 'stable';
  const latestValue = measurements[measurements.length - 1].value;
  const previousValue = measurements[measurements.length - 2].value;
  if (latestValue > previousValue) return 'increasing';
  if (latestValue < previousValue) return 'decreasing';
  return 'stable';
};

export const getTrendIcon = (trend) => {
  switch (trend) {
    case 'increasing': return <TrendingUp className="h-5 w-5 text-red-500" />;
    case 'decreasing': return <TrendingDown className="h-5 w-5 text-green-500" />;
    default: return <Minus className="h-5 w-5 text-gray-500" />;
  }
};