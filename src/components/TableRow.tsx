
import { Tables } from "@/integrations/supabase/types";
import { CellData, TableMode } from "@/hooks/useTableState";
import { TableCell } from "@/components/TableCell";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useDeleteRow } from "@/hooks/useDeleteRow";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
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

interface TableRowProps {
  row: CellData[];
  rowIndex: number;
  mode: TableMode;
  tableId: string;
  onCellUpdate: (rowIndex: number, colIndex: number, value: any) => void;
}

export const TableRow = ({ row, rowIndex, mode, tableId, onCellUpdate }: TableRowProps) => {
  const deleteRowMutation = useDeleteRow();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteRow = async () => {
    try {
      await deleteRowMutation.mutateAsync({ tableId, rowIndex });
      setShowDeleteDialog(false);
      
      toast({
        title: "Zeile gelöscht",
        description: "Die Zeile wurde erfolgreich gelöscht.",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Die Zeile konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <tr className="border-b hover:bg-muted/50">
        {row.map((cell, colIndex) => (
          <td key={colIndex} className="px-4 py-3 border-r">
            <TableCell
              cell={cell}
              rowIndex={rowIndex}
              colIndex={colIndex}
              mode={mode}
              tableId={tableId}
              onCellUpdate={onCellUpdate}
            />
          </td>
        ))}
        
        {(mode === 'edit' || mode === 'structure') && (
          <td className="px-4 py-3 border-r">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </td>
        )}
      </tr>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Zeile löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie diese Zeile löschen möchten? Alle Daten in dieser Zeile gehen verloren. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRow}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
