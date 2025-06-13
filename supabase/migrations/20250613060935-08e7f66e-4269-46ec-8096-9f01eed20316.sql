
-- First, let's check what tables reference user IDs and ensure proper cascade deletion
-- Update the profiles table to have proper cascade deletion from auth.users
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Ensure user_roles table has proper cascade deletion
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Ensure other tables with user references have proper cascade deletion
ALTER TABLE public.tables 
DROP CONSTRAINT IF EXISTS tables_owner_id_fkey;

ALTER TABLE public.tables 
ADD CONSTRAINT tables_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.table_permissions 
DROP CONSTRAINT IF EXISTS table_permissions_user_id_fkey;

ALTER TABLE public.table_permissions 
ADD CONSTRAINT table_permissions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.table_permissions 
DROP CONSTRAINT IF EXISTS table_permissions_granted_by_fkey;

ALTER TABLE public.table_permissions 
ADD CONSTRAINT table_permissions_granted_by_fkey 
FOREIGN KEY (granted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.file_audit 
DROP CONSTRAINT IF EXISTS file_audit_user_id_fkey;

ALTER TABLE public.file_audit 
ADD CONSTRAINT file_audit_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.rate_limits 
DROP CONSTRAINT IF EXISTS rate_limits_user_id_fkey;

ALTER TABLE public.rate_limits 
ADD CONSTRAINT rate_limits_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create a function to properly delete a user and all associated data
CREATE OR REPLACE FUNCTION public.delete_user_completely(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role app_role;
  target_user_role app_role;
BEGIN
  -- Get current user's role
  SELECT public.get_user_role(auth.uid()) INTO current_user_role;
  
  -- Get target user's role
  SELECT public.get_user_role(target_user_id) INTO target_user_role;
  
  -- Check if current user can manage the target user
  IF NOT public.can_manage_user(auth.uid(), target_user_id) THEN
    RAISE EXCEPTION 'Insufficient permissions to delete this user';
  END IF;
  
  -- Prevent deletion of super_admin by non-super_admin
  IF target_user_role = 'super_admin' AND current_user_role != 'super_admin' THEN
    RAISE EXCEPTION 'Cannot delete super admin user';
  END IF;
  
  -- Log the action before deletion
  PERFORM public.log_admin_action(
    'Deleted user account completely',
    'user',
    target_user_id,
    jsonb_build_object('deleted_user_role', target_user_role)
  );
  
  -- Delete from auth.users (this will cascade to all other tables)
  DELETE FROM auth.users WHERE id = target_user_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error deleting user: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_completely(UUID) TO authenticated;
