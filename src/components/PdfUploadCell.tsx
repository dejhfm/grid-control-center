
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Download, FileText, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface PdfUploadCellProps {
  value: string | null;
  rowIndex: number;
  colIndex: number;
  tableId: string;
  onCellUpdate: (rowIndex: number, colIndex: number, value: any) => void;
  disabled?: boolean;
}

export const PdfUploadCell = ({ 
  value, 
  rowIndex, 
  colIndex, 
  tableId,
  onCellUpdate,
  disabled = false
}: PdfUploadCellProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Ungültiger Dateityp',
        description: 'Bitte wählen Sie eine PDF-Datei aus.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: 'Datei zu groß',
        description: 'Die Datei darf maximal 10MB groß sein.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileName = `${user.id}/${tableId}/${rowIndex}-${colIndex}-${Date.now()}.pdf`;
      
      const { data, error } = await supabase.storage
        .from('pdf-uploads')
        .upload(fileName, file);

      if (error) throw error;

      // Update cell with file path
      onCellUpdate(rowIndex, colIndex, data.path);

      toast({
        title: 'PDF hochgeladen',
        description: 'Die PDF-Datei wurde erfolgreich gespeichert.',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload fehlgeschlagen',
        description: error.message || 'Ein Fehler ist beim Upload aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleDownload = async () => {
    if (!value) return;

    try {
      const { data, error } = await supabase.storage
        .from('pdf-uploads')
        .download(value);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document-${rowIndex}-${colIndex}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download gestartet',
        description: 'Die PDF-Datei wird heruntergeladen.',
      });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: 'Download fehlgeschlagen',
        description: error.message || 'Ein Fehler ist beim Download aufgetreten.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!value) return;

    try {
      const { error } = await supabase.storage
        .from('pdf-uploads')
        .remove([value]);

      if (error) throw error;

      onCellUpdate(rowIndex, colIndex, null);

      toast({
        title: 'PDF gelöscht',
        description: 'Die PDF-Datei wurde erfolgreich entfernt.',
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: 'Löschen fehlgeschlagen',
        description: error.message || 'Ein Fehler ist beim Löschen aufgetreten.',
        variant: 'destructive',
      });
    }
  };

  if (disabled) {
    return (
      <div className="flex items-center space-x-2">
        {value ? (
          <>
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">PDF vorhanden</span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Keine PDF</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {value ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex items-center space-x-1"
          >
            <Download className="w-3 h-3" />
            <span>Download</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="flex items-center space-x-1 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </>
      ) : (
        <>
          <Input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            id={`pdf-upload-${rowIndex}-${colIndex}`}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById(`pdf-upload-${rowIndex}-${colIndex}`)?.click()}
            disabled={isUploading}
            className="flex items-center space-x-1"
          >
            <Upload className="w-3 h-3" />
            <span>{isUploading ? 'Uploading...' : 'PDF Upload'}</span>
          </Button>
        </>
      )}
    </div>
  );
};
