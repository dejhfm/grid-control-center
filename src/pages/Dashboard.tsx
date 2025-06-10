
import { useState } from "react";
import { Header } from "@/components/Header";
import { TableCard } from "@/components/TableCard";
import { CreateTableModal } from "@/components/CreateTableModal";
import { InteractiveTable } from "@/components/InteractiveTable";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const mockTables = [
  {
    id: "1",
    name: "Projektübersicht",
    description: "Verfolgung aller laufenden Projekte",
    rows: 12,
    columns: 6,
    lastModified: "vor 2 Stunden",
    permissions: 'owner' as const,
    collaborators: 3
  },
  {
    id: "2",
    name: "Kundendaten",
    description: "Kundeninformationen und Kontaktdaten",
    rows: 45,
    columns: 8,
    lastModified: "gestern",
    permissions: 'edit' as const,
    collaborators: 2
  },
  {
    id: "3",
    name: "Inventar",
    description: "Bestandsverwaltung und Lagerübersicht",
    rows: 89,
    columns: 5,
    lastModified: "vor 3 Tagen",
    permissions: 'view' as const,
    collaborators: 1
  }
];

const mockUser = {
  name: "Max Mustermann",
  email: "max@example.com"
};

export const Dashboard = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'table'>('dashboard');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [tables, setTables] = useState(mockTables);

  const handleOpenTable = (tableId: string) => {
    setSelectedTable(tableId);
    setCurrentView('table');
  };

  const handleCreateTable = (tableData: any) => {
    const newTable = {
      id: Date.now().toString(),
      name: tableData.name,
      description: tableData.description,
      rows: tableData.rows,
      columns: tableData.columns,
      lastModified: "gerade eben",
      permissions: 'owner' as const,
      collaborators: 1
    };
    setTables([...tables, newTable]);
  };

  const selectedTableData = tables.find(t => t.id === selectedTable);

  if (currentView === 'table' && selectedTableData) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={mockUser} />
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
            canEdit={selectedTableData.permissions !== 'view'}
            canStructure={selectedTableData.permissions === 'owner'}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        user={mockUser} 
        onCreateTable={() => setIsCreateModalOpen(true)}
        onLogout={() => console.log('Logout')}
      />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Meine Tabellen</h2>
          <p className="text-muted-foreground">
            Verwalte und bearbeite deine Tabellen
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onOpen={handleOpenTable}
              onEdit={(id) => console.log('Edit table:', id)}
              onManagePermissions={(id) => console.log('Manage permissions:', id)}
            />
          ))}
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
    </div>
  );
};
