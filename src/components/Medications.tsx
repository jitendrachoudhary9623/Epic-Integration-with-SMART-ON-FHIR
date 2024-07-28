import React, { useState } from 'react';
import { Pill, Calendar, Clock, AlertCircle, ChevronDown, ChevronUp, User, Repeat, Package, Hospital } from 'lucide-react';
import { MedicationRequest } from 'fhir/r4';

interface MedicationCardProps {
  medication: MedicationRequest;
}

const MedicationCard: React.FC<MedicationCardProps> = ({ medication }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getMedicationName = () => {
    if (medication.medicationCodeableConcept) {
      return medication.medicationCodeableConcept.text || 
             medication.medicationCodeableConcept.coding?.[0]?.display ||
             'Unnamed Medication';
    } else if (medication.medicationReference) {
      return medication.medicationReference.display || 'Unnamed Medication';
    }
    return 'Unnamed Medication';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ease-in-out">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-indigo-600">{getMedicationName()}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {medication.dosageInstruction?.[0]?.text || 'No dosage information available'}
            </p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(medication.status || 'unknown')}`}>
            {medication.status}
          </span>
        </div>
        
        <div className="mt-4 flex items-center text-sm text-gray-500">
          <Clock className="h-4 w-4 mr-2" />
          <span>{medication.dosageInstruction?.[0]?.timing?.code?.text || 'Timing not specified'}</span>
        </div>
        
        {medication.authoredOn && (
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Prescribed: {formatDate(medication.authoredOn)}</span>
          </div>
        )}
        
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
                Requester: {medication.requester?.display || 'Not specified'}
              </li>
              <li className="flex items-center">
                <Hospital className="h-4 w-4 mr-2 text-gray-400" />
                Category: {medication.category?.[0]?.text || 'Not specified'}
              </li>
              <li className="flex items-center">
                <Repeat className="h-4 w-4 mr-2 text-gray-400" />
                Repeats: {medication.dispenseRequest?.numberOfRepeatsAllowed || 'Not specified'}
              </li>
              <li className="flex items-center">
                <Package className="h-4 w-4 mr-2 text-gray-400" />
                Quantity: {medication.dispenseRequest?.quantity?.value} {medication.dispenseRequest?.quantity?.unit}
              </li>
            </ul>
          </div>
          
          {medication.reasonCode && medication.reasonCode.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Reason for Medication</h4>
              <p className="text-sm text-gray-600">{medication.reasonCode[0].text}</p>
            </div>
          )}
          
          {medication.note && medication.note.length > 0 && (
            <div className="mt-4 p-2 bg-yellow-50 rounded-md">
              <p className="text-xs text-yellow-800 flex items-start">
                <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                <span>{medication.note[0].text}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface MedicationsProps {
  medications: MedicationRequest[];
}

const Medications: React.FC<MedicationsProps> = ({ medications }) => {
  return (
    <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-indigo-800 mb-6 flex items-center">
        <Pill className="mr-2" /> Your Medications
      </h2>
      <div className="space-y-6">
        {medications.length > 0 ? (
          medications.map((medication, index) => (
            <MedicationCard key={index} medication={medication} />
          ))
        ) : (
          <p className="text-gray-600 text-center py-4">No current medications</p>
        )}
      </div>
    </div>
  );
};

export default Medications;