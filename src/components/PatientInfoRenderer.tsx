"use client"
import React, { useState } from 'react';
import { User, Calendar, Phone, Mail, MapPin, Heart, Flag, FileText, Building, AlertCircle, Activity, Clipboard, Plus, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface Name {
  use?: string;
  text?: string;
  family?: string;
  given?: string[];
}

interface Address {
  use?: string;
  type?: string;
  line?: string[];
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface Telecom {
  system?: string;
  value?: string;
  use?: string;
}

interface Identifier {
  use?: string;
  type?: {
    text?: string;
  };
  system?: string;
  value?: string;
}

interface Extension {
  url?: string;
  valueCodeableConcept?: {
    coding?: {
      system?: string;
      code?: string;
      display?: string;
    }[];
  };
  extension?: {
    valueCoding?: {
      system?: string;
      code?: string;
      display?: string;
    };
    valueString?: string;
    url?: string;
  }[];
  valueCode?: string;
}

interface Patient {
  id?: string;
  extension?: Extension[];
  identifier?: Identifier[];
  active?: boolean;
  name?: Name[];
  telecom?: Telecom[];
  gender?: string;
  birthDate?: string;
  deceasedBoolean?: boolean;
  address?: Address[];
  maritalStatus?: {
    text?: string;
  };
  communication?: {
    language?: {
      coding?: {
        system?: string;
        code?: string;
        display?: string;
      }[];
      text?: string;
    };
    preferred?: boolean;
  }[];
  generalPractitioner?: {
    reference?: string;
    type?: string;
    display?: string;
  }[];
  managingOrganization?: {
    reference?: string;
    display?: string;
  };
}

const InfoSection: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; tooltip?: string }> = ({ icon, label, value, tooltip }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex-shrink-0 mr-3 text-blue-500">{icon}</div>
          <div className="flex-grow min-w-0">
            <p className="text-sm text-gray-500 truncate">{label}</p>
            <p className="text-base font-medium truncate">{value}</p>
          </div>
        </div>
      </TooltipTrigger>
      {tooltip && <TooltipContent>{tooltip}</TooltipContent>}
    </Tooltip>
  </TooltipProvider>
);

const HealthStatus: React.FC<{ value: number }> = ({ value }) => (
  <div className="mt-4">
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm font-medium text-gray-700">Health Status</span>
      <span className="text-sm font-medium text-gray-700">{value}%</span>
    </div>
    <Progress value={value} className="w-full h-2" />
  </div>
);

const QuickAction: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <Button
    variant="outline"
    size="sm"
    className="flex items-center space-x-2 w-full justify-start"
    onClick={onClick}
  >
    {icon}
    <span>{label}</span>
  </Button>
);

const PatientInfoRenderer: React.FC<{ patient: Patient }> = ({ patient }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatName = (names: Name[] | undefined): string => {
    if (!names || names.length === 0) return 'N/A';

    // Find the current name (no end date or most recent)
    const currentName = names.find(n => {
      const period = (n as any).period;
      return !period || !period.end;
    }) || names[0];

    const givenNames = currentName.given?.join(' ') || '';
    const familyName = currentName.family || '';
    const suffix = (currentName as any).suffix?.join(' ') || '';

    return `${givenNames} ${familyName} ${suffix}`.trim() || 'N/A';
  };

  const formatAddress = (addresses: Address[] | undefined): string => {
    if (!addresses || addresses.length === 0) return 'N/A';

    // Find current address (no end date or most recent)
    const currentAddress = addresses.find(a => {
      const period = (a as any).period;
      return !period || !period.end;
    }) || addresses[0];

    const parts = [
      currentAddress.line?.join(', '),
      currentAddress.city,
      currentAddress.state,
      currentAddress.postalCode,
      currentAddress.country
    ].filter(Boolean);

    return parts.join(', ') || 'N/A';
  };

  const getContactInfo = (telecoms: Telecom[] | undefined, system: string): string => {
    const contact = telecoms?.find(t => t.system === system);
    return contact ? contact.value || 'N/A' : 'N/A';
  };

  const getLegalSex = (extensions: Extension[] | undefined): string => {
    // Try Epic format first
    let legalSexExt = extensions?.find(ext => ext.url === "http://open.epic.com/FHIR/StructureDefinition/extension/legal-sex");
    if (legalSexExt?.valueCodeableConcept?.coding?.[0]?.display) {
      return legalSexExt.valueCodeableConcept.coding[0].display;
    }

    // Try Athena/US Core birthsex format
    legalSexExt = extensions?.find(ext => ext.url === "http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex");
    if (legalSexExt?.valueCode) {
      const code = legalSexExt.valueCode;
      const sexMap: Record<string, string> = { 'M': 'Male', 'F': 'Female', 'UNK': 'Unknown' };
      return sexMap[code] || code;
    }

    return 'N/A';
  };

  const getRace = (extensions: Extension[] | undefined): string => {
    const raceExt = extensions?.find(ext => ext.url === "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race");
    return raceExt?.extension?.find(ext => ext.url === "text")?.valueString || 'N/A';
  };

  const getEthnicity = (extensions: Extension[] | undefined): string => {
    const ethnicityExt = extensions?.find(ext => ext.url === "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity");
    return ethnicityExt?.extension?.find(ext => ext.url === "text")?.valueString || 'N/A';
  };

  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getHealthStatus = (): number => {
    return Math.floor(Math.random() * 41) + 60; // Random number between 60 and 100
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader className="pb-2 border-b">
        <div className="flex flex-col sm:flex-row items-center sm:space-x-4">
          <Avatar className="h-24 w-24 border-2 border-blue-200 mb-4 sm:mb-0">
            <AvatarImage src="/api/placeholder/200/200" alt={formatName(patient?.name)} />
            <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">{getInitials(formatName(patient?.name))}</AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left flex-grow">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{formatName(patient?.name)}</CardTitle>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-2">
              <Badge variant="secondary" className="text-sm py-1">
                {patient?.gender || 'N/A'}
              </Badge>
              <Badge variant="secondary" className="text-sm py-1">
                {patient?.birthDate || 'N/A'}
              </Badge>
              {patient?.deceasedBoolean && (
                <Badge variant="destructive" className="text-sm py-1">Deceased</Badge>
              )}
            </div>
            <HealthStatus value={getHealthStatus()} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <QuickAction icon={<Clipboard className="h-4 w-4" />} label="View Medical Records" onClick={() => alert('Viewing Medical Records')} />
          <QuickAction icon={<Calendar className="h-4 w-4" />} label="Schedule Appointment" onClick={() => alert('Scheduling Appointment')} />
          <QuickAction icon={<Activity className="h-4 w-4" />} label="Track Vitals" onClick={() => alert('Tracking Vitals')} />
        </div> */}
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="personal-info">
            <AccordionTrigger>Personal Information</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoSection
                  icon={<User className="h-5 w-5" />}
                  label="Legal Sex"
                  value={getLegalSex(patient?.extension)}
                  tooltip="Legal sex as recorded in official documents"
                />
                <InfoSection
                  icon={<Flag className="h-5 w-5" />}
                  label="Race"
                  value={getRace(patient?.extension)}
                />
                <InfoSection
                  icon={<Flag className="h-5 w-5" />}
                  label="Ethnicity"
                  value={getEthnicity(patient?.extension)}
                />
                <InfoSection
                  icon={<Heart className="h-5 w-5" />}
                  label="Marital Status"
                  value={
                    patient?.maritalStatus?.text ||
                    (patient?.maritalStatus as any)?.coding?.[0]?.display ||
                    'N/A'
                  }
                />
                <InfoSection
                  icon={<FileText className="h-5 w-5" />}
                  label="Preferred Language"
                  value={patient?.communication?.[0]?.language?.text || 'N/A'}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="contact-info">
            <AccordionTrigger>Contact Information</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <InfoSection
                  icon={<Phone className="h-5 w-5" />}
                  label="Phone"
                  value={getContactInfo(patient?.telecom, 'phone')}
                />
                <InfoSection
                  icon={<Mail className="h-5 w-5" />}
                  label="Email"
                  value={getContactInfo(patient?.telecom, 'email')}
                />
                <InfoSection
                  icon={<MapPin className="h-5 w-5" />}
                  label="Address"
                  value={formatAddress(patient?.address)}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="healthcare-info">
            <AccordionTrigger>Healthcare Information</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoSection
                  icon={<User className="h-5 w-5" />}
                  label="General Practitioner"
                  value={
                    patient?.generalPractitioner?.[0]?.display ||
                    patient?.generalPractitioner?.[0]?.reference ||
                    'N/A'
                  }
                  tooltip="Your primary care doctor"
                />
                <InfoSection
                  icon={<Building className="h-5 w-5" />}
                  label="Managing Organization"
                  value={patient?.managingOrganization?.display || 'N/A'}
                  tooltip="The healthcare organization managing your care"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {patient?.identifier && patient.identifier.length > 0 && (
            <AccordionItem value="identifiers">
              <AccordionTrigger>Identifiers</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {patient.identifier.map((id, index) => (
                    <InfoSection
                      key={index}
                      icon={<AlertCircle className="h-5 w-5" />}
                      label={id.type?.text || id.system}
                      value={id.value}
                      tooltip="Patient identifier used in the healthcare system"
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        <div className="mt-6 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center"
          >
            {isExpanded ? <Minus className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {isExpanded ? 'Show Less' : 'Show More'}
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Additional Information</h3>
            <p className="text-sm text-gray-600">
              This section can include more detailed information about the patient,
              such as medical history, allergies, current medications, or any other
              relevant data that might be useful for healthcare providers.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientInfoRenderer;