
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAddColumn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tableId, columnName }: { tableId: string; columnName: string }) => {
      // Get the current max column order
      const { data: existingColumns } = await supabase
        .from('table_columns')
        .select('column_order')
        .eq('table_id', tableId)
        .order('column_order', { ascending: false })
        .limit(1);

      const newColumnOrder = existingColumns && existingColumns.length > 0 
        ? existingColumns[0].column_order + 1 
        : 0;

      const { data, error } = await supabase
        .from('table_columns')
        .insert({
          table_id: tableId,
          name: columnName,
          column_type: 'text',
          column_order: newColumnOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['table-columns', variables.tableId] });
    },
  });
};
