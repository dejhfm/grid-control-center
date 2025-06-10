
-- Update the existing pdf-uploads bucket configuration for better security
UPDATE storage.buckets 
SET 
  public = false,  -- Set to private for better security
  file_size_limit = 10485760,  -- 10MB file size limit
  allowed_mime_types = ARRAY['application/pdf']  -- Only allow PDF files
WHERE id = 'pdf-uploads';

-- Drop existing overly permissive storage policies if they exist
DROP POLICY IF EXISTS "Users can upload PDFs to their own folders" ON storage.objects;
DROP POLICY IF EXISTS "Users can view PDFs in tables they have access to" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own PDF files" ON storage.objects;

-- Create secure storage policies with proper table-based access control
CREATE POLICY "Users can upload PDFs to tables they can edit" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'pdf-uploads' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  public.has_table_permission(
    ((storage.foldername(name))[2])::uuid, 
    'editor'::permission_level
  )
);

CREATE POLICY "Users can view PDFs from tables they have access to" ON storage.objects
FOR SELECT USING (
  bucket_id = 'pdf-uploads' AND
  auth.role() = 'authenticated' AND
  (
    -- Own files AND have table access
    (storage.foldername(name))[1] = auth.uid()::text OR
    public.has_table_permission(
      ((storage.foldername(name))[2])::uuid, 
      'viewer'::permission_level
    )
  )
);

CREATE POLICY "Users can delete PDFs from tables they can edit" ON storage.objects
FOR DELETE USING (
  bucket_id = 'pdf-uploads' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  public.has_table_permission(
    ((storage.foldername(name))[2])::uuid, 
    'editor'::permission_level
  )
);

-- Create function to clean up orphaned files when table data is deleted
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_files()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete associated file from storage when table data is deleted
  IF OLD.value IS NOT NULL AND OLD.value::text != 'null' THEN
    PERFORM storage.delete_object('pdf-uploads', OLD.value::text);
  END IF;
  RETURN OLD;
END;
$$;

-- Create trigger to automatically cleanup files when table data is deleted
DROP TRIGGER IF EXISTS cleanup_files_trigger ON public.table_data;
CREATE TRIGGER cleanup_files_trigger
  AFTER DELETE ON public.table_data
  FOR EACH ROW
  WHEN (OLD.value IS NOT NULL AND OLD.value::text LIKE '%.pdf')
  EXECUTE FUNCTION public.cleanup_orphaned_files();

-- Add audit logging for file operations
CREATE TABLE IF NOT EXISTS public.file_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('upload', 'download', 'delete')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB
);

-- Enable RLS on file audit table
ALTER TABLE public.file_audit ENABLE ROW LEVEL SECURITY;

-- Create policy for file audit table
CREATE POLICY "Table owners can view file audit logs" ON public.file_audit
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.tables WHERE id = table_id AND owner_id = auth.uid())
);
