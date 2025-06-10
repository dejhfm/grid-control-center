
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useTableStats = (tableId: string) => {
  return useQuery({
    queryKey: ['table-stats', tableId],
    queryFn: async () => {
      const [columnsResponse, dataResponse] = await Promise.all([
        supabase
          .from('table_columns')
          .select('id')
          .eq('table_id', tableId),
        supabase
          .from('table_data')
          .select('row_index')
          .eq('table_id', tableId)
      ]);

      if (columnsResponse.error) throw columnsResponse.error;
      if (dataResponse.error) throw dataResponse.error;

      const columnCount = columnsResponse.data?.length || 0;
      const uniqueRows = new Set(dataResponse.data?.map(d => d.row_index) || []);
      const rowCount = uniqueRows.size;

      return { columnCount, rowCount };
    },
    enabled: !!tableId,
  });
};
