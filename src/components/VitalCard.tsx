// vitals/components/VitalCard.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Info } from 'lucide-react';
import { getVitalIcon, getStatusColor, getInsight, getReferenceRange, formatDate, renderVitalValue, getTrendIcon } from '@/utils/vitalUtils';

interface VitalCardProps {
  vital: any;
  trend: string;
  status: string;
}

export const VitalCard: React.FC<VitalCardProps> = ({ vital, trend, status }) => {
  return (
    <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getVitalIcon(vital.vitalCode)}
            <h4 className="text-lg font-semibold text-gray-800">{vital.vitalName}</h4>
          </div>
          <div className="flex items-center space-x-2">
            {getTrendIcon(trend)}
            <Popover>
              <PopoverTrigger>
                <Info className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
              </PopoverTrigger>
              <PopoverContent>
                <p className="text-sm">{getInsight(vital.vitalName, status)}</p>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <p className={`text-2xl font-bold ${getStatusColor(status)}`}>
          {renderVitalValue(vital)}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Recorded: {formatDate(vital.date)}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Normal Range: {getReferenceRange(vital.vitalName)}
        </p>
      </CardContent>
    </Card>
  );
};

export default VitalCard;