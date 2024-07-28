import React from 'react';
import { Calendar, Clock, MapPin, User, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Appointment } from 'fhir/r4';

interface AppointmentsProps {
  appointments: Appointment[];
}

const Appointments: React.FC<AppointmentsProps> = ({ appointments }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'arrived':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'booked':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'arrived':
        return <User className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-blue-500 to-purple-600">
        <h3 className="text-lg leading-6 font-medium text-white flex items-center">
          <Calendar className="mr-2" /> Upcoming Appointments
        </h3>
      </div>
      <div className="border-t border-gray-200">
        {appointments.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {appointments.map((appointment, index) => (
              <li key={index} className="p-4 hover:bg-gray-50 transition duration-150 ease-in-out">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {getStatusIcon(appointment.status || 'unknown')}
                      <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appointment.status || 'unknown')}`}>
                        {appointment.status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{appointment.serviceType?.[0]?.text || 'General Appointment'}</p>
                    <p className="text-sm text-gray-500">{appointment.description}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <div className="flex flex-col items-end">
                      <p className="text-sm font-medium text-indigo-600">{formatDate(appointment.start)}</p>
                      <p className="text-sm text-gray-500">{formatTime(appointment.start)} - {formatTime(appointment.end)}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <Clock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  <p>Duration: {appointment.minutesDuration} minutes</p>
                </div>
                {appointment.participant && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <User className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    <p>
                      With: {appointment.participant
                        .filter(p => p.actor?.display)
                        .map(p => p.actor?.display)
                        .join(', ')}
                    </p>
                  </div>
                )}
                {appointment.location && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <MapPin className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    <p>{appointment.location[0].location?.display}</p>
                  </div>
                )}
                {appointment.comment && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded-md">
                    <p className="text-xs text-yellow-800 flex items-start">
                      <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                      <span>{appointment.comment}</span>
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-5 sm:px-6 text-sm text-gray-500">No upcoming appointments</p>
        )}
      </div>
    </div>
  );
};

export default Appointments;