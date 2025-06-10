
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
  const updateColumnMutation = useUpdateColumn();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setColumnType(column.column_type as ColumnType);
      
      // Load existing options for select and weekly_schedule columns
      if ((column.column_type === 'select' || column.column_type === 'weekly_schedule') && column.options) {
        try {
          // Safely convert JSON options to string array
          let existingOptions: string[] = [];
          
          if (Array.isArray(column.options)) {
            existingOptions = column.options.filter(option => 
              typeof option === 'string' && option.trim().length > 0
            );
          }
          
          console.log('Loading existing options:', existingOptions);
          setOptions(existingOptions);
        } catch (error) {
          console.error('Error loading column options:', error);
          setOptions([]);
        }
      } else {
        setOptions([]);
      }
      setNewOption('');
    }
  }, [column, isOpen]);

  const addOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      const finalOptions = (columnType === 'select' || columnType === 'weekly_schedule') && options.length > 0 
        ? options 
        : undefined;

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
    setColumnType(value as ColumnType);
  };

  const shouldShowOptions = columnType === 'select' || columnType === 'weekly_schedule';

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
                      onChange={(e) => {
                        const newOptions = [...options];
                        newOptions[index] = e.target.value;
                        setOptions(newOptions);
                      }}
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
