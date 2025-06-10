
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (tableData: {
    name: string;
    description: string;
    columns: number;
    rows: number;
    columnHeaders: string[];
  }) => void;
}

export const CreateTableModal = ({ isOpen, onClose, onCreate }: CreateTableModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    columns: 3,
    rows: 5,
  });
  const [columnHeaders, setColumnHeaders] = useState<string[]>(["Spalte 1", "Spalte 2", "Spalte 3"]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      ...formData,
      columnHeaders,
    });
    onClose();
    setFormData({ name: "", description: "", columns: 3, rows: 5 });
    setColumnHeaders(["Spalte 1", "Spalte 2", "Spalte 3"]);
  };

  const updateColumnCount = (count: number) => {
    setFormData({ ...formData, columns: count });
    const newHeaders = Array.from({ length: count }, (_, i) => 
      columnHeaders[i] || `Spalte ${i + 1}`
    );
    setColumnHeaders(newHeaders);
  };

  const updateColumnHeader = (index: number, value: string) => {
    const newHeaders = [...columnHeaders];
    newHeaders[index] = value;
    setColumnHeaders(newHeaders);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader>
          <DialogTitle>Neue Tabelle erstellen</DialogTitle>
          <DialogDescription>
            Definiere die Grundstruktur deiner neuen Tabelle
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="table-name">Tabellenname</Label>
            <Input
              id="table-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Meine neue Tabelle"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="table-description">Beschreibung</Label>
            <Textarea
              id="table-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Kurze Beschreibung der Tabelle..."
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="columns">Anzahl Spalten</Label>
              <Input
                id="columns"
                type="number"
                min={1}
                max={20}
                value={formData.columns}
                onChange={(e) => updateColumnCount(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rows">Anzahl Zeilen</Label>
              <Input
                id="rows"
                type="number"
                min={1}
                max={1000}
                value={formData.rows}
                onChange={(e) => setFormData({ ...formData, rows: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Spaltenüberschriften</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {columnHeaders.map((header, index) => (
                <Input
                  key={index}
                  value={header}
                  onChange={(e) => updateColumnHeader(index, e.target.value)}
                  placeholder={`Spalte ${index + 1}`}
                />
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit">
              Tabelle erstellen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
