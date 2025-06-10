
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTableColumns, useTableData, useUpdateCellValue } from "@/hooks/useTableData";
import { useTableState, TableMode } from "@/hooks/useTableState";
import { TableModeSelector } from "@/components/TableModeSelector";
import { TableHeader } from "@/components/TableHeader";
import { TableRow } from "@/components/TableRow";
import { ColumnConfigModal } from "@/components/ColumnConfigModal";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

interface InteractiveTableProps {
  tableName: string;
  tableId: string;
  canEdit?: boolean;
  canStructure?: boolean;
}

export const InteractiveTable = ({ 
  tableName, 
  tableId,
  canEdit = true,
  canStructure = true 
}: InteractiveTableProps) => {
  const [mode, setMode] = useState<TableMode>('view');
  const [configColumn, setConfigColumn] = useState<Tables<'table_columns'> | null>(null);
  const { data: columns = [], isLoading: columnsLoading } = useTableColumns(tableId);
  const { data: tableData = [], isLoading: dataLoading } = useTableData(tableId);
  const updateCellMutation = useUpdateCellValue();
  const { toast } = useToast();

  const { data, setData, addRow } = useTableState(columns, tableData);

  const updateCellValue = useCallback(async (rowIndex: number, colIndex: number, value: any) => {
    const column = columns[colIndex];
    if (!column) {
      console.error('Column not found at index:', colIndex);
      return;
    }

    console.log('UpdateCellValue called:', { rowIndex, colIndex, value, columnId: column.id });

    // Update local state immediately for better UX (optimistic update)
    setData(prevData => {
      const newData = [...prevData];
      if (newData[rowIndex] && newData[rowIndex][colIndex]) {
        newData[rowIndex][colIndex] = { 
          ...newData[rowIndex][colIndex], 
          value 
        };
      }
      return newData;
    });

    // Update in database
    try {
      await updateCellMutation.mutateAsync({
        tableId,
        rowIndex,
        columnId: column.id,
        value,
      });
      
      toast({
        title: "Erfolgreich gespeichert",
        description: "Die Änderung wurde automatisch gespeichert.",
      });
    } catch (error) {
      console.error('Error updating cell:', error);
      
      // Revert optimistic update on error
      setData(prevData => {
        const revertedData = [...prevData];
        const originalCellData = tableData.find(d => d.row_index === rowIndex && d.column_id === column.id);
        let originalValue;
        
        if (column.column_type === 'checkbox') {
          originalValue = originalCellData?.value === true || originalCellData?.value === 'true';
        } else {
          originalValue = originalCellData?.value || '';
        }
        
        if (revertedData[rowIndex] && revertedData[rowIndex][colIndex]) {
          revertedData[rowIndex][colIndex] = { 
            ...revertedData[rowIndex][colIndex], 
            value: originalValue
          };
        }
        return revertedData;
      });
      
      toast({
        title: "Fehler beim Speichern",
        description: "Die Änderung konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  }, [columns, tableData, tableId, updateCellMutation, toast, setData]);

  if (columnsLoading || dataLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{tableName}</h2>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Lade Tabellendaten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{tableName}</h2>
        <TableModeSelector
          mode={mode}
          onModeChange={setMode}
          canEdit={canEdit}
          canStructure={canStructure}
        />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <TableHeader
              columns={columns}
              mode={mode}
              canStructure={canStructure}
              onConfigColumn={setConfigColumn}
            />
            <tbody>
              {data.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  row={row}
                  rowIndex={rowIndex}
                  mode={mode}
                  tableId={tableId}
                  onCellUpdate={updateCellValue}
                />
              ))}
            </tbody>
          </table>
        </div>
        
        {(mode === 'edit' || mode === 'structure') && canEdit && (
          <div className="p-3 border-t bg-muted/50">
            <Button size="sm" onClick={addRow} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Zeile hinzufügen
            </Button>
          </div>
        )}
      </div>

      {configColumn && (
        <ColumnConfigModal
          isOpen={!!configColumn}
          onClose={() => setConfigColumn(null)}
          column={configColumn}
        />
      )}
    </div>
  );
};
