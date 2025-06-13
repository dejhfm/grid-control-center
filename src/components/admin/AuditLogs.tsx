
import React from 'react';
import { useAuditLogs } from '@/hooks/useUserRoles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Activity, Clock, User, Target } from 'lucide-react';

export const AuditLogs = () => {
  const { data: logs, isLoading, error } = useAuditLogs();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit-Protokoll</CardTitle>
          <CardDescription>Systemaktivitäten und Admin-Aktionen</CardDescription>
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
          <CardTitle>Audit-Protokoll</CardTitle>
          <CardDescription>Fehler beim Laden der Audit-Logs</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">
            {error instanceof Error ? error.message : 'Unbekannter Fehler'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('role')) return 'default';
    if (action.includes('delete')) return 'destructive';
    if (action.includes('create')) return 'default';
    return 'secondary';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Audit-Protokoll
        </CardTitle>
        <CardDescription>
          Verlauf der Systemaktivitäten und Admin-Aktionen. Neueste {logs?.length || 0} Einträge.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zeitstempel</TableHead>
                <TableHead>Aktion</TableHead>
                <TableHead>Ziel-Typ</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Benutzer-ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {new Date(log.created_at).toLocaleString('de-DE')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.action)}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.target_type && (
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize">{log.target_type}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.details && (
                      <div className="max-w-xs">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {JSON.stringify(log.details, null, 0).substring(0, 100)}
                          {JSON.stringify(log.details).length > 100 ? '...' : ''}
                        </code>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      {log.user_id?.substring(0, 8) || 'System'}...
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {(!logs || logs.length === 0) && (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Keine Audit-Logs verfügbar.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
