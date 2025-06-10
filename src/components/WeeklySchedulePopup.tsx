
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Save, X } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

interface DayEntry {
  text: string;
  category: string;
  hours: number;
  minutes: number;
}

interface WeeklyScheduleData {
  monday: DayEntry;
  tuesday: DayEntry;
  wednesday: DayEntry;
  thursday: DayEntry;
  friday: DayEntry;
}

interface WeeklySchedulePopupProps {
  isOpen: boolean;
  onClose: () => void;
  value: WeeklyScheduleData | null;
  onSave: (data: WeeklyScheduleData) => void;
  dropdownOptions?: string[] | null;
}

const createDefaultDayEntry = (): DayEntry => ({
  text: '',
  category: '',
  hours: 0,
  minutes: 0,
});

const createDefaultWeekData = (): WeeklyScheduleData => ({
  monday: createDefaultDayEntry(),
  tuesday: createDefaultDayEntry(),
  wednesday: createDefaultDayEntry(),
  thursday: createDefaultDayEntry(),
  friday: createDefaultDayEntry(),
});

const weekDays = [
  { key: 'monday', label: 'Montag' },
  { key: 'tuesday', label: 'Dienstag' },
  { key: 'wednesday', label: 'Mittwoch' },
  { key: 'thursday', label: 'Donnerstag' },
  { key: 'friday', label: 'Freitag' },
] as const;

const validateDayEntry = (entry: any): DayEntry => {
  if (!entry || typeof entry !== 'object') {
    return createDefaultDayEntry();
  }

  return {
    text: String(entry.text || ''),
    category: String(entry.category || ''),
    hours: Number(entry.hours) || 0,
    minutes: Number(entry.minutes) || 0,
  };
};

const validateWeekData = (data: any): WeeklyScheduleData => {
  if (!data || typeof data !== 'object') {
    return createDefaultWeekData();
  }

  const result = createDefaultWeekData();
  
  weekDays.forEach(({ key }) => {
    if (data[key]) {
      result[key] = validateDayEntry(data[key]);
    }
  });

  return result;
};

const WeeklySchedulePopupContent = ({
  isOpen,
  onClose,
  value,
  onSave,
  dropdownOptions = null,
}: WeeklySchedulePopupProps) => {
  const [weekData, setWeekData] = useState<WeeklyScheduleData>(createDefaultWeekData());

  useEffect(() => {
    if (isOpen) {
      console.log('WeeklySchedulePopup opening with value:', value);
      const validatedData = validateWeekData(value);
      console.log('Validated data:', validatedData);
      setWeekData(validatedData);
    }
  }, [value, isOpen]);

  const updateDayEntry = (day: keyof WeeklyScheduleData, field: keyof DayEntry, newValue: any) => {
    console.log('Updating day entry:', { day, field, newValue });
    
    setWeekData(prev => {
      const currentDay = prev[day] || createDefaultDayEntry();
      
      let processedValue = newValue;
      
      if (field === 'hours' || field === 'minutes') {
        processedValue = Number(newValue) || 0;
        // Begrenze Werte
        if (field === 'hours') {
          processedValue = Math.max(0, Math.min(23, processedValue));
        } else {
          processedValue = Math.max(0, Math.min(59, processedValue));
        }
      } else {
        processedValue = String(newValue || '');
      }

      const newDayData = {
        ...currentDay,
        [field]: processedValue,
      };

      return {
        ...prev,
        [day]: newDayData,
      };
    });
  };

  const handleSave = () => {
    console.log('Saving week data:', weekData);
    onSave(weekData);
    onClose();
  };

  const handleClose = () => {
    console.log('Closing popup');
    onClose();
  };

  const safeDropdownOptions = useMemo(() => {
    if (!dropdownOptions || !Array.isArray(dropdownOptions)) {
      return [];
    }
    return dropdownOptions.filter(option => 
      typeof option === 'string' && option.trim().length > 0
    );
  }, [dropdownOptions]);

  const hasDropdownOptions = safeDropdownOptions.length > 0;

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-background max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Wochenplan bearbeiten</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {weekDays.map(({ key, label }) => {
            const dayData = weekData[key] || createDefaultDayEntry();
            
            return (
              <div key={key} className="border rounded-lg p-4 bg-muted/20">
                <h3 className="font-medium mb-3 text-sm">{label}</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium min-w-[60px]">Dauer:</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={dayData.hours}
                        onChange={(e) => updateDayEntry(key, 'hours', e.target.value)}
                        className="w-20"
                        placeholder="0"
                      />
                      <span className="text-sm">h</span>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={dayData.minutes}
                        onChange={(e) => updateDayEntry(key, 'minutes', e.target.value)}
                        className="w-20"
                        placeholder="0"
                      />
                      <span className="text-sm">min</span>
                    </div>
                  </div>

                  {hasDropdownOptions && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium min-w-[60px]">Kategorie:</span>
                      <Select
                        value={dayData.category}
                        onValueChange={(value) => updateDayEntry(key, 'category', value)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Kategorie auswählen..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="">Keine Kategorie</SelectItem>
                          {safeDropdownOptions.map((option, i) => (
                            <SelectItem key={`${option}-${i}`} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <span className="text-sm font-medium min-w-[60px] mt-2">Notizen:</span>
                    <Textarea
                      value={dayData.text}
                      onChange={(e) => updateDayEntry(key, 'text', e.target.value)}
                      placeholder="Eintrag für diesen Tag..."
                      className="flex-1 min-h-[80px]"
                      maxLength={1000}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose}>
            <X className="w-4 h-4 mr-2" />
            Abbrechen
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const WeeklySchedulePopup = (props: WeeklySchedulePopupProps) => {
  return (
    <ErrorBoundary componentName="WeeklySchedulePopup">
      <WeeklySchedulePopupContent {...props} />
    </ErrorBoundary>
  );
};
