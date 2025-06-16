import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Shield, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRateLimit } from '@/hooks/useRateLimit';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
}

interface UserSuggestion {
  user_id: string;
  username: string;
  full_name: string;
}

interface PermissionWithProfile {
  id: string;
  table_id: string;
  user_id: string;
  permission: 'viewer' | 'editor';
  granted_by: string;
  created_at: string;
  user_profile: {
    id: string;
    username: string;
    full_name: string;
  } | null;
}

export const PermissionsModal = ({ isOpen, onClose, tableId }: PermissionsModalProps) => {
  const [searchUsername, setSearchUsername] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUsername, setSelectedUsername] = useState('');
  const [newPermission, setNewPermission] = useState<'viewer' | 'editor'>('viewer');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { checkRateLimit } = useRateLimit();

  const { data: permissions = [] } = useQuery({
    queryKey: ['table-permissions', tableId],
    queryFn: async () => {
      // First get the permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('table_permissions')
        .select('*')
        .eq('table_id', tableId);

      if (permissionsError) throw permissionsError;

      // Then get the user profiles for each permission
      const permissionsWithProfiles: PermissionWithProfile[] = [];
      
      for (const permission of permissionsData) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, full_name')
          .eq('id', permission.user_id)
          .single();

        if (profileError) {
          console.warn('Could not fetch profile for user:', permission.user_id);
        }

        permissionsWithProfiles.push({
          ...permission,
          user_profile: profile || null
        });
      }

      return permissionsWithProfiles;
    },
    enabled: isOpen && !!tableId,
  });

  const { data: userSuggestions = [] } = useQuery({
    queryKey: ['user-suggestions', searchUsername],
    queryFn: async () => {
      if (!searchUsername.trim() || searchUsername.length < 2) return [];
      
      const { data, error } = await supabase.rpc('search_users_by_username', {
        search_term: searchUsername.trim(),
        limit_count: 5
      });

      if (error) throw error;
      return data as UserSuggestion[];
    },
    enabled: searchUsername.length >= 2,
  });

  useEffect(() => {
    setShowSuggestions(searchUsername.length >= 2 && userSuggestions.length > 0);
  }, [searchUsername, userSuggestions]);

  const addPermissionMutation = useMutation({
    mutationFn: async ({ userId, permission }: { userId: string; permission: 'viewer' | 'editor' }) => {
      // Check rate limiting
      const isRateLimited = await checkRateLimit({
        operationType: 'add_permission',
        maxAttempts: 10,
        windowMinutes: 60
      });

      if (isRateLimited) {
        throw new Error('Zu viele Berechtigungsänderungen. Bitte warten Sie eine Stunde.');
      }

      // Check if permission already exists
      const { data: existingPermission } = await supabase
        .from('table_permissions')
        .select('id')
        .eq('table_id', tableId)
        .eq('user_id', userId)
        .single();

      if (existingPermission) {
        throw new Error('Benutzer hat bereits eine Berechtigung für diese Tabelle');
      }

      const { data, error } = await supabase
        .from('table_permissions')
        .insert({
          table_id: tableId,
          user_id: userId,
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
      setSearchUsername('');
      setSelectedUserId(null);
      setSelectedUsername('');
      setShowSuggestions(false);
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

  const handleUserSelect = (user: UserSuggestion) => {
    setSelectedUserId(user.user_id);
    setSelectedUsername(user.username);
    setSearchUsername(user.username);
    setShowSuggestions(false);
  };

  const handleAddPermission = async () => {
    if (!selectedUserId) {
      toast({
        title: 'Kein Benutzer ausgewählt',
        description: 'Bitte wählen Sie einen Benutzer aus der Liste aus.',
        variant: 'destructive',
      });
      return;
    }

    addPermissionMutation.mutate({ userId: selectedUserId, permission: newPermission });
  };

  const handleSearchChange = (value: string) => {
    setSearchUsername(value);
    if (value !== selectedUsername) {
      setSelectedUserId(null);
      setSelectedUsername('');
    }
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
          <div className="space-y-2">
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Benutzername suchen..."
                    value={searchUsername}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pr-10"
                    disabled={addPermissionMutation.isPending}
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
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
                  disabled={addPermissionMutation.isPending || !selectedUserId}
                  size="sm"
                >
                  {addPermissionMutation.isPending ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {userSuggestions.map((user) => (
                    <button
                      key={user.user_id}
                      onClick={() => handleUserSelect(user)}
                      className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">{user.username}</div>
                        {user.full_name && (
                          <div className="text-sm text-muted-foreground">{user.full_name}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedUserId && (
              <div className="text-sm text-green-600 flex items-center gap-1">
                <span>✓ Benutzer "{selectedUsername}" ausgewählt</span>
              </div>
            )}
          </div>

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
                      {permission.user_profile?.username || 'Unbekannter Benutzer'}
                    </span>
                    <div className="text-sm text-muted-foreground">
                      {permission.permission === 'viewer' ? 'Ansicht' : 'Bearbeitung'}
                      {permission.user_profile?.full_name && (
                        <span> • {permission.user_profile.full_name}</span>
                      )}
                    </div>
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
