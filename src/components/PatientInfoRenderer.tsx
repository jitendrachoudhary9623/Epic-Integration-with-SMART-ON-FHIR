'use client';

import React from 'react';
import { User, Calendar, Phone, Mail, MapPin } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

interface Patient {
  name?: Name[];
  birthDate?: string;
  gender?: string;
  telecom?: Telecom[];
  address?: Address[];
}

const InfoSection: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div className="flex items-center mb-4">
    <Avatar className="h-9 w-9 mr-3">
      <AvatarFallback className="bg-muted">{icon}</AvatarFallback>
    </Avatar>
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  </div>
);

const PatientInfoRenderer: React.FC<{ patient: Patient }> = ({ patient }) => {
  const formatName = (names: Name[] | undefined): string => {
    if (!names || names.length === 0) return 'N/A';
    const name = names[0];
    return `${name.given?.join(' ')} ${name.family}`.trim();
  };

  const formatAddress = (addresses: Address[] | undefined): string => {
    if (!addresses || addresses.length === 0) return 'N/A';
    const address = addresses[0];
    return `${address.line?.join(', ')}, ${address.city}, ${address.state} ${address.postalCode}, ${address.country}`;
  };

  const getContactInfo = (telecoms: Telecom[] | undefined, system: string): string => {
    const contact = telecoms?.find(t => t.system === system);
    return contact ? contact.value || 'N/A' : 'N/A';
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <InfoSection
          icon={<User className="h-4 w-4" />}
          label="Name"
          value={formatName(patient?.name)}
        />
        <InfoSection
          icon={<Calendar className="h-4 w-4" />}
          label="Date of Birth"
          value={patient?.birthDate || 'N/A'}
        />
        <InfoSection
          icon={<User className="h-4 w-4" />}
          label="Gender"
          value={patient?.gender || 'N/A'}
        />
        <InfoSection
          icon={<Phone className="h-4 w-4" />}
          label="Phone"
          value={getContactInfo(patient?.telecom, 'phone')}
        />
        <InfoSection
          icon={<Mail className="h-4 w-4" />}
          label="Email"
          value={getContactInfo(patient?.telecom, 'email')}
        />
        <InfoSection
          icon={<MapPin className="h-4 w-4" />}
          label="Address"
          value={formatAddress(patient?.address)}
        />
      </CardContent>
    </Card>
  );
};

export default PatientInfoRenderer;