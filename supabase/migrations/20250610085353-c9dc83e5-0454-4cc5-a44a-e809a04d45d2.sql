
-- Drop existing overly permissive storage policies
DROP POLICY IF EXISTS "Allow authenticated users to upload PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own PDFs" ON storage.objects;

-- Create secure storage policies with proper user and table-based access control
CREATE POLICY "Users can upload PDFs to their own folders" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'pdf-uploads' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view PDFs in tables they have access to" ON storage.objects
FOR SELECT USING (
  bucket_id = 'pdf-uploads' AND
  auth.role() = 'authenticated' AND
  (
    -- Own files
    (storage.foldername(name))[1] = auth.uid()::text OR
    -- Files in tables they have permission to view (fixed function call)
    public.has_table_permission(
      ((storage.foldername(name))[2])::uuid, 
      'viewer'::permission_level
    )
  )
);

CREATE POLICY "Users can delete their own PDF files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'pdf-uploads' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create function to validate user existence for permission granting
CREATE OR REPLACE FUNCTION public.user_exists(user_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE username = user_email OR id::text = user_email
  );
$$;

-- Create audit table for permission changes
CREATE TABLE IF NOT EXISTS public.permission_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('granted', 'revoked', 'modified')),
  permission_level permission_level NOT NULL,
  performed_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.permission_audit ENABLE ROW LEVEL SECURITY;

-- Create policy for audit table
CREATE POLICY "Table owners can view permission audit logs" ON public.permission_audit
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.tables WHERE id = table_id AND owner_id = auth.uid())
);

-- Create trigger function for permission audit logging
CREATE OR REPLACE FUNCTION public.log_permission_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.permission_audit (table_id, target_user_id, action, permission_level, performed_by)
    VALUES (NEW.table_id, NEW.user_id, 'granted', NEW.permission, NEW.granted_by);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.permission_audit (table_id, target_user_id, action, permission_level, performed_by)
    VALUES (NEW.table_id, NEW.user_id, 'modified', NEW.permission, NEW.granted_by);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.permission_audit (table_id, target_user_id, action, permission_level, performed_by)
    VALUES (OLD.table_id, OLD.user_id, 'revoked', OLD.permission, auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for permission audit logging
DROP TRIGGER IF EXISTS permission_audit_trigger ON public.table_permissions;
CREATE TRIGGER permission_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.table_permissions
  FOR EACH ROW EXECUTE FUNCTION public.log_permission_change();

-- Add rate limiting table for various operations
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL,
  operation_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, operation_type, window_start)
);

-- Enable RLS on rate limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy for rate limits
CREATE POLICY "Users can only see their own rate limits" ON public.rate_limits
FOR ALL USING (auth.uid() = user_id);
