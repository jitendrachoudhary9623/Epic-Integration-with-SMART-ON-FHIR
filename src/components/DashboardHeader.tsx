import React from 'react';
import { Clock, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const DashboardHeader = ({ formatTime, expiryTime, handleLogout }) => {
  return (
    <Card className="rounded-none shadow-md">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Patient Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground flex items-center">
              <Clock className="mr-1" size={16} />
              <span>Session expires in: {formatTime(expiryTime)}</span>
            </div>
            <Button onClick={handleLogout} variant="destructive" size="sm">
              <LogOut size={16} className="mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardHeader;