
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
}

export const PermissionsModal = ({ isOpen, onClose, tableId }: PermissionsModalProps) => {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newPermission, setNewPermission] = useState<'viewer' | 'editor'>('viewer');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: permissions = [] } = useQuery({
    queryKey: ['table-permissions', tableId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('table_permissions')
        .select(`
          *,
          granted_by_profile:profiles!table_permissions_granted_by_fkey(full_name, username),
          user_profile:profiles!table_permissions_user_id_fkey(full_name, username, id)
        `)
        .eq('table_id', tableId);

      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!tableId,
  });

  const addPermissionMutation = useMutation({
    mutationFn: async ({ email, permission }: { email: string; permission: 'viewer' | 'editor' }) => {
      // First find the user by email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', email)
        .single();

      if (profileError || !profiles) {
        throw new Error('Benutzer nicht gefunden');
      }

      const { data, error } = await supabase
        .from('table_permissions')
        .insert({
          table_id: tableId,
          user_id: profiles.id,
          permission,
          granted_by: (await supabase.auth.getUser()).data.user?.id!,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table-permissions', tableId] });
      setNewUserEmail('');
      toast({
        title: 'Berechtigung hinzugefügt',
        description: 'Der Benutzer wurde erfolgreich hinzugefügt.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const removePermissionMutation = useMutation({
    mutationFn: async (permissionId: string) => {
      const { error } = await supabase
        .from('table_permissions')
        .delete()
        .eq('id', permissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table-permissions', tableId] });
      toast({
        title: 'Berechtigung entfernt',
        description: 'Die Berechtigung wurde erfolgreich entfernt.',
      });
    },
  });

  const handleAddPermission = () => {
    if (newUserEmail && newPermission) {
      addPermissionMutation.mutate({ email: newUserEmail, permission: newPermission });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background">
        <DialogHeader>
          <DialogTitle>Berechtigungen verwalten</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="E-Mail oder Benutzername"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="flex-1"
            />
            <Select value={newPermission} onValueChange={(value: 'viewer' | 'editor') => setNewPermission(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="viewer">Ansicht</SelectItem>
                <SelectItem value="editor">Bearbeitung</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddPermission} disabled={addPermissionMutation.isPending}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {permissions.map((permission) => (
              <div key={permission.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <span className="font-medium">
                    {permission.user_profile.full_name || permission.user_profile.username}
                  </span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({permission.permission === 'viewer' ? 'Ansicht' : 'Bearbeitung'})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePermissionMutation.mutate(permission.id)}
                  disabled={removePermissionMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
