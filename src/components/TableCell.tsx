import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CellData, TableMode } from "@/hooks/useTableState";
import { PdfUploadCellSecure } from "@/components/PdfUploadCellSecure";
import { WeeklyScheduleCell } from "@/components/WeeklyScheduleCell";
import { useState, useEffect } from "react";
import { generateCalendarWeeks, parseCalendarWeekValue } from "@/utils/calendarWeeks";

interface TableCellProps {
  cell: CellData;
  rowIndex: number;
  colIndex: number;
  mode: TableMode;
  tableId: string;
  onCellUpdate: (rowIndex: number, colIndex: number, value: any) => void;
}

export const TableCell = ({ 
  cell, 
  rowIndex, 
  colIndex, 
  mode, 
  tableId,
  onCellUpdate 
}: TableCellProps) => {
  // Local state for text inputs to prevent interruption during typing
  const [localValue, setLocalValue] = useState(String(cell.value || ''));

  // Update local value when cell value changes from external source
  useEffect(() => {
    setLocalValue(String(cell.value || ''));
  }, [cell.value]);

  // Sanitize input to prevent XSS
  const sanitizeInput = (value: string): string => {
    return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  };

  const handleTextBlur = () => {
    const sanitizedValue = sanitizeInput(localValue);
    // Only update if value actually changed
    if (sanitizedValue !== String(cell.value || '')) {
      console.log('Text field blur - saving:', { rowIndex, colIndex, value: sanitizedValue });
      onCellUpdate(rowIndex, colIndex, sanitizedValue);
    }
  };

  const handleTextKeyDown = (e: React.KeyboardEvent) => {
    // Save on Enter key
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextBlur();
      (e.target as HTMLInputElement).blur();
    }
  };
  
  // Sichere Extraktion der dropdown options
  const getSafeDropdownOptions = (options: any): string[] => {
    try {
      if (Array.isArray(options)) {
        return options
          .filter(opt => opt != null && typeof opt === 'string')
          .map(opt => opt.trim())
          .filter(opt => opt.length > 0);
      }
      return [];
    } catch (error) {
      console.error('Error processing dropdown options:', error);
      return [];
    }
  };
  
  if (mode === 'view') {
    switch (cell.type) {
      case 'checkbox':
        return <Checkbox checked={Boolean(cell.value)} disabled />;
      case 'select':
        return <span className="text-sm">{cell.value || '-'}</span>;
      case 'calendar_weeks':
        const parsedWeek = parseCalendarWeekValue(String(cell.value || ''));
        if (parsedWeek) {
          return <span className="text-sm">KW {parsedWeek.week} ({parsedWeek.year})</span>;
        }
        return <span className="text-sm">{cell.value || '-'}</span>;
      case 'pdf_upload':
        return (
          <PdfUploadCellSecure
            value={cell.value}
            rowIndex={rowIndex}
            colIndex={colIndex}
            tableId={tableId}
            onCellUpdate={onCellUpdate}
            disabled={true}
          />
        );
      case 'weekly_schedule':
        return (
          <WeeklyScheduleCell
            value={cell.value}
            onChange={(value) => onCellUpdate(rowIndex, colIndex, value)}
            dropdownOptions={getSafeDropdownOptions(cell.options)}
            disabled={true}
          />
        );
      default:
        const displayValue = String(cell.value || '-');
        // Show as textarea for longer text, single line for shorter text
        if (displayValue.length > 50 || displayValue.includes('\n')) {
          return (
            <div className="text-sm whitespace-pre-wrap max-w-xs overflow-hidden">
              {displayValue}
            </div>
          );
        }
        return <span className="text-sm">{displayValue}</span>;
    }
  }

  switch (cell.type) {
    case 'checkbox':
      return (
        <Checkbox
          checked={Boolean(cell.value)}
          onCheckedChange={(checked) => {
            console.log('Checkbox changed:', { rowIndex, colIndex, checked });
            onCellUpdate(rowIndex, colIndex, checked);
          }}
        />
      );
    case 'select':
      return (
        <Select 
          value={String(cell.value || '')} 
          onValueChange={(value) => {
            console.log('Select changed:', { rowIndex, colIndex, value });
            onCellUpdate(rowIndex, colIndex, value);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Auswählen..." />
          </SelectTrigger>
          <SelectContent className="bg-background">
            {cell.options?.map((option, i) => (
              <SelectItem key={i} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'calendar_weeks':
      const year = cell.year || new Date().getFullYear();
      const calendarWeeks = generateCalendarWeeks(year);
      
      return (
        <Select 
          value={String(cell.value || '')} 
          onValueChange={(value) => {
            console.log('Calendar week changed:', { rowIndex, colIndex, value });
            onCellUpdate(rowIndex, colIndex, value);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Kalenderwoche auswählen..." />
          </SelectTrigger>
          <SelectContent className="bg-background max-h-60">
            {calendarWeeks.map((week) => (
              <SelectItem key={week.value} value={week.value}>
                {week.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'pdf_upload':
      return (
        <PdfUploadCellSecure
          value={cell.value}
          rowIndex={rowIndex}
          colIndex={colIndex}
          tableId={tableId}
          onCellUpdate={onCellUpdate}
          disabled={false}
        />
      );
    case 'weekly_schedule':
      return (
        <WeeklyScheduleCell
          value={cell.value}
          onChange={(value) => {
            console.log('Weekly schedule changed:', { rowIndex, colIndex, value });
            onCellUpdate(rowIndex, colIndex, value);
          }}
          dropdownOptions={getSafeDropdownOptions(cell.options)}
          disabled={false}
        />
      );
    default:
      // Use textarea for longer text or multiline content
      const shouldUseTextarea = localValue.length > 50 || localValue.includes('\n');
      
      if (shouldUseTextarea) {
        return (
          <Textarea
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleTextBlur}
            onKeyDown={handleTextKeyDown}
            className="w-full min-h-[80px] resize-vertical"
            placeholder="Text eingeben..."
            maxLength={5000} // Increased limit for longer text
          />
        );
      }
      
      return (
        <Input
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleTextBlur}
          onKeyDown={handleTextKeyDown}
          className="w-full"
          placeholder="Text eingeben..."
          maxLength={1000} // Limit input length for security
        />
      );
  }
};
