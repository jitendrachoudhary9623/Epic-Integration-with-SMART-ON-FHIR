import React from 'react';
import { Clock, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ThemeToggle from './ThemeToggle';

const DashboardHeader = ({ formatTime, expiryTime, handleLogout }) => {
  return (
    <Card className="rounded-none shadow-md">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
          <h1 className="text-xl sm:text-2xl font-bold text-primary">Patient Dashboard</h1>
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="text-xs sm:text-sm text-muted-foreground flex items-center flex-1 sm:flex-initial">
              <Clock className="mr-1 flex-shrink-0" size={14} />
              <span className="truncate">
                <span className="hidden sm:inline">Session expires in: </span>
                {formatTime(expiryTime)}
              </span>
            </div>
            <ThemeToggle />
            <Button onClick={handleLogout} variant="destructive" size="sm" className="flex-shrink-0">
              <LogOut size={14} className="sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardHeader;