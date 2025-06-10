
import { useState, useEffect, useMemo } from 'react';
import { Tables } from '@/integrations/supabase/types';

export type CellType = 'text' | 'checkbox' | 'select' | 'pdf_upload' | 'calendar_weeks' | 'weekly_schedule';
export type TableMode = 'view' | 'edit' | 'structure';

export interface CellData {
  value: any;
  type: CellType;
  options?: string[];
  year?: number;
}

// Helper function to create default weekly schedule data
const createDefaultWeeklySchedule = () => ({
  monday: { text: '', category: '', hours: 0, minutes: 0 },
  tuesday: { text: '', category: '', hours: 0, minutes: 0 },
  wednesday: { text: '', category: '', hours: 0, minutes: 0 },
  thursday: { text: '', category: '', hours: 0, minutes: 0 },
  friday: { text: '', category: '', hours: 0, minutes: 0 },
});

// Helper function to validate weekly schedule data
const validateWeeklyScheduleData = (data: any) => {
  try {
    if (!data || typeof data !== 'object') {
      return null;
    }

    // Check if it has the expected structure
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const hasValidStructure = days.every(day => {
      const dayData = data[day];
      return dayData && typeof dayData === 'object';
    });

    if (hasValidStructure) {
      return data;
    } else {
      console.log('Invalid weekly schedule structure, returning null');
      return null;
    }
  } catch (error) {
    console.error('Error validating weekly schedule data:', error);
    return null;
  }
};

export const useTableState = (
  columns: Tables<'table_columns'>[],
  tableData: Tables<'table_data'>[]
) => {
  const [data, setData] = useState<CellData[][]>([]);

  // Memoize the transformed data to prevent infinite loops
  const transformedData = useMemo(() => {
    if (columns.length === 0) return [];
    
    console.log('Transforming data with columns:', columns.length, 'tableData:', tableData.length);
    
    // Get the maximum row index to determine how many rows we have
    const maxRowIndex = tableData.length > 0 ? Math.max(...tableData.map(d => d.row_index)) : -1;
    const numRows = Math.max(maxRowIndex + 1, 5); // Ensure at least 5 rows

    // Create a 2D array for the table data
    const newData: CellData[][] = [];
    
    for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
      const row: CellData[] = [];
      
      for (let colIndex = 0; colIndex < columns.length; colIndex++) {
        const column = columns[colIndex];
        const cellData = tableData.find(
          d => d.row_index === rowIndex && d.column_id === column.id
        );
        
        let cellValue;
        
        try {
          if (column.column_type === 'checkbox') {
            cellValue = cellData?.value === true || cellData?.value === 'true';
          } else if (column.column_type === 'weekly_schedule') {
            // Special handling for weekly_schedule data
            if (cellData?.value) {
              cellValue = validateWeeklyScheduleData(cellData.value);
            } else {
              cellValue = null;
            }
            console.log(`Row ${rowIndex}, Col ${colIndex} - Weekly schedule value:`, cellValue);
          } else {
            cellValue = cellData?.value || '';
          }
        } catch (error) {
          console.error(`Error processing cell value for row ${rowIndex}, col ${colIndex}:`, error);
          
          // Fallback based on column type
          if (column.column_type === 'checkbox') {
            cellValue = false;
          } else if (column.column_type === 'weekly_schedule') {
            cellValue = null;
          } else {
            cellValue = '';
          }
        }
        
        // Extract year from options for calendar_weeks type
        let year;
        if (column.column_type === 'calendar_weeks' && column.options) {
          year = (column.options as any)?.year;
        }
        
        // Sichere Extraktion von Optionen für weekly_schedule und select
        let options;
        if ((column.column_type === 'weekly_schedule' || column.column_type === 'select') && column.options) {
          try {
            if (Array.isArray(column.options)) {
              // Filtere null/undefined Werte und konvertiere zu Strings
              options = column.options
                .filter(opt => opt != null)
                .map(opt => String(opt).trim())
                .filter(opt => opt.length > 0);
            } else {
              console.log('Column options is not an array:', column.options);
              options = [];
            }
            console.log(`Column ${column.name} (${column.column_type}) options:`, options);
          } catch (error) {
            console.error(`Error processing ${column.column_type} options:`, error);
            options = [];
          }
        } else {
          options = column.options as string[] | undefined;
        }
        
        row.push({
          value: cellValue,
          type: column.column_type as CellType,
          options: options,
          year: year,
        });
      }
      
      newData.push(row);
    }
    
    return newData;
  }, [columns, tableData]);

  // Update state only when transformedData actually changes
  useEffect(() => {
    setData(transformedData);
  }, [transformedData]);

  const addRow = () => {
    const newRow = columns.map(col => {
      let defaultValue;
      
      try {
        if (col.column_type === 'checkbox') {
          defaultValue = false;
        } else if (col.column_type === 'pdf_upload') {
          defaultValue = null;
        } else if (col.column_type === 'weekly_schedule') {
          defaultValue = null;
        } else {
          defaultValue = '';
        }
      } catch (error) {
        console.error('Error creating default value for new row:', error);
        defaultValue = '';
      }

      let year;
      if (col.column_type === 'calendar_weeks' && col.options) {
        year = (col.options as any)?.year;
      }

      let options;
      try {
        if ((col.column_type === 'weekly_schedule' || col.column_type === 'select') && col.options) {
          if (Array.isArray(col.options)) {
            options = col.options
              .filter(opt => opt != null)
              .map(opt => String(opt).trim())
              .filter(opt => opt.length > 0);
          } else {
            options = [];
          }
        } else {
          options = col.options as string[] | undefined;
        }
      } catch (error) {
        console.error('Error processing options for new row:', error);
        options = col.options as string[] | undefined;
      }

      return {
        value: defaultValue,
        type: col.column_type as CellType,
        options: options,
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
