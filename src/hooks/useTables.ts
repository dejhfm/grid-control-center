import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

type TableWithPermissions = Tables<'tables'> & {
  owner_profile: Tables<'profiles'>;
  table_permissions: (Tables<'table_permissions'> & {
    granted_by_profile: Tables<'profiles'>;
  })[];
};

export const useTables = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tables', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('tables')
        .select(`
          *,
          owner_profile:profiles!tables_owner_id_fkey(*),
          table_permissions(
            *,
            granted_by_profile:profiles!table_permissions_granted_by_fkey(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as TableWithPermissions[];
    },
    enabled: !!user,
  });
};

export const useCreateTable = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (tableData: {
      name: string;
      description: string;
      columnHeaders: string[];
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Create the table
      const { data: table, error: tableError } = await supabase
        .from('tables')
        .insert({
          name: tableData.name,
          description: tableData.description,
          owner_id: user.id,
        })
        .select()
        .single();

      if (tableError) throw tableError;

      // Create columns
      const columns = tableData.columnHeaders.map((header, index) => ({
        table_id: table.id,
        name: header,
        column_type: 'text' as const,
        column_order: index,
      }));

      const { error: columnsError } = await supabase
        .from('table_columns')
        .insert(columns);

      if (columnsError) throw columnsError;

      return table;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
};
