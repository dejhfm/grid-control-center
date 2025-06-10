
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Eye, Trash2, Settings, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteTable } from "@/hooks/useDeleteTable";
import { useToast } from "@/hooks/use-toast";

interface TableData {
  id: string;
  name: string;
  description: string;
  rows: number;
  columns: number;
  lastModified: string;
  permissions: 'owner' | 'edit' | 'view';
  collaborators: number;
}

interface TableCardProps {
  table: TableData;
  onOpen: (tableId: string) => void;
  onEdit: (tableId: string) => void;
  onManagePermissions: (tableId: string) => void;
}

export const TableCard = ({ table, onOpen, onEdit, onManagePermissions }: TableCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteTableMutation = useDeleteTable();
  const { toast } = useToast();

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'owner': return 'bg-green-100 text-green-800';
      case 'edit': return 'bg-blue-100 text-blue-800';
      case 'view': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPermissionText = (permission: string) => {
    switch (permission) {
      case 'owner': return 'Besitzer';
      case 'edit': return 'Bearbeitung';
      case 'view': return 'Nur Ansicht';
      default: return 'Unbekannt';
    }
  };

  const handleDeleteTable = async () => {
    try {
      await deleteTableMutation.mutateAsync(table.id);
      setShowDeleteDialog(false);
      
      toast({
        title: "Tabelle gelöscht",
        description: `Die Tabelle "${table.name}" wurde erfolgreich gelöscht.`,
      });
    } catch (error) {
      toast({
        title: "Fehler beim Löschen",
        description: "Die Tabelle konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02]">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold mb-1">{table.name}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {table.description}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background">
                {table.permissions === 'owner' && (
                  <>
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Tabelle löschen
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onManagePermissions(table.id)}>
                      <Users className="w-4 h-4 mr-2" />
                      Berechtigungen
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{table.columns} Spalten • {table.rows} Zeilen</span>
              <Badge className={getPermissionColor(table.permissions)}>
                {getPermissionText(table.permissions)}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{table.lastModified}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{table.collaborators} Mitwirkende</span>
              </div>
            </div>
            
            <Button 
              onClick={() => onOpen(table.id)} 
              className="w-full mt-4"
              variant="default"
            >
              <Eye className="w-4 h-4 mr-2" />
              Öffnen
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Tabelle löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie die Tabelle "{table.name}" löschen möchten? 
              Alle Daten, Spalten und Berechtigungen gehen verloren. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTable}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Tabelle löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
