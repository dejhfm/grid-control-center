
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Settings } from "lucide-react";
import { TableMode } from "@/hooks/useTableState";

interface TableModeSelectorProps {
  mode: TableMode;
  onModeChange: (mode: TableMode) => void;
  canEdit: boolean;
  canStructure: boolean;
}

export const TableModeSelector = ({ 
  mode, 
  onModeChange, 
  canEdit, 
  canStructure 
}: TableModeSelectorProps) => {
  const getModeText = (currentMode: TableMode) => {
    switch (currentMode) {
      case 'view': return 'Ansicht';
      case 'edit': return 'Bearbeitung';
      case 'structure': return 'Struktur';
    }
  };

  const getModeColor = (currentMode: TableMode) => {
    switch (currentMode) {
      case 'view': return 'bg-gray-100 text-gray-800';
      case 'edit': return 'bg-blue-100 text-blue-800';
      case 'structure': return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Badge className={getModeColor(mode)}>
        {getModeText(mode)}
      </Badge>
      <div className="flex space-x-1">
        <Button
          variant={mode === 'view' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange('view')}
        >
          <Eye className="w-4 h-4" />
        </Button>
        {canEdit && (
          <Button
            variant={mode === 'edit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onModeChange('edit')}
          >
            <Edit className="w-4 h-4" />
          </Button>
        )}
        {canStructure && (
          <Button
            variant={mode === 'structure' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onModeChange('structure')}
          >
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
