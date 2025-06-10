
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
      const { data, error } = await supabase
        .from('table_data')
        .upsert({
          table_id: tableId,
          row_index: rowIndex,
          column_id: columnId,
          value: value,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['table-data', variables.tableId] });
    },
  });
};
