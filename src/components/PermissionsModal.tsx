
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Shield, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRateLimit } from '@/hooks/useRateLimit';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
}

export const PermissionsModal = ({ isOpen, onClose, tableId }: PermissionsModalProps) => {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newPermission, setNewPermission] = useState<'viewer' | 'editor'>('viewer');
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { checkRateLimit } = useRateLimit();

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

  const validateUserEmail = async (email: string): Promise<boolean> => {
    if (!email.trim()) return false;
    
    setIsValidating(true);
    try {
      const { data, error } = await supabase.rpc('user_exists', { user_email: email.trim() });
      
      if (error) {
        console.error('User validation error:', error);
        return false;
      }
      
      return data === true;
    } catch (error) {
      console.error('User validation failed:', error);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const addPermissionMutation = useMutation({
    mutationFn: async ({ email, permission }: { email: string; permission: 'viewer' | 'editor' }) => {
      // Check rate limiting
      const isRateLimited = await checkRateLimit({
        operationType: 'add_permission',
        maxAttempts: 10,
        windowMinutes: 60
      });

      if (isRateLimited) {
        throw new Error('Zu viele Berechtigungsänderungen. Bitte warten Sie eine Stunde.');
      }

      // Validate user exists
      const userExists = await validateUserEmail(email);
      if (!userExists) {
        throw new Error('Benutzer nicht gefunden oder ungültige E-Mail');
      }

      // Get user profile
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', email.trim())
        .single();

      if (profileError || !profiles) {
        throw new Error('Benutzer konnte nicht gefunden werden');
      }

      // Check if permission already exists
      const { data: existingPermission } = await supabase
        .from('table_permissions')
        .select('id')
        .eq('table_id', tableId)
        .eq('user_id', profiles.id)
        .single();

      if (existingPermission) {
        throw new Error('Benutzer hat bereits eine Berechtigung für diese Tabelle');
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
      // Check rate limiting
      const isRateLimited = await checkRateLimit({
        operationType: 'remove_permission',
        maxAttempts: 20,
        windowMinutes: 60
      });

      if (isRateLimited) {
        throw new Error('Zu viele Berechtigungsänderungen. Bitte warten Sie eine Stunde.');
      }

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
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAddPermission = async () => {
    if (!newUserEmail.trim() || !newPermission) {
      toast({
        title: 'Ungültige Eingabe',
        description: 'Bitte geben Sie eine gültige E-Mail und Berechtigung an.',
        variant: 'destructive',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserEmail.trim())) {
      toast({
        title: 'Ungültige E-Mail',
        description: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
        variant: 'destructive',
      });
      return;
    }

    addPermissionMutation.mutate({ email: newUserEmail.trim(), permission: newPermission });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <DialogTitle>Berechtigungen verwalten</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="E-Mail oder Benutzername"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="flex-1"
              disabled={addPermissionMutation.isPending || isValidating}
            />
            <Select 
              value={newPermission} 
              onValueChange={(value: 'viewer' | 'editor') => setNewPermission(value)}
              disabled={addPermissionMutation.isPending}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="viewer">Ansicht</SelectItem>
                <SelectItem value="editor">Bearbeitung</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleAddPermission} 
              disabled={addPermissionMutation.isPending || isValidating || !newUserEmail.trim()}
              size="sm"
            >
              {addPermissionMutation.isPending || isValidating ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </div>

          {newUserEmail.trim() && !isValidating && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Benutzer wird beim Hinzufügen validiert</span>
            </div>
          )}

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {permissions.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                Keine zusätzlichen Berechtigungen vergeben
              </div>
            ) : (
              permissions.map((permission) => (
                <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <span className="font-medium block">
                      {permission.user_profile.full_name || permission.user_profile.username}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {permission.permission === 'viewer' ? 'Ansicht' : 'Bearbeitung'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePermissionMutation.mutate(permission.id)}
                    disabled={removePermissionMutation.isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
