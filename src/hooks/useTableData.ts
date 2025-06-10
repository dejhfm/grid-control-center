
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type TableColumn = Tables<'table_columns'>;
type TableData = Tables<'table_data'>;

export const useTableColumns = (tableId: string) => {
  return useQuery({
    queryKey: ['table-columns', tableId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('table_columns')
        .select('*')
        .eq('table_id', tableId)
        .order('column_order');

      if (error) throw error;
      return data as TableColumn[];
    },
    enabled: !!tableId,
  });
};

export const useTableData = (tableId: string) => {
  return useQuery({
    queryKey: ['table-data', tableId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('table_data')
        .select('*')
        .eq('table_id', tableId)
        .order('row_index');

      if (error) throw error;
      return data as TableData[];
    },
    enabled: !!tableId,
  });
};

export const useUpdateCellValue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tableId,
      rowIndex,
      columnId,
      value,
    }: {
      tableId: string;
      rowIndex: number;
      columnId: string;
      value: any;
    }) => {
      console.log('Updating cell value:', { tableId, rowIndex, columnId, value });
      
      // First check if a record exists
      const { data: existingData } = await supabase
        .from('table_data')
        .select('id')
        .eq('table_id', tableId)
        .eq('row_index', rowIndex)
        .eq('column_id', columnId)
        .maybeSingle();

      let result;
      
      if (existingData) {
        // Update existing record
        const { data, error } = await supabase
          .from('table_data')
          .update({ value: value })
          .eq('table_id', tableId)
          .eq('row_index', rowIndex)
          .eq('column_id', columnId)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('table_data')
          .insert({
            table_id: tableId,
            row_index: rowIndex,
            column_id: columnId,
            value: value,
          })
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      console.log('Cell update successful:', result);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['table-data', variables.tableId] });
    },
    onError: (error) => {
      console.error('Error updating cell:', error);
    },
  });
};

export const useUpdateColumn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      columnId,
      columnType,
      options,
    }: {
      columnId: string;
      columnType: 'text' | 'checkbox' | 'select' | 'pdf_upload' | 'calendar_weeks' | 'weekly_schedule' | 'user_dropdown';
      options?: any;
    }) => {
      console.log('Updating column:', { columnId, columnType, options });
      
      // Sichere Datenverarbeitung für options
      let processedOptions = null;
      
      if (options !== undefined && options !== null) {
        if (columnType === 'select' || columnType === 'weekly_schedule' || columnType === 'user_dropdown') {
          // Für select, weekly_schedule und user_dropdown: Array von Strings
          if (Array.isArray(options) && options.length > 0) {
            processedOptions = options.filter(opt => 
              opt != null && String(opt).trim().length > 0
            );
            if (processedOptions.length === 0) {
              processedOptions = null;
            }
          }
        } else if (columnType === 'calendar_weeks') {
          // Für calendar_weeks: Objekt mit year
          if (typeof options === 'object' && options.year) {
            processedOptions = { year: options.year };
          }
        }
      }

      console.log('Processed options:', processedOptions);

      const { data, error } = await supabase
        .from('table_columns')
        .update({
          column_type: columnType,
          options: processedOptions,
        })
        .eq('id', columnId)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log('Column updated successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Invalidating queries for table:', data.table_id);
      queryClient.invalidateQueries({ queryKey: ['table-columns', data.table_id] });
      queryClient.invalidateQueries({ queryKey: ['table-data', data.table_id] });
    },
    onError: (error) => {
      console.error('Error in useUpdateColumn:', error);
    },
  });
};
