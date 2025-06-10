
import { useState } from "react";
import { Header } from "@/components/Header";
import { TableCard } from "@/components/TableCard";
import { CreateTableModal } from "@/components/CreateTableModal";
import { InteractiveTable } from "@/components/InteractiveTable";
import { PermissionsModal } from "@/components/PermissionsModal";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTables, useCreateTable } from "@/hooks/useTables";
import { useTableStats } from "@/hooks/useTableStats";
import { useToast } from "@/hooks/use-toast";

const TableCardWithStats = ({ table, onOpen, onEdit, onManagePermissions, userPermission }: any) => {
  const { data: stats } = useTableStats(table.id);
  
  return (
    <TableCard
      table={{
        ...table,
        rows: stats?.rowCount || 0,
        columns: stats?.columnCount || 0,
        lastModified: new Date(table.updated_at).toLocaleDateString('de-DE'),
        permissions: userPermission as 'owner' | 'edit' | 'view',
        collaborators: table.table_permissions.length + 1,
      }}
      onOpen={onOpen}
      onEdit={onEdit}
      onManagePermissions={onManagePermissions}
    />
  );
};

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { data: tables = [], isLoading } = useTables();
  const createTableMutation = useCreateTable();
  const { toast } = useToast();
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'table'>('dashboard');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [permissionsModalTable, setPermissionsModalTable] = useState<string | null>(null);

  const handleOpenTable = (tableId: string) => {
    setSelectedTable(tableId);
    setCurrentView('table');
  };

  const handleCreateTable = async (tableData: any) => {
    try {
      await createTableMutation.mutateAsync({
        name: tableData.name,
        description: tableData.description,
        columnHeaders: tableData.columnHeaders,
      });
      toast({
        title: "Tabelle erstellt",
        description: `Die Tabelle "${tableData.name}" wurde erfolgreich erstellt.`,
      });
    } catch (error: any) {
      toast({
        title: "Fehler beim Erstellen",
        description: error.message || "Ein Fehler ist aufgetreten",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const selectedTableData = tables.find(t => t.id === selectedTable);

  if (currentView === 'table' && selectedTableData) {
    const userPermission = selectedTableData.owner_id === user?.id 
      ? 'owner' 
      : selectedTableData.table_permissions.find(p => p.user_id === user?.id)?.permission || 'viewer';

    return (
      <div className="min-h-screen bg-background">
        <Header user={{ 
          name: user?.user_metadata?.full_name || user?.email || 'Benutzer',
          email: user?.email || '' 
        }} />
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Zurück zum Dashboard</span>
            </Button>
          </div>
          <InteractiveTable
            tableName={selectedTableData.name}
            tableId={selectedTableData.id}
            canEdit={userPermission !== 'viewer'}
            canStructure={userPermission === 'owner'}
          />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={{ 
          name: user?.user_metadata?.full_name || user?.email || 'Benutzer',
          email: user?.email || '' 
        }} />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Lade Tabellen...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        user={{ 
          name: user?.user_metadata?.full_name || user?.email || 'Benutzer',
          email: user?.email || '' 
        }}
        onCreateTable={() => setIsCreateModalOpen(true)}
        onLogout={handleLogout}
      />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Meine Tabellen</h2>
          <p className="text-muted-foreground">
            Verwalte und bearbeite deine Tabellen
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => {
            const userPermission = table.owner_id === user?.id 
              ? 'owner' 
              : table.table_permissions.find(p => p.user_id === user?.id)?.permission || 'viewer';

            return (
              <TableCardWithStats
                key={table.id}
                table={table}
                userPermission={userPermission}
                onOpen={handleOpenTable}
                onEdit={(id: string) => console.log('Edit table:', id)}
                onManagePermissions={(id: string) => setPermissionsModalTable(id)}
              />
            );
          })}
        </div>
        
        {tables.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Du hast noch keine Tabellen erstellt.
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Erste Tabelle erstellen
            </Button>
          </div>
        )}
      </div>
      
      <CreateTableModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateTable}
      />

      <PermissionsModal
        isOpen={!!permissionsModalTable}
        onClose={() => setPermissionsModalTable(null)}
        tableId={permissionsModalTable || ''}
      />
    </div>
  );
};
