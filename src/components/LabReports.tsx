import React, { useState } from 'react';
import { FileText, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Calendar, User, Clock, TestTube } from 'lucide-react';
import { Observation } from 'fhir/r4';

interface LabResultCardProps {
  report: Observation;
}

const LabResultCard: React.FC<LabResultCardProps> = ({ report }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTestName = () => {
    return report.code?.text || 
           report.code?.coding?.[0]?.display || 
           'Unknown Test';
  };

  const getResultValue = () => {
    if (report.valueQuantity) {
      return `${report.valueQuantity.value} ${report.valueQuantity.unit || ''}`;
    } else if (report.valueCodeableConcept) {
      return report.valueCodeableConcept.text || 'N/A';
    } else {
      return 'N/A';
    }
  };

  const getInterpretation = () => {
    if (report.interpretation && report.interpretation.length > 0) {
      const code = report.interpretation[0].coding?.[0]?.code;
      const text = report.interpretation[0].text || report.interpretation[0].coding?.[0]?.display;
      return { code, text };
    }
    return null;
  };

  const getInterpretationColor = (code: string) => {
    switch (code) {
      case 'N': return 'text-green-600';
      case 'L':
      case 'H': return 'text-yellow-600';
      case 'LL':
      case 'HH': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getInterpretationIcon = (code: string) => {
    switch (code) {
      case 'N': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'L':
      case 'H':
      case 'LL':
      case 'HH': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default: return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const interpretation = getInterpretation();

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ease-in-out">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            {interpretation ? getInterpretationIcon(interpretation.code) : <TestTube className="h-5 w-5 text-blue-500" />}
            <h3 className="text-lg font-semibold text-gray-900 ml-2">{getTestName()}</h3>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${report.status === 'final' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {report.status}
          </span>
        </div>
        
        <div className="mt-2 flex items-center justify-between">
          <p className="text-2xl font-bold text-indigo-600">{getResultValue()}</p>
          {interpretation && (
            <p className={`text-sm font-medium ${getInterpretationColor(interpretation.code)}`}>
              {interpretation.text}
            </p>
          )}
        </div>
        
        {report.referenceRange && report.referenceRange.length > 0 && (
          <p className="mt-1 text-sm text-gray-500">
            Reference Range: {report.referenceRange[0].low?.value || ''} - {report.referenceRange[0].high?.value || ''} {report.referenceRange[0].low?.unit || ''}
          </p>
        )}
        
        <div className="mt-4 flex items-center text-sm text-gray-500">
          <Calendar className="h-4 w-4 mr-2" />
          <span>Performed: {formatDate(report.effectiveDateTime || '')}</span>
        </div>
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="mt-4 flex items-center text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
        >
          {isExpanded ? 'Less details' : 'More details'}
          {isExpanded ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
        </button>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 bg-gray-50">
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Information</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <User className="h-4 w-4 mr-2 text-gray-400" />
                Performer: {report.performer?.[0]?.display || 'Not specified'}
              </li>
              <li className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                Issued: {formatDate(report.issued || '')}
              </li>
              <li className="flex items-center">
                <TestTube className="h-4 w-4 mr-2 text-gray-400" />
                Specimen: {report.specimen?.display || 'Not specified'}
              </li>
            </ul>
          </div>
          
          {report.note && report.note.length > 0 && (
            <div className="mt-4 p-2 bg-yellow-50 rounded-md">
              <p className="text-xs text-yellow-800 flex items-start">
                <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                <span>{report.note[0].text}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface LabReportsProps {
  labReports: Observation[];
}

const LabReports: React.FC<LabReportsProps> = ({ labReports }) => {
  return (
    <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-indigo-800 mb-6 flex items-center">
        <TestTube className="mr-2" /> Your Lab Results
      </h2>
      <div className="space-y-6">
        {labReports.length > 0 ? (
          labReports.map((report, index) => (
            <LabResultCard key={index} report={report} />
          ))
        ) : (
          <p className="text-gray-600 text-center py-4">No lab results available</p>
        )}
      </div>
    </div>
  );
};

export default LabReports;