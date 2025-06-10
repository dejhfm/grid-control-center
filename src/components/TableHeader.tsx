
import { Tables } from "@/integrations/supabase/types";
import { TableMode } from "@/hooks/useTableState";
import { Settings, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAddColumn } from "@/hooks/useAddColumn";
import { useDeleteColumn } from "@/hooks/useDeleteColumn";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TableHeaderProps {
  columns: Tables<'table_columns'>[];
  mode: TableMode;
  canStructure: boolean;
  onConfigColumn: (column: Tables<'table_columns'>) => void;
}

export const TableHeader = ({ columns, mode, canStructure, onConfigColumn }: TableHeaderProps) => {
  const addColumnMutation = useAddColumn();
  const deleteColumnMutation = useDeleteColumn();
  const { toast } = useToast();
  const [newColumnName, setNewColumnName] = useState("");
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [deleteColumnId, setDeleteColumnId] = useState<string | null>(null);

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Spaltennamen ein.",
        variant: "destructive",
      });
      return;
    }

    const tableId = columns[0]?.table_id;
    if (!tableId) return;

    try {
      await addColumnMutation.mutateAsync({
        tableId,
        columnName: newColumnName.trim(),
      });
      
      setNewColumnName("");
      setShowAddColumn(false);
      
      toast({
        title: "Spalte hinzugefügt",
        description: `Die Spalte "${newColumnName}" wurde erfolgreich hinzugefügt.`,
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Die Spalte konnte nicht hinzugefügt werden.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    try {
      await deleteColumnMutation.mutateAsync(columnId);
      setDeleteColumnId(null);
      
      toast({
        title: "Spalte gelöscht",
        description: "Die Spalte wurde erfolgreich gelöscht.",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Die Spalte konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  return (
    <thead className="bg-muted/50">
      <tr>
        {columns.map((column) => (
          <th
            key={column.id}
            className="px-4 py-3 text-left font-medium text-sm border-r relative group"
          >
            <div className="flex items-center justify-between">
              <span>{column.name}</span>
              <div className="flex items-center gap-1">
                {mode === 'structure' && canStructure && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onConfigColumn(column)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Settings className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteColumnId(column.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </th>
        ))}
        
        {mode === 'structure' && canStructure && (
          <th className="px-4 py-3 text-left font-medium text-sm border-r">
            <div className="flex items-center gap-2">
              {showAddColumn ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    placeholder="Spaltenname"
                    className="w-32"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddColumn();
                      } else if (e.key === 'Escape') {
                        setShowAddColumn(false);
                        setNewColumnName("");
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleAddColumn}
                    disabled={addColumnMutation.isPending}
                  >
                    OK
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddColumn(false);
                      setNewColumnName("");
                    }}
                  >
                    Abbrechen
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddColumn(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Spalte hinzufügen
                </Button>
              )}
            </div>
          </th>
        )}
      </tr>

      <AlertDialog open={!!deleteColumnId} onOpenChange={() => setDeleteColumnId(null)}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Spalte löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie diese Spalte löschen möchten? Alle Daten in dieser Spalte gehen verloren. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteColumnId && handleDeleteColumn(deleteColumnId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </thead>
  );
};
