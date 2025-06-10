
import { useState, useEffect } from 'react';
import { Tables } from '@/integrations/supabase/types';

export type CellType = 'text' | 'checkbox' | 'select' | 'pdf_upload' | 'calendar_weeks' | 'weekly_schedule';
export type TableMode = 'view' | 'edit' | 'structure';

export interface CellData {
  value: any;
  type: CellType;
  options?: string[];
  year?: number;
}

export const useTableState = (
  columns: Tables<'table_columns'>[],
  tableData: Tables<'table_data'>[]
) => {
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
          
          // Extract year from options for calendar_weeks type
          let year;
          if (column.column_type === 'calendar_weeks' && column.options) {
            year = (column.options as any)?.year;
          }
          
          row.push({
            value: cellValue,
            type: column.column_type as CellType,
            options: column.options as string[] | undefined,
            year: year,
          });
        }
        
        transformedData.push(row);
      }
      
      setData(transformedData);
    }
  }, [columns, tableData]);

  const addRow = () => {
    const newRow = columns.map(col => {
      let defaultValue;
      if (col.column_type === 'checkbox') {
        defaultValue = false;
      } else if (col.column_type === 'pdf_upload') {
        defaultValue = null;
      } else {
        defaultValue = '';
      }

      let year;
      if (col.column_type === 'calendar_weeks' && col.options) {
        year = (col.options as any)?.year;
      }

      return {
        value: defaultValue,
        type: col.column_type as CellType,
        options: col.options as string[] | undefined,
        year: year,
      };
    });
    setData(prevData => [...prevData, newRow]);
  };

  return {
    data,
    setData,
    addRow
  };
};
