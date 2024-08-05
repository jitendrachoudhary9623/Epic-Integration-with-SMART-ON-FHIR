import React, { useState } from 'react';
import { Pill, Calendar, Clock, AlertCircle, ChevronDown, ChevronUp, User, Repeat, Package, Hospital } from 'lucide-react';
import { MedicationRequest } from 'fhir/r4';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className="text-lg font-semibold text-blue-700">{getMedicationName()}</span>
          <Badge variant="outline" className={getStatusColor(medication.status || 'unknown')}>
            {medication.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-3">
          Dosage: {medication.dosageInstruction?.[0]?.text || 'No dosage information available'}
        </p>
        
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Clock className="h-4 w-4 mr-2" />
          <span>{medication.dosageInstruction?.[0]?.timing?.code?.text || 'Timing not specified'}</span>
        </div>
        
        {medication.authoredOn && (
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Prescribed: {formatDate(medication.authoredOn)}</span>
          </div>
        )}
        
        <Button 
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)} 
          className="w-full justify-center"
        >
          {isExpanded ? 'Less details' : 'More details'}
          {isExpanded ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
        </Button>
      
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
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
      </CardContent>
    </Card>
  );
};

interface MedicationsProps {
  medications: MedicationRequest[];
}

const Medications: React.FC<MedicationsProps> = ({ medications }) => {
  return (
    <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-blue-800 mb-6 flex items-center">
        <Pill className="mr-2" /> Your Medications
      </h2>
      <ScrollArea className="h-[600px] pr-4">
        {medications.length > 0 ? (
          medications.map((medication, index) => (
            <MedicationCard key={index} medication={medication} />
          ))
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-gray-600">No current medications</p>
            </CardContent>
          </Card>
        )}
      </ScrollArea>
    </div>
  );
};

export default Medications;