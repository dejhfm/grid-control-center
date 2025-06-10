
import { useState, useEffect } from 'react';
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

const defaultDayEntry: DayEntry = {
  text: '',
  category: '',
  hours: 0,
  minutes: 0,
};

const defaultWeekData: WeeklyScheduleData = {
  monday: { ...defaultDayEntry },
  tuesday: { ...defaultDayEntry },
  wednesday: { ...defaultDayEntry },
  thursday: { ...defaultDayEntry },
  friday: { ...defaultDayEntry },
};

const weekDays = [
  { key: 'monday', label: 'Montag' },
  { key: 'tuesday', label: 'Dienstag' },
  { key: 'wednesday', label: 'Mittwoch' },
  { key: 'thursday', label: 'Donnerstag' },
  { key: 'friday', label: 'Freitag' },
] as const;

export const WeeklySchedulePopup = ({
  isOpen,
  onClose,
  value,
  onSave,
  dropdownOptions = null,
}: WeeklySchedulePopupProps) => {
  const [weekData, setWeekData] = useState<WeeklyScheduleData>(defaultWeekData);

  useEffect(() => {
    if (isOpen) {
      if (value) {
        setWeekData(value);
      } else {
        setWeekData(defaultWeekData);
      }
    }
  }, [value, isOpen]);

  const updateDayEntry = (day: keyof WeeklyScheduleData, field: keyof DayEntry, newValue: any) => {
    setWeekData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: newValue,
      },
    }));
  };

  const handleSave = () => {
    onSave(weekData);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  // Ensure dropdownOptions is an array
  const safeDropdownOptions = Array.isArray(dropdownOptions) ? dropdownOptions : [];
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
          {weekDays.map(({ key, label }) => (
            <div key={key} className="border rounded-lg p-4 bg-muted/20">
              <h3 className="font-medium mb-3 text-sm">{label}</h3>
              
              <div className="grid grid-cols-1 gap-4">
                {/* Duration Input */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium min-w-[60px]">Dauer:</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      value={weekData[key].hours}
                      onChange={(e) => updateDayEntry(key, 'hours', parseInt(e.target.value) || 0)}
                      className="w-20"
                      placeholder="0"
                    />
                    <span className="text-sm">h</span>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={weekData[key].minutes}
                      onChange={(e) => updateDayEntry(key, 'minutes', parseInt(e.target.value) || 0)}
                      className="w-20"
                      placeholder="0"
                    />
                    <span className="text-sm">min</span>
                  </div>
                </div>

                {/* Category Dropdown */}
                {hasDropdownOptions && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium min-w-[60px]">Kategorie:</span>
                    <Select
                      value={weekData[key].category}
                      onValueChange={(value) => updateDayEntry(key, 'category', value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Kategorie auswählen..." />
                      </SelectTrigger>
                      <SelectContent className="bg-background">
                        {safeDropdownOptions.map((option, i) => (
                          <SelectItem key={i} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Text Area */}
                <div className="flex gap-2">
                  <span className="text-sm font-medium min-w-[60px] mt-2">Notizen:</span>
                  <Textarea
                    value={weekData[key].text}
                    onChange={(e) => updateDayEntry(key, 'text', e.target.value)}
                    placeholder="Eintrag für diesen Tag..."
                    className="flex-1 min-h-[80px]"
                    maxLength={1000}
                  />
                </div>
              </div>
            </div>
          ))}
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
