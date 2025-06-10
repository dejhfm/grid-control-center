
import { TableCell } from "@/components/TableCell";
import { CellData, TableMode } from "@/hooks/useTableState";

interface TableRowProps {
  row: CellData[];
  rowIndex: number;
  mode: TableMode;
  tableId: string;
  onCellUpdate: (rowIndex: number, colIndex: number, value: any) => void;
}

export const TableRow = ({ 
  row, 
  rowIndex, 
  mode, 
  tableId,
  onCellUpdate 
}: TableRowProps) => {
  return (
    <tr className="border-t hover:bg-muted/50">
      {row.map((cell, colIndex) => (
        <td key={`${rowIndex}-${colIndex}`} className="p-3">
          <TableCell
            cell={cell}
            rowIndex={rowIndex}
            colIndex={colIndex}
            mode={mode}
            tableId={tableId}
            onCellUpdate={onCellUpdate}
          />
        </td>
      ))}
    </tr>
  );
};
