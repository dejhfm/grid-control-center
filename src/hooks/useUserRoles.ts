
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];
type UserRole = Database['public']['Tables']['user_roles']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface UserWithRole extends Profile {
  user_roles: UserRole[];
}

export const useUserRoles = () => {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!isAdmin) return [];

      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Then get all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('is_active', true);

      if (rolesError) throw rolesError;

      // Combine the data manually
      const usersWithRoles: UserWithRole[] = profiles.map(profile => ({
        ...profile,
        user_roles: userRoles.filter(role => role.user_id === profile.id)
      }));

      return usersWithRoles;
    },
    enabled: !!user && isAdmin,
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      newRole, 
      currentRole 
    }: { 
      userId: string; 
      newRole: AppRole; 
      currentRole?: AppRole;
    }) => {
      // If user already has this role, do nothing
      if (currentRole === newRole) return;

      if (currentRole) {
        // Update existing role
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({ 
            role: newRole,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('role', currentRole);

        if (updateError) throw updateError;
      } else {
        // Insert new role
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: newRole,
          });

        if (insertError) throw insertError;
      }

      // Log the action
      await supabase.rpc('log_admin_action', {
        _action: `Changed user role to ${newRole}`,
        _target_type: 'user',
        _target_id: userId,
        _details: { new_role: newRole, previous_role: currentRole }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast({
        title: 'Benutzerrolle aktualisiert',
        description: 'Die Benutzerrolle wurde erfolgreich geändert.',
      });
    },
    onError: (error: any) => {
      console.error('Error updating user role:', error);
      toast({
        title: 'Fehler beim Aktualisieren der Rolle',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useAuditLogs = () => {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ['audit-logs', user?.id],
    queryFn: async () => {
      if (!isAdmin) return [];

      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
    enabled: !!user && isAdmin,
  });
};
