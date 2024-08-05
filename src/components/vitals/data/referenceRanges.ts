// vitals/utils/referenceRanges.ts

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
      low: 36.1, normal: 37, high: 38,
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