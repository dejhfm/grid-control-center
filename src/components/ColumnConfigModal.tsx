
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type TableColumn = Tables<'table_columns'>;

interface ColumnConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  column: TableColumn;
}

export const ColumnConfigModal = ({ isOpen, onClose, column }: ColumnConfigModalProps) => {
  const [columnType, setColumnType] = useState<'text' | 'checkbox' | 'select'>(column.column_type);
  const [options, setOptions] = useState<string[]>((column.options as string[]) || []);
  const [newOption, setNewOption] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateColumnMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('table_columns')
        .update({
          column_type: columnType,
          options: columnType === 'select' ? options : null,
        })
        .eq('id', column.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table-columns', column.table_id] });
      toast({
        title: 'Spalte aktualisiert',
        description: 'Die Spalten-Konfiguration wurde gespeichert.',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const addOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const removeOption = (optionToRemove: string) => {
    setOptions(options.filter(option => option !== optionToRemove));
  };

  const handleSave = () => {
    updateColumnMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background">
        <DialogHeader>
          <DialogTitle>Spalte konfigurieren: {column.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Feld-Typ</label>
            <Select value={columnType} onValueChange={(value: 'text' | 'checkbox' | 'select') => setColumnType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="text">Textfeld</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="select">Dropdown-Liste</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {columnType === 'select' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Auswahlmöglichkeiten</label>
              
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Neue Option hinzufügen"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addOption()}
                  className="flex-1"
                />
                <Button onClick={addOption} disabled={!newOption.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {options.map((option, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {option}
                    <button
                      onClick={() => removeOption(option)}
                      className="ml-1 text-xs hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={updateColumnMutation.isPending}>
              Speichern
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
