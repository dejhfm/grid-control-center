
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

type ColumnType = 'text' | 'checkbox' | 'select' | 'pdf_upload' | 'calendar_weeks' | 'weekly_schedule';

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

  // Helper function to safely extract options from database
  const safeExtractOptions = (dbOptions: any): string[] => {
    try {
      if (!dbOptions) return [];
      
      if (Array.isArray(dbOptions)) {
        return dbOptions
          .map(option => {
            if (typeof option === 'string') {
              return option.trim();
            } else if (typeof option === 'number' || typeof option === 'boolean') {
              return String(option).trim();
            }
            return null;
          })
          .filter((option): option is string => option !== null && option.length > 0);
      }
      
      return [];
    } catch (error) {
      console.error('Error extracting options:', error);
      return [];
    }
  };

  // Helper function to safely extract calendar year from options
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
    if (isOpen) {
      try {
        setColumnType(column.column_type as ColumnType);
        
        // Load existing options for select and weekly_schedule columns
        if (column.column_type === 'select' || column.column_type === 'weekly_schedule') {
          const extractedOptions = safeExtractOptions(column.options);
          console.log('Loading existing options:', extractedOptions);
          setOptions(extractedOptions);
        } else {
          setOptions([]);
        }

        // Load existing year for calendar_weeks columns
        if (column.column_type === 'calendar_weeks') {
          const extractedYear = safeExtractCalendarYear(column.options);
          console.log('Loading existing calendar year:', extractedYear);
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
      if (newOption.trim() && !options.includes(newOption.trim())) {
        setOptions([...options, newOption.trim()]);
        setNewOption('');
      }
    } catch (error) {
      console.error('Error adding option:', error);
    }
  };

  const removeOption = (index: number) => {
    try {
      setOptions(options.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Error removing option:', error);
    }
  };

  const updateOption = (index: number, value: string) => {
    try {
      const newOptions = [...options];
      newOptions[index] = value;
      setOptions(newOptions);
    } catch (error) {
      console.error('Error updating option:', error);
    }
  };

  const handleSave = async () => {
    try {
      let finalOptions: any = undefined;

      if (columnType === 'select' || columnType === 'weekly_schedule') {
        finalOptions = options.length > 0 ? options : undefined;
      } else if (columnType === 'calendar_weeks') {
        finalOptions = { year: calendarYear };
      }

      console.log('Saving column with options:', finalOptions);

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
      setColumnType(value as ColumnType);
      
      // Reset options when changing column type
      if (value !== 'select' && value !== 'weekly_schedule') {
        setOptions([]);
      }
      if (value !== 'calendar_weeks') {
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
                onChange={(e) => setCalendarYear(parseInt(e.target.value) || getCurrentYear())}
                className="w-full"
              />
            </div>
          )}

          {shouldShowOptions && (
            <div>
              <Label>
                {columnType === 'select' ? 'Auswahloptionen' : 'Kategorien'}
              </Label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index)}
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
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={updateColumnMutation.isPending}>
            {updateColumnMutation.isPending ? 'Speichert...' : 'Speichern'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
