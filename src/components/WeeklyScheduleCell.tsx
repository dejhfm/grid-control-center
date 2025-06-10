
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { WeeklySchedulePopup } from './WeeklySchedulePopup';
import { ErrorBoundary } from './ErrorBoundary';

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

const WeeklyScheduleCellContent = ({
  value,
  onChange,
  dropdownOptions = null,
  disabled = false,
}: WeeklyScheduleCellProps) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const getTotalHours = (data: WeeklyScheduleData | null): string => {
    if (!data) return '0:00';
    
    let totalMinutes = 0;
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
    
    days.forEach(dayKey => {
      const day = data[dayKey];
      if (day && typeof day === 'object') {
        const hours = Number(day.hours) || 0;
        const minutes = Number(day.minutes) || 0;
        totalMinutes += (hours * 60) + minutes;
      }
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const hasData = useMemo(() => {
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
        (day.text && day.text.trim().length > 0) ||
        (day.category && day.category.trim().length > 0) ||
        (Number(day.hours) > 0) ||
        (Number(day.minutes) > 0)
      );
    });
  }, [value]);

  const handleOpenPopup = () => {
    if (!disabled) {
      console.log('Opening WeeklySchedule popup with value:', value);
      setIsPopupOpen(true);
    }
  };

  const handleSave = (data: WeeklyScheduleData) => {
    console.log('Saving WeeklySchedule data:', data);
    onChange(data);
  };

  const handleClose = () => {
    console.log('Closing WeeklySchedule popup');
    setIsPopupOpen(false);
  };

  const safeDropdownOptions = useMemo(() => {
    if (!dropdownOptions || !Array.isArray(dropdownOptions)) {
      return [];
    }
    return dropdownOptions.filter(option => 
      typeof option === 'string' && option.trim().length > 0
    );
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

export const WeeklyScheduleCell = (props: WeeklyScheduleCellProps) => {
  return (
    <ErrorBoundary componentName="WeeklyScheduleCell">
      <WeeklyScheduleCellContent {...props} />
    </ErrorBoundary>
  );
};
