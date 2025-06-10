
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserDropdownCellProps {
  value: string | null;
  onCellUpdate: (value: string) => void;
  disabled?: boolean;
}

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
}

export const UserDropdownCell = ({ 
  value, 
  onCellUpdate, 
  disabled = false 
}: UserDropdownCellProps) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name')
          .not('username', 'is', null)
          .order('username');

        if (error) throw error;

        setUsers(data || []);
      } catch (error: any) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Fehler beim Laden der Benutzer',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

  if (disabled) {
    const selectedUser = users.find(user => user.username === value);
    return (
      <span className="text-sm">
        {selectedUser ? selectedUser.username : value || '-'}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">
        Lade Benutzer...
      </div>
    );
  }

  return (
    <Select 
      value={value || ''} 
      onValueChange={onCellUpdate}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Benutzer auswählen..." />
      </SelectTrigger>
      <SelectContent className="bg-background">
        <SelectItem value="">Kein Benutzer</SelectItem>
        {users.map((user) => (
          <SelectItem key={user.id} value={user.username}>
            {user.username} {user.full_name && `(${user.full_name})`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
