
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
      columnType: 'text' | 'checkbox' | 'select';
      options?: string[];
    }) => {
      const { data, error } = await supabase
        .from('table_columns')
        .update({
          column_type: columnType,
          options: columnType === 'select' ? options : null,
        })
        .eq('id', columnId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['table-columns', data.table_id] });
    },
  });
};
