
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Save, X, Check, Edit, Plus } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import { useAuth } from '@/contexts/AuthContext';

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

interface WeeklySchedulePopupProps {
  isOpen: boolean;
  onClose: () => void;
  value: WeeklyScheduleData | null;
  onSave: (data: WeeklyScheduleData) => void;
  dropdownOptions?: string[] | null;
  disabled?: boolean;
}

const createDefaultDayEntry = (isEditing: boolean = true, username?: string): DayEntry => ({
  id: Math.random().toString(36).substr(2, 9),
  text: '',
  category: 'no-category', // Default to 'no-category' instead of empty string
  hours: 0,
  minutes: 0,
  isConfirmed: false,
  isEditing: isEditing,
  lastEditedBy: username,
  lastEditedAt: new Date().toISOString(),
});

const createDefaultWeekData = (): WeeklyScheduleData => ({
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
});

const weekDays = [
  { key: 'monday', label: 'Montag' },
  { key: 'tuesday', label: 'Dienstag' },
  { key: 'wednesday', label: 'Mittwoch' },
  { key: 'thursday', label: 'Donnerstag' },
  { key: 'friday', label: 'Freitag' },
] as const;

const validateDayEntry = (entry: any, username?: string): DayEntry => {
  if (!entry || typeof entry !== 'object') {
    return createDefaultDayEntry(true, username);
  }

  // Ensure category is never an empty string
  let category = String(entry.category || '');
  if (!category || category.trim() === '') {
    category = 'no-category';
  }

  return {
    id: entry.id || Math.random().toString(36).substr(2, 9),
    text: String(entry.text || ''),
    category: category,
    hours: Number(entry.hours) || 0,
    minutes: Number(entry.minutes) || 0,
    isConfirmed: Boolean(entry.isConfirmed),
    isEditing: Boolean(entry.isEditing),
    lastEditedBy: entry.lastEditedBy || username,
    lastEditedAt: entry.lastEditedAt || new Date().toISOString(),
  };
};

const validateWeekData = (data: any, username?: string): WeeklyScheduleData => {
  if (!data || typeof data !== 'object') {
    return createDefaultWeekData();
  }

  const result = createDefaultWeekData();
  
  weekDays.forEach(({ key }) => {
    if (data[key]) {
      if (Array.isArray(data[key])) {
        result[key] = data[key].map((entry: any) => validateDayEntry(entry, username));
      } else {
        // Legacy support: convert old single entry format to array
        const legacyEntry = validateDayEntry(data[key], username);
        if (legacyEntry.text || legacyEntry.category !== 'no-category' || legacyEntry.hours > 0 || legacyEntry.minutes > 0) {
          legacyEntry.isConfirmed = true;
          legacyEntry.isEditing = false;
          result[key] = [legacyEntry];
        }
      }
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
  disabled = false,
}: WeeklySchedulePopupProps) => {
  const [weekData, setWeekData] = useState<WeeklyScheduleData>(createDefaultWeekData());
  const { user } = useAuth();

  const currentUsername = user?.user_metadata?.username || user?.email || 'Unbekannt';

  useEffect(() => {
    if (isOpen) {
      console.log('WeeklySchedulePopup opening with value:', value);
      try {
        const validatedData = validateWeekData(value, currentUsername);
        console.log('Validated data:', validatedData);
        setWeekData(validatedData);
      } catch (error) {
        console.error('Error validating week data:', error);
        setWeekData(createDefaultWeekData());
      }
    }
  }, [value, isOpen, currentUsername]);

  const addNewEntry = (day: keyof WeeklyScheduleData) => {
    if (disabled) return;
    
    try {
      setWeekData(prev => ({
        ...prev,
        [day]: [...prev[day], createDefaultDayEntry(true, currentUsername)]
      }));
    } catch (error) {
      console.error('Error adding new entry:', error);
    }
  };

  const updateDayEntry = (day: keyof WeeklyScheduleData, entryId: string, field: keyof DayEntry, newValue: any) => {
    if (disabled) return;
    
    console.log('Updating day entry:', { day, entryId, field, newValue });
    
    try {
      setWeekData(prev => ({
        ...prev,
        [day]: prev[day].map(entry => {
          if (entry.id !== entryId) return entry;
          
          let processedValue = newValue;
          
          if (field === 'hours' || field === 'minutes') {
            processedValue = Number(newValue) || 0;
            if (field === 'hours') {
              processedValue = Math.max(0, Math.min(23, processedValue));
            } else {
              processedValue = Math.max(0, Math.min(59, processedValue));
            }
          } else if (field === 'category') {
            // Ensure category is never empty string
            processedValue = String(newValue || 'no-category');
            if (processedValue.trim() === '') {
              processedValue = 'no-category';
            }
          } else {
            processedValue = String(newValue || '');
          }

          return {
            ...entry,
            [field]: processedValue,
            lastEditedBy: currentUsername,
            lastEditedAt: new Date().toISOString(),
          };
        })
      }));
    } catch (error) {
      console.error('Error updating day entry:', error);
    }
  };

  const confirmEntry = (day: keyof WeeklyScheduleData, entryId: string) => {
    if (disabled) return;
    
    try {
      setWeekData(prev => ({
        ...prev,
        [day]: prev[day].map(entry => 
          entry.id === entryId 
            ? { 
                ...entry, 
                isConfirmed: true, 
                isEditing: false,
                lastEditedBy: currentUsername,
                lastEditedAt: new Date().toISOString(),
              }
            : entry
        )
      }));
    } catch (error) {
      console.error('Error confirming entry:', error);
    }
  };

  const deleteEntry = (day: keyof WeeklyScheduleData, entryId: string) => {
    if (disabled) return;
    
    try {
      setWeekData(prev => ({
        ...prev,
        [day]: prev[day].filter(entry => entry.id !== entryId)
      }));
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const editEntry = (day: keyof WeeklyScheduleData, entryId: string) => {
    if (disabled) return;
    
    try {
      setWeekData(prev => ({
        ...prev,
        [day]: prev[day].map(entry => 
          entry.id === entryId 
            ? { 
                ...entry, 
                isEditing: true,
                lastEditedBy: currentUsername,
                lastEditedAt: new Date().toISOString(),
              }
            : entry
        )
      }));
    } catch (error) {
      console.error('Error editing entry:', error);
    }
  };

  const handleSave = () => {
    if (disabled) return;
    
    try {
      console.log('Saving week data:', weekData);
      onSave(weekData);
      onClose();
    } catch (error) {
      console.error('Error saving week data:', error);
    }
  };

  const handleClose = () => {
    try {
      console.log('Closing popup');
      onClose();
    } catch (error) {
      console.error('Error closing popup:', error);
    }
  };

  const safeDropdownOptions = useMemo(() => {
    try {
      if (!dropdownOptions || !Array.isArray(dropdownOptions)) {
        return [];
      }
      return dropdownOptions.filter(option => 
        typeof option === 'string' && option.trim().length > 0
      );
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
      <DialogContent className="bg-background max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {disabled ? 'Wochenplan ansehen' : 'Wochenplan bearbeiten'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {weekDays.map(({ key, label }) => {
            const dayEntries = weekData[key] || [];
            
            return (
              <div key={key} className="border rounded-lg p-4 bg-muted/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-sm">{label}</h3>
                  {!disabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addNewEntry(key)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Neuer Eintrag
                    </Button>
                  )}
                </div>
                
                <div className="space-y-4">
                  {dayEntries.map((entry) => {
                    // Ensure entry has valid category for Select component
                    const validCategory = entry.category && entry.category.trim() !== '' ? entry.category : 'no-category';
                    
                    return (
                      <div 
                        key={entry.id} 
                        className={`border rounded-lg p-3 ${
                          entry.isConfirmed && !entry.isEditing 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-background border-border'
                        }`}
                      >
                        {entry.isEditing && !disabled ? (
                          // Editing mode
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium min-w-[60px]">Dauer:</span>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max="23"
                                  value={entry.hours}
                                  onChange={(e) => updateDayEntry(key, entry.id, 'hours', e.target.value)}
                                  className="w-20"
                                  placeholder="0"
                                />
                                <span className="text-sm">h</span>
                                <Input
                                  type="number"
                                  min="0"
                                  max="59"
                                  value={entry.minutes}
                                  onChange={(e) => updateDayEntry(key, entry.id, 'minutes', e.target.value)}
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
                                  value={validCategory}
                                  onValueChange={(value) => updateDayEntry(key, entry.id, 'category', value)}
                                >
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Kategorie auswählen..." />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background z-50">
                                    <SelectItem value="no-category">Keine Kategorie</SelectItem>
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
                                value={entry.text}
                                onChange={(e) => updateDayEntry(key, entry.id, 'text', e.target.value)}
                                placeholder="Eintrag für diesen Tag..."
                                className="flex-1 min-h-[80px]"
                                maxLength={1000}
                              />
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteEntry(key, entry.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Löschen
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => confirmEntry(key, entry.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Bestätigen
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // Read-only confirmed mode
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <span className="text-sm font-medium">
                                  Dauer: {entry.hours}h {entry.minutes}min
                                </span>
                                {entry.category && entry.category !== 'no-category' && (
                                  <span className="text-sm text-muted-foreground">
                                    Kategorie: {entry.category}
                                  </span>
                                )}
                              </div>
                              {!disabled && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => editEntry(key, entry.id)}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Bearbeiten
                                </Button>
                              )}
                            </div>
                            
                            {entry.text && (
                              <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                                {entry.text}
                              </div>
                            )}
                            
                            {entry.lastEditedBy && (
                              <div className="text-xs text-muted-foreground">
                                Zuletzt bearbeitet von: {entry.lastEditedBy}
                                {entry.lastEditedAt && (
                                  <span className="ml-2">
                                    am {new Date(entry.lastEditedAt).toLocaleDateString('de-DE')}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {dayEntries.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      Keine Einträge für {label}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose}>
            <X className="w-4 h-4 mr-2" />
            {disabled ? 'Schließen' : 'Abbrechen'}
          </Button>
          {!disabled && (
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Speichern
            </Button>
            )}
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
