
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CellData, TableMode } from "@/hooks/useTableState";
import { PdfUploadCell } from "@/components/PdfUploadCell";

interface TableCellProps {
  cell: CellData;
  rowIndex: number;
  colIndex: number;
  mode: TableMode;
  tableId: string;
  onCellUpdate: (rowIndex: number, colIndex: number, value: any) => void;
}

export const TableCell = ({ 
  cell, 
  rowIndex, 
  colIndex, 
  mode, 
  tableId,
  onCellUpdate 
}: TableCellProps) => {
  // Remove cellKey to fix text input bug - React doesn't need to recreate components
  
  if (mode === 'view') {
    switch (cell.type) {
      case 'checkbox':
        return <Checkbox checked={Boolean(cell.value)} disabled />;
      case 'select':
        return <span className="text-sm">{cell.value || '-'}</span>;
      case 'pdf_upload':
        return (
          <PdfUploadCell
            value={cell.value}
            rowIndex={rowIndex}
            colIndex={colIndex}
            tableId={tableId}
            onCellUpdate={onCellUpdate}
            disabled={true}
          />
        );
      default:
        return <span className="text-sm">{cell.value || '-'}</span>;
    }
  }

  switch (cell.type) {
    case 'checkbox':
      return (
        <Checkbox
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
    case 'pdf_upload':
      return (
        <PdfUploadCell
          value={cell.value}
          rowIndex={rowIndex}
          colIndex={colIndex}
          tableId={tableId}
          onCellUpdate={onCellUpdate}
          disabled={false}
        />
      );
    default:
      return (
        <Input
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
