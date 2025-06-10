
import React, { useState, useMemo } from 'react';
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

  const hasData = useMemo(() => {
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
      setIsPopupOpen(true);
    }
  };

  const handleSave = (data: WeeklyScheduleData) => {
    try {
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

  // Sichere Verarbeitung der dropdownOptions
  const safeDropdownOptions = useMemo(() => {
    try {
      if (Array.isArray(dropdownOptions)) {
        return dropdownOptions.filter(option => 
          typeof option === 'string' && option.trim().length > 0
        );
      }
      return [];
    } catch (error) {
      console.error('Error processing dropdown options:', error);
      return [];
    }
  }, [dropdownOptions]);

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
          dropdownOptions={safeDropdownOptions}
        />
      )}
    </>
  );
};
