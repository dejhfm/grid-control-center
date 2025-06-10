import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Settings, Plus, Trash, Cog } from "lucide-react";
import { useTableColumns, useTableData, useUpdateCellValue, useUpdateColumn } from "@/hooks/useTableData";
import { ColumnConfigModal } from "@/components/ColumnConfigModal";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type CellType = 'text' | 'checkbox' | 'select';
type TableMode = 'view' | 'edit' | 'structure';

interface CellData {
  value: any;
  type: CellType;
  options?: string[];
}

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
  const updateColumnMutation = useUpdateColumn();
  const { toast } = useToast();

  // Transform database data into the component's expected format
  const [data, setData] = useState<CellData[][]>([]);

  useEffect(() => {
    if (columns.length > 0) {
      console.log('Transforming data with columns:', columns.length, 'tableData:', tableData.length);
      
      // Get the maximum row index to determine how many rows we have
      const maxRowIndex = tableData.length > 0 ? Math.max(...tableData.map(d => d.row_index)) : -1;
      const numRows = Math.max(maxRowIndex + 1, 5); // Ensure at least 5 rows

      // Create a 2D array for the table data
      const transformedData: CellData[][] = [];
      
      for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
        const row: CellData[] = [];
        
        for (let colIndex = 0; colIndex < columns.length; colIndex++) {
          const column = columns[colIndex];
          const cellData = tableData.find(
            d => d.row_index === rowIndex && d.column_id === column.id
          );
          
          let cellValue;
          if (column.column_type === 'checkbox') {
            cellValue = cellData?.value === true || cellData?.value === 'true';
          } else {
            cellValue = cellData?.value || '';
          }
          
          row.push({
            value: cellValue,
            type: column.column_type as CellType,
            options: column.options as string[] | undefined,
          });
        }
        
        transformedData.push(row);
      }
      
      setData(transformedData);
    }
  }, [columns, tableData]);

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
  }, [columns, tableData, tableId, updateCellMutation, toast]);

  const addRow = () => {
    const newRow = columns.map(col => ({
      value: col.column_type === 'checkbox' ? false : '',
      type: col.column_type as CellType,
      options: col.options as string[] | undefined
    }));
    setData([...data, newRow]);
  };

  const renderCell = (cell: CellData, rowIndex: number, colIndex: number) => {
    const cellKey = `${rowIndex}-${colIndex}-${cell.value}`;
    
    if (mode === 'view') {
      switch (cell.type) {
        case 'checkbox':
          return <Checkbox checked={Boolean(cell.value)} disabled />;
        case 'select':
          return <span className="text-sm">{cell.value || '-'}</span>;
        default:
          return <span className="text-sm">{cell.value || '-'}</span>;
      }
    }

    switch (cell.type) {
      case 'checkbox':
        return (
          <Checkbox
            key={cellKey}
            checked={Boolean(cell.value)}
            onCheckedChange={(checked) => {
              console.log('Checkbox changed:', { rowIndex, colIndex, checked });
              updateCellValue(rowIndex, colIndex, checked);
            }}
          />
        );
      case 'select':
        return (
          <Select 
            key={cellKey}
            value={String(cell.value || '')} 
            onValueChange={(value) => {
              console.log('Select changed:', { rowIndex, colIndex, value });
              updateCellValue(rowIndex, colIndex, value);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Auswählen..." />
            </SelectTrigger>
            <SelectContent className="bg-background">
              {cell.options?.map((option, i) => (
                <SelectItem key={i} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            key={cellKey}
            value={String(cell.value || '')}
            onChange={(e) => {
              console.log('Input changed:', { rowIndex, colIndex, value: e.target.value });
              updateCellValue(rowIndex, colIndex, e.target.value);
            }}
            className="w-full"
            placeholder="Text eingeben..."
          />
        );
    }
  };

  const getModeText = (currentMode: TableMode) => {
    switch (currentMode) {
      case 'view': return 'Ansicht';
      case 'edit': return 'Bearbeitung';
      case 'structure': return 'Struktur';
    }
  };

  const getModeColor = (currentMode: TableMode) => {
    switch (currentMode) {
      case 'view': return 'bg-gray-100 text-gray-800';
      case 'edit': return 'bg-blue-100 text-blue-800';
      case 'structure': return 'bg-green-100 text-green-800';
    }
  };

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
        <div className="flex items-center space-x-2">
          <Badge className={getModeColor(mode)}>
            {getModeText(mode)}
          </Badge>
          <div className="flex space-x-1">
            <Button
              variant={mode === 'view' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('view')}
            >
              <Eye className="w-4 h-4" />
            </Button>
            {canEdit && (
              <Button
                variant={mode === 'edit' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('edit')}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {canStructure && (
              <Button
                variant={mode === 'structure' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('structure')}
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                {columns.map((column) => (
                  <th key={column.id} className="p-3 text-left font-medium">
                    <div className="flex items-center justify-between">
                      <span>{column.name}</span>
                      {mode === 'structure' && canStructure && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfigColumn(column)}
                        >
                          <Cog className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t hover:bg-muted/50">
                  {row.map((cell, colIndex) => (
                    <td key={`${rowIndex}-${colIndex}`} className="p-3">
                      {renderCell(cell, rowIndex, colIndex)}
                    </td>
                  ))}
                </tr>
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
