
import React from 'react';
import { useUserRoles, useUpdateUserRole } from '@/hooks/useUserRoles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Database } from '@/integrations/supabase/types';
import { Loader2, Mail, Calendar, Shield } from 'lucide-react';

type AppRole = Database['public']['Enums']['app_role'];

const ROLE_COLORS = {
  super_admin: 'destructive',
  admin: 'default',
  manager: 'secondary',
  user: 'outline',
  restricted: 'destructive'
} as const;

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Administrator',
  manager: 'Manager',
  user: 'Benutzer',
  restricted: 'Eingeschränkt'
} as const;

export const UserManagement = () => {
  const { data: users, isLoading, error } = useUserRoles();
  const updateRoleMutation = useUpdateUserRole();

  const handleRoleChange = (userId: string, newRole: AppRole, currentRole?: AppRole) => {
    updateRoleMutation.mutate({
      userId,
      newRole,
      currentRole
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Benutzerverwaltung</CardTitle>
          <CardDescription>Verwalten Sie Benutzerrollen und Berechtigungen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Benutzerverwaltung</CardTitle>
          <CardDescription>Fehler beim Laden der Benutzerdaten</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">
            {error instanceof Error ? error.message : 'Unbekannter Fehler'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Benutzerverwaltung
        </CardTitle>
        <CardDescription>
          Verwalten Sie Benutzerrollen und Berechtigungen. Insgesamt {users?.length || 0} Benutzer registriert.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Benutzer</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Aktuelle Rolle</TableHead>
                <TableHead>Registriert</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => {
                const currentRole = user.user_roles[0]?.role;
                const initials = user.full_name 
                  ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                  : user.username?.slice(0, 2).toUpperCase() || '??';

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {user.full_name || user.username || 'Unbekannt'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {user.username}
                      </div>
                    </TableCell>
                    <TableCell>
                      {currentRole ? (
                        <Badge variant={ROLE_COLORS[currentRole]}>
                          {ROLE_LABELS[currentRole]}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Keine Rolle</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(user.created_at).toLocaleDateString('de-DE')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={currentRole || 'user'}
                        onValueChange={(newRole: AppRole) => 
                          handleRoleChange(user.id, newRole, currentRole)
                        }
                        disabled={updateRoleMutation.isPending}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="restricted">Eingeschränkt</SelectItem>
                          <SelectItem value="user">Benutzer</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {(!users || users.length === 0) && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Keine Benutzer gefunden.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
