
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTableColumns, useTableData } from '@/hooks/useTableData';

interface SendEmailButtonProps {
  tableId: string;
  tableName: string;
  canSendEmails: boolean;
}

export const SendEmailButton = ({ tableId, tableName, canSendEmails }: SendEmailButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { data: columns = [] } = useTableColumns(tableId);
  const { data: tableData = [] } = useTableData(tableId);

  const handleSendEmails = async () => {
    if (!canSendEmails) {
      toast({
        title: "Keine Berechtigung",
        description: "Nur der Besitzer der Tabelle kann E-Mails versenden.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Find calendar weeks and user dropdown columns
      const calendarWeekColumn = columns.find(col => col.column_type === 'calendar_weeks');
      const userDropdownColumn = columns.find(col => col.column_type === 'user_dropdown');
      const weeklyScheduleColumn = columns.find(col => col.column_type === 'weekly_schedule');

      if (!calendarWeekColumn || !userDropdownColumn) {
        toast({
          title: "Fehlende Spalten",
          description: "Die Tabelle muss eine Kalenderwoche-Spalte und eine Benutzer-Dropdown-Spalte enthalten.",
          variant: "destructive",
        });
        return;
      }

      // Get current week info to determine active rows
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentWeek = getWeekNumber(currentDate);
      const currentWeekValue = `${currentYear}-W${currentWeek.toString().padStart(2, '0')}`;

      // Find all rows with current calendar week and assigned users
      const activeRows = [];
      
      // Group table data by rows
      const rowsData: { [key: number]: { [columnId: string]: any } } = {};
      tableData.forEach(cell => {
        if (!rowsData[cell.row_index]) {
          rowsData[cell.row_index] = {};
        }
        rowsData[cell.row_index][cell.column_id] = cell.value;
      });

      // Check each row for active calendar week and assigned user
      Object.entries(rowsData).forEach(([rowIndex, rowData]) => {
        const calendarWeekValue = rowData[calendarWeekColumn.id];
        const assignedUser = rowData[userDropdownColumn.id];
        
        if (calendarWeekValue === currentWeekValue && assignedUser) {
          activeRows.push({
            rowIndex: parseInt(rowIndex),
            user: assignedUser,
            calendarWeek: calendarWeekValue,
            rowData
          });
        }
      });

      if (activeRows.length === 0) {
        toast({
          title: "Keine aktiven Zeilen",
          description: "Es wurden keine Zeilen mit der aktuellen Kalenderwoche und zugewiesenen Benutzern gefunden.",
        });
        return;
      }

      // Send emails via edge function
      const { error } = await supabase.functions.invoke('send-weekly-reports', {
        body: {
          tableId,
          tableName,
          columns,
          activeRows
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "E-Mails versendet",
        description: `${activeRows.length} E-Mails wurden erfolgreich versendet.`,
      });

    } catch (error: any) {
      console.error('Error sending emails:', error);
      toast({
        title: "Fehler beim Versenden",
        description: error.message || "E-Mails konnten nicht versendet werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get week number
  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  if (!canSendEmails) {
    return null;
  }

  return (
    <Button
      onClick={handleSendEmails}
      disabled={isLoading}
      variant="outline"
      size="sm"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Mail className="w-4 h-4 mr-2" />
      )}
      E-Mails versenden
    </Button>
  );
};
