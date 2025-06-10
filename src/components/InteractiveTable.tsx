
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Settings, Plus, Trash } from "lucide-react";

type CellType = 'text' | 'checkbox' | 'select';
type TableMode = 'view' | 'edit' | 'structure';

interface CellData {
  value: any;
  type: CellType;
  options?: string[]; // For select type
}

interface TableColumn {
  id: string;
  name: string;
  type: CellType;
  options?: string[];
}

interface InteractiveTableProps {
  tableName: string;
  initialData?: CellData[][];
  initialColumns?: TableColumn[];
  canEdit?: boolean;
  canStructure?: boolean;
}

export const InteractiveTable = ({ 
  tableName, 
  initialData = [], 
  initialColumns = [],
  canEdit = true,
  canStructure = true 
}: InteractiveTableProps) => {
  const [mode, setMode] = useState<TableMode>('view');
  const [columns, setColumns] = useState<TableColumn[]>(
    initialColumns.length > 0 ? initialColumns : [
      { id: '1', name: 'Spalte 1', type: 'text' },
      { id: '2', name: 'Spalte 2', type: 'checkbox' },
      { id: '3', name: 'Spalte 3', type: 'select', options: ['Option 1', 'Option 2', 'Option 3'] }
    ]
  );
  const [data, setData] = useState<CellData[][]>(
    initialData.length > 0 ? initialData : Array(5).fill(null).map(() => 
      columns.map(col => ({
        value: col.type === 'checkbox' ? false : col.type === 'select' ? '' : '',
        type: col.type,
        options: col.options
      }))
    )
  );

  const updateCellValue = (rowIndex: number, colIndex: number, value: any) => {
    const newData = [...data];
    newData[rowIndex][colIndex] = { ...newData[rowIndex][colIndex], value };
    setData(newData);
    // Here would be auto-save functionality
    console.log('Auto-saving...', { rowIndex, colIndex, value });
  };

  const addRow = () => {
    const newRow = columns.map(col => ({
      value: col.type === 'checkbox' ? false : '',
      type: col.type,
      options: col.options
    }));
    setData([...data, newRow]);
  };

  const addColumn = () => {
    const newColumn: TableColumn = {
      id: Date.now().toString(),
      name: `Neue Spalte`,
      type: 'text'
    };
    setColumns([...columns, newColumn]);
    
    const newData = data.map(row => [
      ...row,
      { 
        value: '', 
        type: 'text' as CellType,
        options: undefined
      }
    ]);
    setData(newData);
  };

  const updateColumnType = (colIndex: number, newType: CellType) => {
    const newColumns = [...columns];
    newColumns[colIndex] = { ...newColumns[colIndex], type: newType };
    
    if (newType === 'select' && !newColumns[colIndex].options) {
      newColumns[colIndex].options = ['Option 1', 'Option 2'];
    }
    
    setColumns(newColumns);
    
    // Update data types
    const newData = data.map(row => {
      const newRow = [...row];
      newRow[colIndex] = {
        ...newRow[colIndex],
        type: newType,
        value: newType === 'checkbox' ? false : '',
        options: newColumns[colIndex].options
      };
      return newRow;
    });
    setData(newData);
  };

  const renderCell = (cell: CellData, rowIndex: number, colIndex: number) => {
    if (mode === 'view') {
      switch (cell.type) {
        case 'checkbox':
          return <Checkbox checked={cell.value} disabled />;
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
            checked={cell.value}
            onCheckedChange={(checked) => updateCellValue(rowIndex, colIndex, checked)}
          />
        );
      case 'select':
        return (
          <Select value={cell.value} onValueChange={(value) => updateCellValue(rowIndex, colIndex, value)}>
            <SelectTrigger className="w-full">
              <SelectValue />
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
            value={cell.value}
            onChange={(e) => updateCellValue(rowIndex, colIndex, e.target.value)}
            className="w-full"
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
                {columns.map((column, colIndex) => (
                  <th key={column.id} className="p-3 text-left font-medium">
                    {mode === 'structure' ? (
                      <div className="space-y-2">
                        <Input
                          value={column.name}
                          onChange={(e) => {
                            const newColumns = [...columns];
                            newColumns[colIndex].name = e.target.value;
                            setColumns(newColumns);
                          }}
                          className="font-medium"
                        />
                        <Select
                          value={column.type}
                          onValueChange={(value: CellType) => updateColumnType(colIndex, value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background">
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                            <SelectItem value="select">Dropdown</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      column.name
                    )}
                  </th>
                ))}
                {mode === 'structure' && (
                  <th className="p-3 w-16">
                    <Button size="sm" onClick={addColumn} variant="ghost">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t hover:bg-muted/50">
                  {row.map((cell, colIndex) => (
                    <td key={colIndex} className="p-3">
                      {renderCell(cell, rowIndex, colIndex)}
                    </td>
                  ))}
                  {mode === 'structure' && (
                    <td className="p-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const newData = data.filter((_, i) => i !== rowIndex);
                          setData(newData);
                        }}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {mode === 'structure' && (
          <div className="p-3 border-t bg-muted/50">
            <Button size="sm" onClick={addRow} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Zeile hinzufügen
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
