
import React, { useState } from 'react';
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
  dropdownOptions?: string[] | null;
  disabled?: boolean;
}

const createDefaultDayEntry = () => ({
  text: '',
  category: '',
  hours: 0,
  minutes: 0,
});

export const WeeklyScheduleCell = ({
  value,
  onChange,
  dropdownOptions = null,
  disabled = false,
}: WeeklyScheduleCellProps) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const getTotalHours = (data: WeeklyScheduleData | null): string => {
    if (!data) return '0:00';
    
    let totalMinutes = 0;
    try {
      // Safely iterate through days
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
      
      days.forEach(dayKey => {
        const day = data[dayKey];
        if (day && typeof day === 'object') {
          const hours = typeof day.hours === 'number' && !isNaN(day.hours) ? day.hours : 0;
          const minutes = typeof day.minutes === 'number' && !isNaN(day.minutes) ? day.minutes : 0;
          totalMinutes += (hours * 60) + minutes;
        }
      });
    } catch (error) {
      console.error('Error calculating total hours:', error);
      return '0:00';
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const hasData = React.useMemo(() => {
    try {
      if (!value || typeof value !== 'object') {
        return false;
      }

      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
      
      return days.some(dayKey => {
        const day = value[dayKey];
        if (!day || typeof day !== 'object') {
          return false;
        }
        
        return (
          (typeof day.text === 'string' && day.text.trim().length > 0) ||
          (typeof day.category === 'string' && day.category.trim().length > 0) ||
          (typeof day.hours === 'number' && day.hours > 0) ||
          (typeof day.minutes === 'number' && day.minutes > 0)
        );
      });
    } catch (error) {
      console.error('Error checking if data exists:', error);
      return false;
    }
  }, [value]);

  const handleOpenPopup = () => {
    if (!disabled) {
      console.log('Opening WeeklySchedule popup with value:', value);
      console.log('Dropdown options:', dropdownOptions);
      setIsPopupOpen(true);
    }
  };

  const handleSave = (data: WeeklyScheduleData) => {
    try {
      console.log('WeeklyScheduleCell: Saving data:', data);
      onChange(data);
    } catch (error) {
      console.error('Error in WeeklyScheduleCell handleSave:', error);
    }
  };

  const handleClose = () => {
    try {
      setIsPopupOpen(false);
    } catch (error) {
      console.error('Error closing WeeklySchedule popup:', error);
    }
  };

  return (
    <>
      <Button
        variant={hasData ? "default" : "outline"}
        size="sm"
        onClick={handleOpenPopup}
        disabled={disabled}
        className="w-full"
      >
        <Calendar className="w-4 h-4 mr-2" />
        {hasData ? `Woche: ${getTotalHours(value)}` : 'Eintrag'}
      </Button>

      {isPopupOpen && (
        <WeeklySchedulePopup
          isOpen={isPopupOpen}
          onClose={handleClose}
          value={value}
          onSave={handleSave}
          dropdownOptions={dropdownOptions}
        />
      )}
    </>
  );
};
