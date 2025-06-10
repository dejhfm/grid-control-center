
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

      // Get all rows that need to be updated (rows after the deleted row)
      const { data: rowsToUpdate, error: fetchError } = await supabase
        .from('table_data')
        .select('id, row_index')
        .eq('table_id', tableId)
        .gt('row_index', rowIndex);

      if (fetchError) throw fetchError;

      // Update each row individually
      if (rowsToUpdate && rowsToUpdate.length > 0) {
        const updatePromises = rowsToUpdate.map(row => 
          supabase
            .from('table_data')
            .update({ row_index: row.row_index - 1 })
            .eq('id', row.id)
        );

        const results = await Promise.all(updatePromises);
        
        // Check for any errors
        for (const result of results) {
          if (result.error) throw result.error;
        }
      }

      return { tableId, rowIndex };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ queryKey: ['table-data', variables.tableId] });
    },
  });
};
