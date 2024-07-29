import React, { useState } from 'react';
import { Calendar, Clock, User, MapPin, ChevronRight, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Encounter {
  id: string;
  status: string;
  class: {
    display: string;
  };
  type: Array<{
    text: string;
  }>;
  subject: {
    reference: string;
  };
  participant: Array<{
    individual: {
      display: string;
    };
  }>;
  period: {
    start: string;
    end?: string;
  };
  location: Array<{
    location: {
      display: string;
    };
  }>;
  reasonCode: Array<{
    text: string;
  }>;
}

interface EncountersProps {
  encounters: Encounter[];
}

const Encounters: React.FC<EncountersProps> = ({ encounters }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'finished': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'planned': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEncounters = encounters?.filter(encounter =>
    encounter?.type?.[0]?.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    encounter?.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
        <CardTitle className="text-2xl flex items-center">
          <Calendar className="mr-2 h-6 w-6" />
          Your Medical Encounters
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Search encounters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            aria-label="Search encounters"
          />
        </div>
        <ScrollArea className="h-[500px] pr-2">
          {filteredEncounters?.map((encounter) => (
            <Card key={encounter.id} className="mb-2 hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-indigo-700">{encounter.type[0]?.text}</h3>
                    <p className="text-sm text-gray-600">{formatDate(encounter.period.start)}</p>
                  </div>
                  <Badge variant="outline" className={getStatusColor(encounter.status)}>
                    {encounter.status}
                  </Badge>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-indigo-500" />
                    {formatTime(encounter.period.start)}
                  </div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-indigo-500" />
                    {encounter.participant[0]?.individual.display || 'Unknown Provider'}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-indigo-500" />
                    {encounter.location[0]?.location.display || 'Unknown Location'}
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="mt-2 w-full"
                      onClick={() => setSelectedEncounter(encounter)}
                      aria-expanded={selectedEncounter?.id === encounter.id}
                    >
                      View Details <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]" role="dialog" aria-modal="true">
                    <DialogHeader>
                      <DialogTitle>Encounter Details</DialogTitle>
                    </DialogHeader>
                    {selectedEncounter && (
                      <div className="mt-4 space-y-2">
                        <h3 className="text-lg font-semibold text-indigo-700">{selectedEncounter.type[0]?.text}</h3>
                        <p><strong>Date:</strong> {formatDate(selectedEncounter?.period.start)}</p>
                        <p><strong>Time:</strong> {formatTime(selectedEncounter?.period.start)}</p>
                        <p><strong>Status:</strong> {selectedEncounter?.status}</p>
                        <p><strong>Provider:</strong> {selectedEncounter?.participant?.[0]?.individual.display || 'Unknown Provider'}</p>
                        <p><strong>Location:</strong> {selectedEncounter?.location?.[0]?.location.display || 'Unknown Location'}</p>
                        <p><strong>Reason:</strong> {selectedEncounter?.reasonCode?.[0]?.text || 'No reason provided'}</p>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default Encounters;
