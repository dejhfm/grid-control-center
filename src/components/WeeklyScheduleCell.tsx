
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { WeeklySchedulePopup } from './WeeklySchedulePopup';

interface WeeklyScheduleData {
  monday: { text: string; category: string; hours: number; minutes: number };
  tuesday: { text: string; category: string; hours: number; minutes: number };
  wednesday: { text: string; category: string; hours: number; minutes: number };
  thursday: { text: string; category: string; hours: number; minutes: number };
  friday: { text: string; category: string; hours: number; minutes: number };
}

interface WeeklyScheduleCellProps {
  value: WeeklyScheduleData | null;
  onChange: (value: WeeklyScheduleData) => void;
  dropdownOptions?: string[];
  disabled?: boolean;
}

export const WeeklyScheduleCell = ({
  value,
  onChange,
  dropdownOptions = [],
  disabled = false,
}: WeeklyScheduleCellProps) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const getTotalHours = (data: WeeklyScheduleData | null): string => {
    if (!data) return '0:00';
    
    let totalMinutes = 0;
    Object.values(data).forEach(day => {
      totalMinutes += (day.hours * 60) + day.minutes;
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const hasData = value && Object.values(value).some(day => 
    day.text.trim() || day.category || day.hours > 0 || day.minutes > 0
  );

  return (
    <>
      <Button
        variant={hasData ? "default" : "outline"}
        size="sm"
        onClick={() => setIsPopupOpen(true)}
        disabled={disabled}
        className="w-full"
      >
        <Calendar className="w-4 h-4 mr-2" />
        {hasData ? `Woche: ${getTotalHours(value)}` : 'Eintrag'}
      </Button>

      <WeeklySchedulePopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        value={value}
        onSave={onChange}
        dropdownOptions={dropdownOptions}
      />
    </>
  );
};
