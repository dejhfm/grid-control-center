
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Settings, Database, Mail, Shield, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const SystemSettings = () => {
  const { isSuperAdmin } = useAuth();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System-Einstellungen
          </CardTitle>
          <CardDescription>
            Konfigurieren Sie globale Systemeinstellungen und -richtlinien.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Sicherheitseinstellungen
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="require-email-verification">
                    E-Mail-Verifizierung erforderlich
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Neue Benutzer müssen ihre E-Mail-Adresse verifizieren
                  </p>
                </div>
                <Switch id="require-email-verification" disabled={!isSuperAdmin} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="strong-passwords">
                    Starke Passwörter erforderlich
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Mindestanforderungen für Passwort-Komplexität
                  </p>
                </div>
                <Switch id="strong-passwords" disabled={!isSuperAdmin} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="session-timeout">
                    Session-Timeout aktivieren
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatische Abmeldung nach Inaktivität
                  </p>
                </div>
                <Switch id="session-timeout" disabled={!isSuperAdmin} />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Benachrichtigungen
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">
                    E-Mail-Benachrichtigungen
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Systemnachrichten per E-Mail senden
                  </p>
                </div>
                <Switch id="email-notifications" disabled={!isSuperAdmin} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="admin-alerts">
                    Admin-Benachrichtigungen
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Wichtige Systemereignisse an Admins melden
                  </p>
                </div>
                <Switch id="admin-alerts" disabled={!isSuperAdmin} />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Datenverwaltung
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Datenbank-Backup</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatische Sicherung der Datenbank
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled={!isSuperAdmin}>
                  Backup erstellen
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>System-Logs leeren</Label>
                  <p className="text-sm text-muted-foreground">
                    Alte Audit-Logs und System-Ereignisse entfernen
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled={!isSuperAdmin}>
                  Logs leeren
                </Button>
              </div>
            </div>
          </div>

          {!isSuperAdmin && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <Shield className="h-4 w-4 inline mr-1" />
                Nur Super-Administratoren können diese Einstellungen ändern.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
