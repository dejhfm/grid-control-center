
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDeleteTable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tableId: string) => {
      // Delete table data first
      const { error: dataError } = await supabase
        .from('table_data')
        .delete()
        .eq('table_id', tableId);

      if (dataError) throw dataError;

      // Delete table columns
      const { error: columnsError } = await supabase
        .from('table_columns')
        .delete()
        .eq('table_id', tableId);

      if (columnsError) throw columnsError;

      // Delete table permissions
      const { error: permissionsError } = await supabase
        .from('table_permissions')
        .delete()
        .eq('table_id', tableId);

      if (permissionsError) throw permissionsError;

      // Finally delete the table itself
      const { error: tableError } = await supabase
        .from('tables')
        .delete()
        .eq('id', tableId);

      if (tableError) throw tableError;

      return tableId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
};
