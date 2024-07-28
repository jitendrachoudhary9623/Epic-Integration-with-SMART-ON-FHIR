import React from 'react';
import { Patient, Extension } from 'fhir/r4';
import { MailIcon, PhoneIcon, HomeIcon, UserIcon, GlobeIcon, HeartIcon } from '@heroicons/react/outline';

const PatientInfo = ({ patient }: { patient: Patient }) => {

    const renderExtension = (extension: Extension[] | undefined) => {
        if (!extension) return null;
        return extension.map((ext, index) => {
            const extensionDetails = Object.entries(ext).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                    <span className="font-medium">{key}</span>: <span>{JSON.stringify(value, null, 2)}</span>
                </div>
            ));
            return (
                <div key={index} className="bg-white shadow sm:rounded-lg p-4 mb-4">
                    <h4 className="text-lg font-semibold mb-2">Extension {index + 1}</h4>
                    <div className="text-sm text-gray-700">{extensionDetails}</div>
                </div>
            );
        });
    };

    const InfoRow = ({ label, value, icon }: { label: string, value: string | undefined, icon: React.ReactNode }) => (
        <div className="flex items-center bg-gray-50 px-4 py-5 sm:px-6">
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
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-8 bg-gradient-to-r from-blue-600 to-indigo-600">
                <h3 className="text-2xl leading-6 font-semibold text-white">Patient Information</h3>
                <p className="mt-1 text-sm text-blue-200">Detailed patient information with a professional touch.</p>
            </div>
            <div className="border-t border-gray-200">
                <dl className="divide-y divide-gray-200">
                    <InfoRow label="Full Name" value={`${patient.name?.[0]?.given?.join(' ') || ''} ${patient.name?.[0]?.family || ''}`} icon={<UserIcon className="h-6 w-6 text-gray-400" />} />
                    <InfoRow label="Date of Birth" value={patient.birthDate} icon={<HeartIcon className="h-6 w-6 text-gray-400" />} />
                    <InfoRow label="Gender" value={patient.gender} icon={<UserIcon className="h-6 w-6 text-gray-400" />} />
                    <InfoRow label="Address" value={patient.address?.map((address, index) => `${address.line?.join(', ')}, ${address.city}, ${address.state}, ${address.postalCode}, ${address.country}`).join(' | ') || 'N/A'} icon={<HomeIcon className="h-6 w-6 text-gray-400" />} />
                    <InfoRow label="Phone" value={patient.telecom?.find(t => t.system === 'phone')?.value} icon={<PhoneIcon className="h-6 w-6 text-gray-400" />} />
                    <InfoRow label="Email" value={patient.telecom?.find(t => t.system === 'email')?.value} icon={<MailIcon className="h-6 w-6 text-gray-400" />} />
                    <InfoRow label="Marital Status" value={patient.maritalStatus?.text} icon={<HeartIcon className="h-6 w-6 text-gray-400" />} />
                    <InfoRow label="Language" value={patient.communication?.[0]?.language?.text} icon={<GlobeIcon className="h-6 w-6 text-gray-400" />} />
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Extensions</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {renderExtension(patient.extension)}
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    );
};

export default PatientInfo;
