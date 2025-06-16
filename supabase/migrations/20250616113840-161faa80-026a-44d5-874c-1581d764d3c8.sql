
-- Check if foreign key already exists and add it if missing
DO $$
BEGIN
    -- Add foreign key constraint for user_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'table_permissions_user_id_fkey'
        AND table_name = 'table_permissions'
    ) THEN
        ALTER TABLE public.table_permissions 
        ADD CONSTRAINT table_permissions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key constraint for granted_by if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'table_permissions_granted_by_fkey'
        AND table_name = 'table_permissions'
    ) THEN
        ALTER TABLE public.table_permissions 
        ADD CONSTRAINT table_permissions_granted_by_fkey 
        FOREIGN KEY (granted_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END
$$;
