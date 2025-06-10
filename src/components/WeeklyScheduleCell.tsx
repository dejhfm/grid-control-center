
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { WeeklySchedulePopup } from './WeeklySchedulePopup';
import { ErrorBoundary } from './ErrorBoundary';

interface DayEntry {
  id: string;
  text: string;
  category: string;
  hours: number;
  minutes: number;
  isConfirmed: boolean;
  isEditing: boolean;
  lastEditedBy?: string;
  lastEditedAt?: string;
}

interface WeeklyScheduleData {
  monday: DayEntry[];
  tuesday: DayEntry[];
  wednesday: DayEntry[];
  thursday: DayEntry[];
  friday: DayEntry[];
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
      const dayEntries = data[dayKey];
      if (Array.isArray(dayEntries)) {
        dayEntries.forEach(entry => {
          if (entry && typeof entry === 'object' && entry.isConfirmed) {
            const hours = Number(entry.hours) || 0;
            const minutes = Number(entry.minutes) || 0;
            totalMinutes += (hours * 60) + minutes;
          }
        });
      } else if (dayEntries && typeof dayEntries === 'object') {
        // Legacy support for old single entry format
        const legacyEntry = dayEntries as any;
        const hours = Number(legacyEntry.hours) || 0;
        const minutes = Number(legacyEntry.minutes) || 0;
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
      const dayEntries = value[dayKey];
      if (Array.isArray(dayEntries)) {
        return dayEntries.some(entry => {
          if (!entry || typeof entry !== 'object') return false;
          return (
            (entry.text && entry.text.trim().length > 0) ||
            (entry.category && entry.category.trim().length > 0) ||
            (Number(entry.hours) > 0) ||
            (Number(entry.minutes) > 0)
          );
        });
      } else if (dayEntries && typeof dayEntries === 'object') {
        // Legacy support for old single entry format
        const legacyEntry = dayEntries as any;
        return (
          (legacyEntry.text && legacyEntry.text.trim().length > 0) ||
          (legacyEntry.category && legacyEntry.category.trim().length > 0) ||
          (Number(legacyEntry.hours) > 0) ||
          (Number(legacyEntry.minutes) > 0)
        );
      }
      return false;
    });
  }, [value]);

  const getConfirmedEntryCount = (data: WeeklyScheduleData | null): number => {
    if (!data) return 0;
    
    let count = 0;
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
    
    days.forEach(dayKey => {
      const dayEntries = data[dayKey];
      if (Array.isArray(dayEntries)) {
        count += dayEntries.filter(entry => entry.isConfirmed).length;
      } else if (dayEntries && typeof dayEntries === 'object') {
        // Legacy support: count as one confirmed entry
        count += 1;
      }
    });
    
    return count;
  };

  const handleOpenPopup = () => {
    console.log('Opening WeeklySchedule popup with value:', value);
    setIsPopupOpen(true);
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

  const confirmedCount = getConfirmedEntryCount(value);

  return (
    <>
      <Button
        variant={hasData ? "default" : "outline"}
        size="sm"
        onClick={handleOpenPopup}
        className="w-full"
      >
        <Calendar className="w-4 h-4 mr-2" />
        {hasData 
          ? `${confirmedCount} Einträge • ${getTotalHours(value)}` 
          : 'Eintrag'
        }
      </Button>

      {isPopupOpen && (
        <WeeklySchedulePopup
          isOpen={isPopupOpen}
          onClose={handleClose}
          value={value}
          onSave={handleSave}
          dropdownOptions={safeDropdownOptions}
          disabled={disabled}
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
