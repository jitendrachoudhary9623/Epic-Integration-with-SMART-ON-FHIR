import React from 'react';
import { Patient, Extension } from 'fhir/r4';
import { MailIcon, PhoneIcon, HomeIcon, UserIcon, GlobeIcon, HeartIcon, IdentificationIcon } from '@heroicons/react/outline';

const PatientInfo = ({ patient }: { patient: Patient }) => {
    const renderExtension = (extension: Extension[] | undefined) => {
        if (!extension) return null;
        return extension.map((ext, index) => {
            const extensionDetails = Object.entries(ext).map(([key, value]) => (
                <div key={key} className="flex justify-between py-1">
                    <span className="font-medium text-gray-700">{key}</span>: <span className="text-gray-500">{JSON.stringify(value, null, 2)}</span>
                </div>
            ));
            return (
                <div key={index} className="bg-gray-100 shadow rounded-lg p-4 mb-4">
                    <h4 className="text-lg font-semibold mb-2 text-gray-800">Extension {index + 1}</h4>
                    <div className="text-sm">{extensionDetails}</div>
                </div>
            );
        });
    };

    const InfoRow = ({ label, value, icon }: { label: string, value: string | undefined, icon: React.ReactNode }) => (
        <div className="flex items-center bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow duration-200 mb-4">
            <div className="flex-shrink-0">
                {icon}
            </div>
            <div className="ml-4">
                <dt className="text-sm font-medium text-gray-500">{label}</dt>
                <dd className="mt-1 text-sm text-gray-900">{value || 'N/A'}</dd>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden p-6 space-y-6">
            <div className="px-6 py-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg shadow-lg text-white">
                <h3 className="text-3xl leading-6 font-semibold">Patient Information</h3>
                <p className="mt-1 text-sm">Detailed patient information with a modern touch.</p>
            </div>
            <div className="space-y-4">
                <InfoRow label="Full Name" value={`${patient.name?.[0]?.given?.join(' ') || ''} ${patient.name?.[0]?.family || ''}`} icon={<UserIcon className="h-6 w-6 text-blue-500" />} />
                <InfoRow label="Date of Birth" value={patient.birthDate} icon={<HeartIcon className="h-6 w-6 text-pink-500" />} />
                <InfoRow label="Gender" value={patient.gender} icon={<UserIcon className="h-6 w-6 text-blue-500" />} />
                <InfoRow label="Address" value={patient.address?.map((address, index) => `${address.line?.join(', ')}, ${address.city}, ${address.state}, ${address.postalCode}, ${address.country}`).join(' | ') || 'N/A'} icon={<HomeIcon className="h-6 w-6 text-green-500" />} />
                <InfoRow label="Phone" value={patient.telecom?.find(t => t.system === 'phone')?.value} icon={<PhoneIcon className="h-6 w-6 text-yellow-500" />} />
                <InfoRow label="Email" value={patient.telecom?.find(t => t.system === 'email')?.value} icon={<MailIcon className="h-6 w-6 text-red-500" />} />
                <InfoRow label="Marital Status" value={patient.maritalStatus?.text} icon={<HeartIcon className="h-6 w-6 text-pink-500" />} />
                <InfoRow label="Language" value={patient.communication?.[0]?.language?.text} icon={<GlobeIcon className="h-6 w-6 text-blue-500" />} />
                <InfoRow label="Identifier" value={patient.identifier?.map((id, index) => `${id.system}: ${id.value}`).join(' | ') || 'N/A'} icon={<IdentificationIcon className="h-6 w-6 text-gray-500" />} />
                <div className="bg-gray-100 p-4 rounded-lg shadow">
                    <dt className="text-sm font-medium text-gray-500 mb-2">Extensions</dt>
                    <dd className="mt-1 text-sm">
                        {renderExtension(patient.extension)}
                    </dd>
                </div>
            </div>
        </div>
    );
};

export default PatientInfo;
