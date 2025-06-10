
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDeleteColumn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (columnId: string) => {
      // Delete all data for this column
      const { error: dataError } = await supabase
        .from('table_data')
        .delete()
        .eq('column_id', columnId);

      if (dataError) throw dataError;

      // Get table_id before deleting the column
      const { data: column } = await supabase
        .from('table_columns')
        .select('table_id')
        .eq('id', columnId)
        .single();

      // Delete the column
      const { error: columnError } = await supabase
        .from('table_columns')
        .delete()
        .eq('id', columnId);

      if (columnError) throw columnError;

      return column?.table_id;
    },
    onSuccess: (tableId) => {
      if (tableId) {
        queryClient.invalidateQueries({ queryKey: ['table-columns', tableId] });
        queryClient.invalidateQueries({ queryKey: ['table-data', tableId] });
      }
    },
  });
};
