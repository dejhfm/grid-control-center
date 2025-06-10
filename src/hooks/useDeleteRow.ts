
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDeleteRow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tableId, rowIndex }: { tableId: string; rowIndex: number }) => {
      // Delete all data for this row
      const { error } = await supabase
        .from('table_data')
        .delete()
        .eq('table_id', tableId)
        .eq('row_index', rowIndex);

      if (error) throw error;

      // Update row indices for rows that come after the deleted row
      const { error: updateError } = await supabase
        .from('table_data')
        .update({ row_index: supabase.raw('row_index - 1') })
        .eq('table_id', tableId)
        .gt('row_index', rowIndex);

      if (updateError) throw updateError;

      return { tableId, rowIndex };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ queryKey: ['table-data', variables.tableId] });
    },
  });
};
