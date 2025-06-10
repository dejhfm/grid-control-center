
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type FileAuditAction = 'upload' | 'download' | 'delete';

interface FileAuditData {
  tableId: string;
  filePath: string;
  action: FileAuditAction;
  metadata?: Record<string, any>;
}

export const useFileAudit = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ tableId, filePath, action, metadata }: FileAuditData) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('file_audit')
        .insert({
          user_id: user.id,
          table_id: tableId,
          file_path: filePath,
          action,
          metadata: metadata || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onError: (error) => {
      console.error('Failed to log file audit:', error);
      // Don't throw here as audit logging should not block the main operation
    },
  });
};
