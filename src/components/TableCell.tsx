
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CellData, TableMode } from "@/hooks/useTableState";

interface TableCellProps {
  cell: CellData;
  rowIndex: number;
  colIndex: number;
  mode: TableMode;
  onCellUpdate: (rowIndex: number, colIndex: number, value: any) => void;
}

export const TableCell = ({ 
  cell, 
  rowIndex, 
  colIndex, 
  mode, 
  onCellUpdate 
}: TableCellProps) => {
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
            onCellUpdate(rowIndex, colIndex, checked);
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
            onCellUpdate(rowIndex, colIndex, value);
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
            onCellUpdate(rowIndex, colIndex, e.target.value);
          }}
          className="w-full"
          placeholder="Text eingeben..."
        />
      );
  }
};
