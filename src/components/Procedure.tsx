import React from 'react';
import { CalendarIcon, UserIcon, ClockIcon, MapPinIcon, ActivityIcon, FileTextIcon, BadgeCheckIcon, ClipboardListIcon, UsersIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const StatusBadge = ({ status }) => {
  const statusStyles = {
    completed: "bg-green-100 text-green-800",
    in_progress: "bg-blue-100 text-blue-800",
    planned: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <Badge variant="outline" className={`${statusStyles[status?.toLowerCase()] || 'bg-gray-100 text-gray-800'} capitalize`}>
      {status}
    </Badge>
  );
};

const ProcedureDetail = ({ icon: Icon, label, value }) => (
  <div className="flex items-center space-x-2">
    <Icon size={16} className="text-muted-foreground" />
    <span className="text-sm text-muted-foreground">{label}:</span>
    <span className="text-sm font-medium">{value}</span>
  </div>
);

const ProcedureCard = ({ procedure }) => {
  console.log({procedure});

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getProcedureName = () => {
    return procedure?.code?.text || procedure?.code?.coding?.[0]?.display || 'Unknown Procedure';
  };

  const getPerformerName = (performer) => {
    return performer?.actor?.display || 'Unknown';
  };

  const getPerformerInitials = (performer) => {
    const name = getPerformerName(performer);
    return name.split(' ')?.map(n => n[0]).join('').toUpperCase();
  };

  return (

    <Card className="w-full max-w-2xl">
       
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{getProcedureName()}</CardTitle>
            <CardDescription>Procedure ID: {procedure?.id}</CardDescription>
          </div>
          <StatusBadge status={procedure?.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {procedure?.performedDateTime && (
            <>
              <ProcedureDetail icon={CalendarIcon} label="Date" value={formatDate(procedure?.performedDateTime)} />
              <ProcedureDetail icon={ClockIcon} label="Time" value={formatTime(procedure?.performedDateTime)} />
            </>
          )}
          {procedure?.performedPeriod && (
            <>
              <ProcedureDetail icon={CalendarIcon} label="Start" value={formatDate(procedure?.performedPeriod.start)} />
              <ProcedureDetail icon={ClockIcon} label="End" value={formatTime(procedure?.performedPeriod.end)} />
            </>
          )}
          <ProcedureDetail icon={UserIcon} label="Patient" value={procedure?.subject?.display || 'Unknown'} />
          <ProcedureDetail icon={UsersIcon} label="Encounter" value={procedure?.encounter?.display || 'Unknown'} />
          <ProcedureDetail icon={BadgeCheckIcon} label="Asserter" value={procedure?.asserter?.display || 'Unknown'} />
          <ProcedureDetail icon={MapPinIcon} label="Location" value={procedure?.location?.display || 'Not specified'} />
          <ProcedureDetail icon={ActivityIcon} label="Category" value={procedure?.category?.text || procedure?.category?.coding?.[0]?.display || 'Not specified'} />
        </div>
        <Separator className="my-4" />
        {procedure?.reasonCode && procedure?.reasonCode.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Reason</h4>
            <p className="text-sm text-muted-foreground">{procedure?.reasonCode[0].text || procedure?.reasonCode[0].coding?.[0]?.display}</p>
          </div>
        )}
        <Separator className="my-4" />
        <div>
          <h4 className="text-sm font-semibold mb-2">Identifiers</h4>
          <div className="space-y-2">
            {procedure?.identifier?.map((id, index) => (
              <ProcedureDetail key={index} icon={ClipboardListIcon} label={`${id.type.text} (${id.system})`} value={id.value} />
            ))}
          </div>
        </div>
        <Separator className="my-4" />
        {procedure?.performer && procedure?.performer.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Performers</h4>
            <div className="space-y-2">
              {procedure.performer.map((perf, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Avatar>
                    <AvatarFallback>{getPerformerInitials(perf)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{getPerformerName(perf)}</span>
                    <span className="text-sm text-muted-foreground">{perf.onBehalfOf?.display || 'Unknown Organization'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {procedure?.report && procedure?.report.length > 0 && (
          <Button variant="outline" className="flex items-center">
            <FileTextIcon size={16} className="mr-2" />
            View Report
          </Button> 
        )}
      </CardFooter>
    </Card>
  );
};


const ProcedureList = ({ procedures }) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {procedures.map((procedure, index) => (
          <ProcedureCard key={index} procedure={procedure} />
        ))}
      </div>
    );
  };
export default ProcedureList;
