
import { Button } from "@/components/ui/button";
import { Cog } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { TableMode } from "@/hooks/useTableState";

interface TableHeaderProps {
  columns: Tables<'table_columns'>[];
  mode: TableMode;
  canStructure: boolean;
  onConfigColumn: (column: Tables<'table_columns'>) => void;
}

export const TableHeader = ({ 
  columns, 
  mode, 
  canStructure, 
  onConfigColumn 
}: TableHeaderProps) => {
  return (
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
                  onClick={() => onConfigColumn(column)}
                >
                  <Cog className="w-4 h-4" />
                </Button>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
};
