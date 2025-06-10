
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Save, X } from 'lucide-react';

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
    text: typeof entry.text === 'string' ? entry.text : '',
    category: typeof entry.category === 'string' ? entry.category : '',
    hours: typeof entry.hours === 'number' && !isNaN(entry.hours) ? entry.hours : 0,
    minutes: typeof entry.minutes === 'number' && !isNaN(entry.minutes) ? entry.minutes : 0,
  };
};

const validateWeekData = (data: any): WeeklyScheduleData => {
  if (!data || typeof data !== 'object') {
    return createDefaultWeekData();
  }

  return {
    monday: validateDayEntry(data.monday),
    tuesday: validateDayEntry(data.tuesday),
    wednesday: validateDayEntry(data.wednesday),
    thursday: validateDayEntry(data.thursday),
    friday: validateDayEntry(data.friday),
  };
};

export const WeeklySchedulePopup = ({
  isOpen,
  onClose,
  value,
  onSave,
  dropdownOptions = null,
}: WeeklySchedulePopupProps) => {
  const [weekData, setWeekData] = useState<WeeklyScheduleData>(createDefaultWeekData());

  useEffect(() => {
    if (isOpen) {
      try {
        if (value) {
          const validatedData = validateWeekData(value);
          setWeekData(validatedData);
        } else {
          setWeekData(createDefaultWeekData());
        }
      } catch (error) {
        console.error('Error in WeeklySchedulePopup useEffect:', error);
        setWeekData(createDefaultWeekData());
      }
    }
  }, [value, isOpen]);

  const updateDayEntry = (day: keyof WeeklyScheduleData, field: keyof DayEntry, newValue: any) => {
    try {
      setWeekData(prev => {
        const currentDay = prev[day] || createDefaultDayEntry();
        
        let processedValue = newValue;
        
        if (field === 'hours' || field === 'minutes') {
          processedValue = typeof newValue === 'number' && !isNaN(newValue) ? newValue : 0;
        } else {
          processedValue = typeof newValue === 'string' ? newValue : '';
        }

        return {
          ...prev,
          [day]: {
            ...currentDay,
            [field]: processedValue,
          },
        };
      });
    } catch (error) {
      console.error('Error updating day entry:', error);
    }
  };

  const handleSave = () => {
    try {
      onSave(weekData);
      onClose();
    } catch (error) {
      console.error('Error saving week data:', error);
    }
  };

  const handleClose = () => {
    try {
      onClose();
    } catch (error) {
      console.error('Error closing popup:', error);
    }
  };

  const safeDropdownOptions = useMemo(() => {
    try {
      if (Array.isArray(dropdownOptions)) {
        return dropdownOptions.filter(option => typeof option === 'string' && option.trim().length > 0);
      }
      return [];
    } catch (error) {
      console.error('Error processing dropdown options:', error);
      return [];
    }
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
                        value={dayData.hours || 0}
                        onChange={(e) => updateDayEntry(key, 'hours', parseInt(e.target.value) || 0)}
                        className="w-20"
                        placeholder="0"
                      />
                      <span className="text-sm">h</span>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={dayData.minutes || 0}
                        onChange={(e) => updateDayEntry(key, 'minutes', parseInt(e.target.value) || 0)}
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
                        value={dayData.category || ''}
                        onValueChange={(value) => updateDayEntry(key, 'category', value)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Kategorie auswählen..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
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
                      value={dayData.text || ''}
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
