import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Save, X, Check, Edit, Plus, AlertTriangle } from 'lucide-react';
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

// Sichere Funktion zum Erstellen von Default-Einträgen
const createDefaultDayEntry = (isEditing: boolean = true, username?: string): DayEntry => {
  try {
    return {
      id: Math.random().toString(36).substr(2, 9),
      text: '',
      category: 'no-category',
      hours: 0,
      minutes: 0,
      isConfirmed: false,
      isEditing: isEditing,
      lastEditedBy: username || 'Unbekannt',
      lastEditedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error creating default day entry:', error);
    return {
      id: 'fallback-' + Date.now(),
      text: '',
      category: 'no-category',
      hours: 0,
      minutes: 0,
      isConfirmed: false,
      isEditing: true,
      lastEditedBy: 'System',
      lastEditedAt: new Date().toISOString(),
    };
  }
};

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

// Robuste Validierungsfunktion für DayEntry
const validateDayEntry = (entry: any, username?: string): DayEntry => {
  try {
    if (!entry || typeof entry !== 'object') {
      console.warn('Invalid entry object, creating default');
      return createDefaultDayEntry(true, username);
    }

    let category = '';
    try {
      category = String(entry.category || '').trim();
    } catch (error) {
      console.warn('Error processing category:', error);
      category = '';
    }
    
    if (!category || category === '') {
      category = 'no-category';
    }

    let hours = 0;
    let minutes = 0;
    try {
      hours = Math.max(0, Math.min(23, Number(entry.hours) || 0));
      minutes = Math.max(0, Math.min(59, Number(entry.minutes) || 0));
    } catch (error) {
      console.warn('Error processing time values:', error);
      hours = 0;
      minutes = 0;
    }

    return {
      id: entry.id || Math.random().toString(36).substr(2, 9),
      text: String(entry.text || ''),
      category: category,
      hours: hours,
      minutes: minutes,
      isConfirmed: Boolean(entry.isConfirmed),
      isEditing: Boolean(entry.isEditing),
      lastEditedBy: entry.lastEditedBy || username || 'Unbekannt',
      lastEditedAt: entry.lastEditedAt || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Critical error in validateDayEntry:', error);
    return createDefaultDayEntry(true, username);
  }
};

// Robuste Wochendaten-Validierung
const validateWeekData = (data: any, username?: string): WeeklyScheduleData => {
  try {
    if (!data || typeof data !== 'object') {
      console.warn('Invalid week data, using defaults');
      return createDefaultWeekData();
    }

    const result = createDefaultWeekData();
    
    weekDays.forEach(({ key }) => {
      try {
        if (data[key]) {
          if (Array.isArray(data[key])) {
            result[key] = data[key].map((entry: any) => validateDayEntry(entry, username));
          } else {
            const legacyEntry = validateDayEntry(data[key], username);
            if (legacyEntry.text || legacyEntry.category !== 'no-category' || legacyEntry.hours > 0 || legacyEntry.minutes > 0) {
              legacyEntry.isConfirmed = true;
              legacyEntry.isEditing = false;
              result[key] = [legacyEntry];
            }
          }
        }
      } catch (error) {
        console.error(`Error processing day ${key}:`, error);
        result[key] = [];
      }
    });

    return result;
  } catch (error) {
    console.error('Critical error in validateWeekData:', error);
    return createDefaultWeekData();
  }
};

// Sichere Komponente für einzelne Einträge mit vollständiger Fehlerbehandlung
const SafeEntryRenderer = ({ entry, day, entryId, disabled, onUpdate, onConfirm, onDelete, onEdit, dropdownOptions }: any) => {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // VERBESSERTE sichere Verarbeitung der Dropdown-Optionen
  const safeDropdownOptions = useMemo(() => {
    try {
      if (!dropdownOptions || !Array.isArray(dropdownOptions)) {
        console.log('No valid dropdown options provided');
        return [];
      }
      
      const filteredOptions = dropdownOptions
        .filter((option: any) => {
          // Sehr strenge Filterung
          if (option == null) return false;
          const stringValue = String(option).trim();
          if (stringValue === '' || stringValue === 'undefined' || stringValue === 'null') return false;
          // Zusätzliche Prüfung auf minimale Länge
          if (stringValue.length < 1) return false;
          return true;
        })
        .map((option: any) => String(option).trim())
        .filter((option: string, index: number, arr: string[]) => {
          // Duplikate entfernen und finale Validierung
          return option.length > 0 && arr.indexOf(option) === index;
        });
      
      console.log('Processed dropdown options:', filteredOptions);
      return filteredOptions;
    } catch (error) {
      console.error('Error processing dropdown options:', error);
      return [];
    }
  }, [dropdownOptions]);

  const safeData = useMemo(() => {
    try {
      if (!entry || typeof entry !== 'object') {
        console.warn('Invalid entry object');
        return {
          category: 'no-category',
          text: '',
          hours: 0,
          minutes: 0,
          isValid: false
        };
      }

      let category = 'no-category';
      try {
        if (entry.category && String(entry.category).trim() !== '') {
          const categoryStr = String(entry.category).trim();
          if (safeDropdownOptions.length > 0 && !safeDropdownOptions.includes(categoryStr)) {
            console.warn(`Category "${categoryStr}" not in options, using fallback`);
            category = 'no-category';
          } else {
            category = categoryStr;
          }
        }
      } catch (error) {
        console.warn('Error processing category:', error);
        category = 'no-category';
      }

      let hours = 0;
      let minutes = 0;
      try {
        hours = Math.max(0, Math.min(23, Number(entry.hours) || 0));
        minutes = Math.max(0, Math.min(59, Number(entry.minutes) || 0));
      } catch (error) {
        console.warn('Error processing time values:', error);
        hours = 0;
        minutes = 0;
      }

      return {
        category,
        text: String(entry.text || ''),
        hours,
        minutes,
        isValid: true
      };
    } catch (error) {
      console.error('Error processing entry data:', error);
      setHasError(true);
      setErrorMessage('Fehler beim Verarbeiten der Daten');
      return {
        category: 'no-category',
        text: '',
        hours: 0,
        minutes: 0,
        isValid: false
      };
    }
  }, [entry, safeDropdownOptions]);

  const safeUpdate = (field: string, value: any) => {
    try {
      if (!onUpdate || typeof onUpdate !== 'function') {
        console.error('onUpdate function not available');
        return;
      }
      onUpdate(day, entryId, field, value);
    } catch (error) {
      console.error(`Error updating field ${field}:`, error);
      setHasError(true);
      setErrorMessage(`Fehler beim Aktualisieren von ${field}`);
    }
  };

  const safeConfirm = () => {
    try {
      if (!onConfirm || typeof onConfirm !== 'function') {
        console.error('onConfirm function not available');
        return;
      }
      onConfirm(day, entryId);
    } catch (error) {
      console.error('Error confirming entry:', error);
      setHasError(true);
      setErrorMessage('Fehler beim Bestätigen des Eintrags');
    }
  };

  const safeDelete = () => {
    try {
      if (!onDelete || typeof onDelete !== 'function') {
        console.error('onDelete function not available');
        return;
      }
      onDelete(day, entryId);
    } catch (error) {
      console.error('Error deleting entry:', error);
      setHasError(true);
      setErrorMessage('Fehler beim Löschen des Eintrags');
    }
  };

  const safeEdit = () => {
    try {
      if (!onEdit || typeof onEdit !== 'function') {
        console.error('onEdit function not available');
        return;
      }
      onEdit(day, entryId);
    } catch (error) {
      console.error('Error editing entry:', error);
      setHasError(true);
      setErrorMessage('Fehler beim Bearbeiten des Eintrags');
    }
  };

  if (hasError) {
    return (
      <div className="border rounded-lg p-3 bg-red-50 border-red-200">
        <div className="flex items-center gap-2 text-red-600 mb-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">Fehler</span>
        </div>
        <p className="text-sm text-red-600 mb-2">{errorMessage}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setHasError(false);
            setErrorMessage('');
          }}
        >
          Erneut versuchen
        </Button>
      </div>
    );
  }

  if (!safeData.isValid) {
    return (
      <div className="border rounded-lg p-3 bg-yellow-50 border-yellow-200">
        <div className="flex items-center gap-2 text-yellow-600">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Ungültige Daten - Eintrag kann nicht angezeigt werden</span>
        </div>
      </div>
    );
  }

  try {
    if (entry?.isEditing && !disabled) {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium min-w-[60px]">Dauer:</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="23"
                value={safeData.hours}
                onChange={(e) => safeUpdate('hours', e.target.value)}
                className="w-20"
                placeholder="0"
              />
              <span className="text-sm">h</span>
              <Input
                type="number"
                min="0"
                max="59"
                value={safeData.minutes}
                onChange={(e) => safeUpdate('minutes', e.target.value)}
                className="w-20"
                placeholder="0"
              />
              <span className="text-sm">min</span>
            </div>
          </div>

          {/* Kategorie-Dropdown - FIXED VERSION */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium min-w-[60px]">Kategorie:</span>
            {safeDropdownOptions.length > 0 ? (
              <Select
                value={safeData.category === 'no-category' ? '' : safeData.category}
                onValueChange={(value) => {
                  const processedValue = value && String(value).trim() !== '' ? String(value).trim() : 'no-category';
                  console.log('Select value changed:', value, 'processed:', processedValue);
                  safeUpdate('category', processedValue);
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Kategorie auswählen..." />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="no-category-fallback">Keine Kategorie</SelectItem>
                  {safeDropdownOptions.map((option: string, index: number) => {
                    // KRITISCHER FIX: Zusätzliche Validierung vor dem Rendern
                    const trimmedOption = String(option || '').trim();
                    if (!trimmedOption || trimmedOption.length === 0) {
                      console.warn('Skipping invalid option at index', index, 'value:', option);
                      return null;
                    }
                    
                    // Sicherstellen, dass der Wert niemals leer ist
                    const safeValue = trimmedOption || `fallback-${index}`;
                    
                    return (
                      <SelectItem 
                        key={`option-${index}-${safeValue}`} 
                        value={safeValue}
                      >
                        {trimmedOption}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex-1 p-2 border rounded bg-muted text-muted-foreground text-sm">
                Keine Kategorien verfügbar
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <span className="text-sm font-medium min-w-[60px] mt-2">Notizen:</span>
            <Textarea
              value={safeData.text}
              onChange={(e) => safeUpdate('text', e.target.value)}
              placeholder="Eintrag für diesen Tag..."
              className="flex-1 min-h-[80px]"
              maxLength={1000}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={safeDelete}
              className="text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4 mr-1" />
              Löschen
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={safeConfirm}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4 mr-1" />
              Bestätigen
            </Button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                Dauer: {safeData.hours}h {safeData.minutes}min
              </span>
              {safeData.category && safeData.category !== 'no-category' && (
                <span className="text-sm text-muted-foreground">
                  Kategorie: {safeData.category}
                </span>
              )}
            </div>
            {!disabled && (
              <Button
                variant="outline"
                size="sm"
                onClick={safeEdit}
              >
                <Edit className="w-4 h-4 mr-1" />
                Bearbeiten
              </Button>
            )}
          </div>
          
          {safeData.text && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
              {safeData.text}
            </div>
          )}
          
          {entry?.lastEditedBy && (
            <div className="text-xs text-muted-foreground">
              Zuletzt bearbeitet von: {String(entry.lastEditedBy)}
              {entry?.lastEditedAt && (
                <span className="ml-2">
                  am {new Date(entry.lastEditedAt).toLocaleDateString('de-DE')}
                </span>
              )}
            </div>
          )}
        </div>
      );
    }
  } catch (error) {
    console.error('Critical error in SafeEntryRenderer:', error);
    return (
      <div className="border rounded-lg p-3 bg-red-50 border-red-200">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Kritischer Fehler beim Anzeigen dieses Eintrags</span>
        </div>
      </div>
    );
  }
};

const WeeklySchedulePopupContent = ({
  isOpen,
  onClose,
  value,
  onSave,
  dropdownOptions = null,
  disabled = false,
}: WeeklySchedulePopupProps) => {
  const [weekData, setWeekData] = useState<WeeklyScheduleData>(() => ({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
  }));
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { user } = useAuth();

  const currentUsername = useMemo(() => {
    try {
      return user?.user_metadata?.username || user?.email || 'Unbekannt';
    } catch (error) {
      console.error('Error getting username:', error);
      return 'Unbekannt';
    }
  }, [user]);

  useEffect(() => {
    if (!isOpen) return;

    try {
      console.log('WeeklySchedulePopup opening with value:', value);
      
      if (!value || typeof value !== 'object') {
        console.log('No valid data provided, using empty week data');
        setWeekData({
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
        });
        setHasError(false);
        setErrorMessage('');
        return;
      }

      const validatedData = validateWeekData(value, currentUsername);
      console.log('Validated data:', validatedData);
      setWeekData(validatedData);
      setHasError(false);
      setErrorMessage('');
    } catch (error) {
      console.error('Error loading week data:', error);
      setHasError(true);
      setErrorMessage('Fehler beim Laden der Wochendaten');
      setWeekData({
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
      });
    }
  }, [value, isOpen, currentUsername]);

  const addNewEntry = (day: keyof WeeklyScheduleData) => {
    if (disabled) return;
    
    try {
      setWeekData(prev => ({
        ...prev,
        [day]: [...(prev[day] || []), createDefaultDayEntry(true, currentUsername)]
      }));
    } catch (error) {
      console.error('Error adding new entry:', error);
      setHasError(true);
      setErrorMessage('Fehler beim Hinzufügen eines neuen Eintrags');
    }
  };

  const updateDayEntry = (day: keyof WeeklyScheduleData, entryId: string, field: keyof DayEntry, newValue: any) => {
    if (disabled) return;
    
    try {
      console.log('Updating day entry:', { day, entryId, field, newValue });
      
      setWeekData(prev => ({
        ...prev,
        [day]: (prev[day] || []).map(entry => {
          if (entry?.id !== entryId) return entry;
          
          let processedValue = newValue;
          
          if (field === 'hours' || field === 'minutes') {
            processedValue = Math.max(0, Math.min(field === 'hours' ? 23 : 59, Number(newValue) || 0));
          } else if (field === 'category') {
            if (newValue === 'no-category-select') {
              processedValue = 'no-category';
            } else {
              processedValue = newValue && String(newValue).trim() !== '' ? String(newValue) : 'no-category';
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
      setHasError(true);
      setErrorMessage('Fehler beim Aktualisieren des Eintrags');
    }
  };

  const confirmEntry = (day: keyof WeeklyScheduleData, entryId: string) => {
    if (disabled) return;
    
    try {
      setWeekData(prev => ({
        ...prev,
        [day]: (prev[day] || []).map(entry => 
          entry?.id === entryId 
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
      setHasError(true);
      setErrorMessage('Fehler beim Bestätigen des Eintrags');
    }
  };

  const deleteEntry = (day: keyof WeeklyScheduleData, entryId: string) => {
    if (disabled) return;
    
    try {
      setWeekData(prev => ({
        ...prev,
        [day]: (prev[day] || []).filter(entry => entry?.id !== entryId)
      }));
    } catch (error) {
      console.error('Error deleting entry:', error);
      setHasError(true);
      setErrorMessage('Fehler beim Löschen des Eintrags');
    }
  };

  const editEntry = (day: keyof WeeklyScheduleData, entryId: string) => {
    if (disabled) return;
    
    try {
      setWeekData(prev => ({
        ...prev,
        [day]: (prev[day] || []).map(entry => 
          entry?.id === entryId 
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
      setHasError(true);
      setErrorMessage('Fehler beim Bearbeiten des Eintrags');
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
      setHasError(true);
      setErrorMessage('Fehler beim Speichern der Daten');
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
      return dropdownOptions
        .filter(option => option != null && String(option).trim().length > 0)
        .map(option => String(option))
        .filter(option => option.trim() !== '');
    } catch (error) {
      console.error('Error processing dropdown options:', error);
      return [];
    }
  }, [dropdownOptions]);

  if (!isOpen) {
    return null;
  }

  if (hasError) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="bg-background max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Fehler
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {errorMessage || 'Ein unbekannter Fehler ist aufgetreten.'}
            </p>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setHasError(false);
                  setErrorMessage('');
                  try {
                    const validatedData = validateWeekData(value, currentUsername);
                    setWeekData(validatedData);
                  } catch (error) {
                    console.error('Error resetting data:', error);
                    setWeekData({
                      monday: [],
                      tuesday: [],
                      wednesday: [],
                      thursday: [],
                      friday: [],
                    });
                  }
                }}
              >
                Erneut versuchen
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Schließen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
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
          {[
            { key: 'monday', label: 'Montag' },
            { key: 'tuesday', label: 'Dienstag' },
            { key: 'wednesday', label: 'Mittwoch' },
            { key: 'thursday', label: 'Donnerstag' },
            { key: 'friday', label: 'Freitag' },
          ].map(({ key, label }) => {
            const dayEntries = weekData[key as keyof WeeklyScheduleData] || [];
            
            return (
              <div key={key} className="border rounded-lg p-4 bg-muted/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-sm">{label}</h3>
                  {!disabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addNewEntry(key as keyof WeeklyScheduleData)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Neuer Eintrag
                    </Button>
                  )}
                </div>
                
                <div className="space-y-4">
                  {dayEntries.map((entry) => {
                    if (!entry || !entry.id) {
                      return (
                        <div key={Math.random()} className="border rounded-lg p-3 bg-red-50 border-red-200">
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm">Ungültiger Eintrag</span>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div 
                        key={entry.id} 
                        className={`border rounded-lg p-3 ${
                          entry.isConfirmed && !entry.isEditing 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-background border-border'
                        }`}
                      >
                        <SafeEntryRenderer
                          entry={entry}
                          day={key}
                          entryId={entry.id}
                          disabled={disabled}
                          onUpdate={updateDayEntry}
                          onConfirm={confirmEntry}
                          onDelete={deleteEntry}
                          onEdit={editEntry}
                          dropdownOptions={safeDropdownOptions}
                        />
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

export default WeeklySchedulePopup;
