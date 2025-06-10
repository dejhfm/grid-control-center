
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, User, Check, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSettingsModal = ({ isOpen, onClose }: UserSettingsModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newUsername, setNewUsername] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameExists, setUsernameExists] = useState(false);

  const { data: currentProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!user,
  });

  const checkUsername = async (username: string) => {
    if (!username.trim() || username === currentProfile?.username) {
      setUsernameExists(false);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const { data, error } = await supabase.rpc('username_exists', { 
        check_username: username.trim(),
        exclude_user_id: user?.id 
      });
      
      if (error) {
        console.error('Username check error:', error);
        setUsernameExists(false);
      } else {
        setUsernameExists(data === true);
      }
    } catch (error) {
      console.error('Username check failed:', error);
      setUsernameExists(false);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const updateUsernameMutation = useMutation({
    mutationFn: async (username: string) => {
      if (!user) throw new Error('Benutzer nicht angemeldet');

      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim() })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast({
        title: 'Benutzername geändert',
        description: 'Ihr Benutzername wurde erfolgreich aktualisiert.',
      });
      setNewUsername('');
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Benutzername konnte nicht geändert werden.',
        variant: 'destructive',
      });
    },
  });

  const handleUsernameChange = (value: string) => {
    setNewUsername(value);
    if (value.trim()) {
      checkUsername(value);
    } else {
      setUsernameExists(false);
    }
  };

  const handleSaveUsername = () => {
    if (!newUsername.trim()) {
      toast({
        title: 'Ungültiger Benutzername',
        description: 'Bitte geben Sie einen gültigen Benutzernamen ein.',
        variant: 'destructive',
      });
      return;
    }

    if (usernameExists) {
      toast({
        title: 'Benutzername bereits vergeben',
        description: 'Dieser Benutzername ist bereits vergeben. Bitte wählen Sie einen anderen.',
        variant: 'destructive',
      });
      return;
    }

    if (newUsername.length < 3) {
      toast({
        title: 'Benutzername zu kurz',
        description: 'Der Benutzername muss mindestens 3 Zeichen lang sein.',
        variant: 'destructive',
      });
      return;
    }

    updateUsernameMutation.mutate(newUsername);
  };

  const getUsernameStatusIcon = () => {
    if (isCheckingUsername) {
      return <div className="w-4 h-4 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />;
    }
    if (newUsername.trim() && newUsername !== currentProfile?.username) {
      return usernameExists ? 
        <X className="w-4 h-4 text-destructive" /> : 
        <Check className="w-4 h-4 text-green-500" />;
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <DialogTitle>Benutzereinstellungen</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-username" className="text-sm font-medium">
                Aktueller Benutzername
              </Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{currentProfile?.username || 'Nicht festgelegt'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-username" className="text-sm font-medium">
                Neuer Benutzername
              </Label>
              <div className="relative">
                <Input
                  id="new-username"
                  placeholder="Neuen Benutzernamen eingeben"
                  value={newUsername}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className="pr-10"
                  disabled={updateUsernameMutation.isPending}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {getUsernameStatusIcon()}
                </div>
              </div>
              {newUsername.trim() && usernameExists && (
                <p className="text-sm text-destructive">
                  Dieser Benutzername ist bereits vergeben
                </p>
              )}
              {newUsername.trim() && !usernameExists && !isCheckingUsername && newUsername !== currentProfile?.username && (
                <p className="text-sm text-green-600">
                  Benutzername ist verfügbar
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSaveUsername}
              disabled={
                updateUsernameMutation.isPending || 
                !newUsername.trim() || 
                usernameExists || 
                isCheckingUsername ||
                newUsername === currentProfile?.username ||
                newUsername.length < 3
              }
              className="flex-1"
            >
              {updateUsernameMutation.isPending ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
              ) : (
                'Benutzername ändern'
              )}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
