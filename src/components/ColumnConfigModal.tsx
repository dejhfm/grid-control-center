
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { useUpdateColumn } from '@/hooks/useTableData';
import { useToast } from '@/hooks/use-toast';
import { getCurrentYear } from '@/utils/calendarWeeks';

type ColumnType = 'text' | 'checkbox' | 'select' | 'pdf_upload' | 'calendar_weeks' | 'weekly_schedule' | 'user_dropdown';

interface ColumnConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  column: Tables<'table_columns'>;
}

export const ColumnConfigModal = ({
  isOpen,
  onClose,
  column,
}: ColumnConfigModalProps) => {
  const [columnType, setColumnType] = useState<ColumnType>(column.column_type as ColumnType);
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');
  const [calendarYear, setCalendarYear] = useState<number>(getCurrentYear());
  const updateColumnMutation = useUpdateColumn();
  const { toast } = useToast();

  // Sichere Extraktion von Optionen aus der Datenbank
  const safeExtractOptions = (dbOptions: any): string[] => {
    try {
      if (!dbOptions) return [];
      
      if (Array.isArray(dbOptions)) {
        return dbOptions
          .filter(option => option != null) // Filtere null/undefined aus
          .map(option => String(option).trim()) // Konvertiere zu String
          .filter(option => option.length > 0); // Filtere leere Strings aus
      }
      
      return [];
    } catch (error) {
      console.error('Error extracting options:', error);
      return [];
    }
  };

  // Sichere Extraktion des Kalenderjahrs
  const safeExtractCalendarYear = (dbOptions: any): number => {
    try {
      if (dbOptions && typeof dbOptions === 'object' && !Array.isArray(dbOptions)) {
        const year = dbOptions.year;
        if (typeof year === 'number' && year > 2000 && year < 3000) {
          return year;
        }
      }
      return getCurrentYear();
    } catch (error) {
      console.error('Error extracting calendar year:', error);
      return getCurrentYear();
    }
  };

  useEffect(() => {
    if (isOpen && column) {
      try {
        setColumnType(column.column_type as ColumnType);
        
        if (column.column_type === 'select' || column.column_type === 'weekly_schedule' || column.column_type === 'user_dropdown') {
          const extractedOptions = safeExtractOptions(column.options);
          console.log('Loading options for', column.column_type, ':', extractedOptions);
          setOptions(extractedOptions);
        } else {
          setOptions([]);
        }

        if (column.column_type === 'calendar_weeks') {
          const extractedYear = safeExtractCalendarYear(column.options);
          console.log('Loading calendar year:', extractedYear);
          setCalendarYear(extractedYear);
        } else {
          setCalendarYear(getCurrentYear());
        }

        setNewOption('');
      } catch (error) {
        console.error('Error in ColumnConfigModal useEffect:', error);
        setOptions([]);
        setCalendarYear(getCurrentYear());
        setNewOption('');
      }
    }
  }, [column, isOpen]);

  const addOption = () => {
    try {
      const trimmedOption = newOption.trim();
      if (trimmedOption && !options.includes(trimmedOption)) {
        setOptions(prev => [...prev, trimmedOption]);
        setNewOption('');
      }
    } catch (error) {
      console.error('Error adding option:', error);
    }
  };

  const removeOption = (index: number) => {
    try {
      setOptions(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Error removing option:', error);
    }
  };

  const updateOption = (index: number, value: string) => {
    try {
      const trimmedValue = value.trim();
      setOptions(prev => {
        const newOptions = [...prev];
        newOptions[index] = trimmedValue;
        return newOptions;
      });
    } catch (error) {
      console.error('Error updating option:', error);
    }
  };

  const handleSave = async () => {
    try {
      let finalOptions: any = null;

      if (columnType === 'select' || columnType === 'weekly_schedule' || columnType === 'user_dropdown') {
        // Nur nicht-leere Optionen speichern
        const validOptions = options.filter(opt => opt.trim().length > 0);
        finalOptions = validOptions.length > 0 ? validOptions : null;
        console.log('Saving options for', columnType, ':', finalOptions);
      } else if (columnType === 'calendar_weeks') {
        finalOptions = { year: calendarYear };
        console.log('Saving calendar year:', finalOptions);
      }

      await updateColumnMutation.mutateAsync({
        columnId: column.id,
        columnType: columnType,
        options: finalOptions,
      });

      toast({
        title: "Spalte aktualisiert",
        description: "Die Spalteneinstellungen wurden erfolgreich gespeichert.",
      });

      onClose();
    } catch (error) {
      console.error('Error updating column:', error);
      toast({
        title: "Fehler",
        description: "Die Spalte konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  const handleColumnTypeChange = (value: string) => {
    try {
      const newType = value as ColumnType;
      setColumnType(newType);
      
      // Reset nur wenn Typ wechselt
      if (newType !== 'select' && newType !== 'weekly_schedule' && newType !== 'user_dropdown') {
        setOptions([]);
      }
      if (newType !== 'calendar_weeks') {
        setCalendarYear(getCurrentYear());
      }
    } catch (error) {
      console.error('Error changing column type:', error);
    }
  };

  const shouldShowOptions = columnType === 'select' || columnType === 'weekly_schedule';
  const shouldShowCalendarYear = columnType === 'calendar_weeks';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background max-w-md">
        <DialogHeader>
          <DialogTitle>Spalte konfigurieren: {column.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="column-type">Spaltentyp</Label>
            <Select value={columnType} onValueChange={handleColumnTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="select">Auswahl</SelectItem>
                <SelectItem value="pdf_upload">PDF Upload</SelectItem>
                <SelectItem value="calendar_weeks">Kalenderwochen</SelectItem>
                <SelectItem value="weekly_schedule">Wochenplan-Eingabe</SelectItem>
                <SelectItem value="user_dropdown">User-Dropdown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {shouldShowCalendarYear && (
            <div>
              <Label htmlFor="calendar-year">Jahr für Kalenderwochen</Label>
              <Input
                id="calendar-year"
                type="number"
                min="2020"
                max="2030"
                value={calendarYear}
                onChange={(e) => {
                  const year = parseInt(e.target.value);
                  if (!isNaN(year)) {
                    setCalendarYear(year);
                  }
                }}
                className="w-full"
              />
            </div>
          )}

          {shouldShowOptions && (
            <div>
              <Label>
                {columnType === 'select' ? 'Auswahloptionen' : 'Kategorien für Wochenplan'}
              </Label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={`option-${index}-${option}`} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="flex-1"
                      placeholder="Option eingeben..."
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index)}
                      type="button"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                <div className="flex items-center gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder={columnType === 'select' ? 'Neue Option...' : 'Neue Kategorie...'}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addOption();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    disabled={!newOption.trim()}
                    type="button"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} type="button">
            Abbrechen
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={updateColumnMutation.isPending}
            type="button"
          >
            {updateColumnMutation.isPending ? 'Speichert...' : 'Speichern'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
