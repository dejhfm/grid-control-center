
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Trash2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { validateFile, sanitizeFileName } from '@/utils/fileValidation';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useFileAudit } from '@/hooks/useFileAudit';

interface PdfUploadCellSecureProps {
  value: string | null;
  rowIndex: number;
  colIndex: number;
  tableId: string;
  onCellUpdate: (rowIndex: number, colIndex: number, value: any) => void;
  disabled?: boolean;
}

export const PdfUploadCellSecure = ({
  value,
  rowIndex,
  colIndex,
  tableId,
  onCellUpdate,
  disabled = false
}: PdfUploadCellSecureProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { checkRateLimit } = useRateLimit();
  const fileAuditMutation = useFileAudit();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Check rate limiting
    const isRateLimited = await checkRateLimit({
      operationType: 'file_upload',
      maxAttempts: 10,
      windowMinutes: 60
    });

    if (isRateLimited) {
      toast({
        title: 'Zu viele Upload-Versuche',
        description: 'Bitte warten Sie eine Stunde bevor Sie weitere Dateien hochladen.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file
    const validation = await validateFile(file);
    if (!validation.isValid) {
      toast({
        title: 'Ungültige Datei',
        description: validation.errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Sanitize filename
      const sanitizedFileName = sanitizeFileName(file.name);
      
      // Create secure file path: user_id/table_id/row_col_timestamp_filename
      const timestamp = Date.now();
      const secureFileName = `${user.id}/${tableId}/${rowIndex}_${colIndex}_${timestamp}_${sanitizedFileName}`;

      // Upload to Supabase storage with security checks
      const { data, error } = await supabase.storage
        .from('pdf-uploads')
        .upload(secureFileName, file, {
          cacheControl: '3600',
          upsert: false, // Prevent overwriting
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error('Upload fehlgeschlagen: ' + error.message);
      }

      // Update cell value with secure file path
      onCellUpdate(rowIndex, colIndex, data.path);

      // Log file audit
      fileAuditMutation.mutate({
        tableId,
        filePath: data.path,
        action: 'upload',
        metadata: { 
          fileName: sanitizedFileName, 
          fileSize: file.size,
          rowIndex,
          colIndex 
        }
      });

      toast({
        title: 'Upload erfolgreich',
        description: 'Die PDF-Datei wurde sicher hochgeladen.',
      });

    } catch (error: any) {
      console.error('File upload error:', error);
      toast({
        title: 'Upload fehlgeschlagen',
        description: error.message || 'Ein unbekannter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!value || !user) return;

    setIsDeleting(true);
    try {
      // Delete from storage
      const { error } = await supabase.storage
        .from('pdf-uploads')
        .remove([value]);

      if (error) {
        console.error('Delete error:', error);
        throw new Error('Löschen fehlgeschlagen');
      }

      // Update cell value
      onCellUpdate(rowIndex, colIndex, null);

      // Log file audit
      fileAuditMutation.mutate({
        tableId,
        filePath: value,
        action: 'delete',
        metadata: { rowIndex, colIndex }
      });

      toast({
        title: 'Datei gelöscht',
        description: 'Die PDF-Datei wurde erfolgreich entfernt.',
      });

    } catch (error: any) {
      console.error('File delete error:', error);
      toast({
        title: 'Löschen fehlgeschlagen',
        description: error.message || 'Ein Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async () => {
    if (!value) return;

    try {
      const { data, error } = await supabase.storage
        .from('pdf-uploads')
        .download(value);

      if (error) {
        throw new Error('Download fehlgeschlagen');
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = value.split('/').pop() || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log file audit
      fileAuditMutation.mutate({
        tableId,
        filePath: value,
        action: 'download',
        metadata: { rowIndex, colIndex }
      });

    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: 'Download fehlgeschlagen',
        description: error.message || 'Ein Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    }
  };

  if (disabled && !value) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  if (disabled && value) {
    return (
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className="p-1 h-auto"
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading || disabled}
      />

      {!value ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || disabled}
          className="w-full"
        >
          {isUploading ? (
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          <span className="ml-2">
            {isUploading ? 'Uploading...' : 'PDF hochladen'}
          </span>
        </Button>
      ) : (
        <div className="flex items-center gap-1 w-full">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-sm truncate">PDF</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="p-1 h-auto flex-shrink-0"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1 h-auto text-destructive hover:text-destructive flex-shrink-0"
            title="Löschen"
          >
            {isDeleting ? (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
