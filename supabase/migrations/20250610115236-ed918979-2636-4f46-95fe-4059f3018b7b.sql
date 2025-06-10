
-- Drop the existing user_exists function first
DROP FUNCTION IF EXISTS public.user_exists(text);

-- Update the handle_new_user function to set username from email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    new.id,
    new.email, -- Use email as username initially
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$function$;

-- Update existing profiles to have usernames based on email
UPDATE public.profiles 
SET username = (
  SELECT email 
  FROM auth.users 
  WHERE auth.users.id = profiles.id
)
WHERE username IS NULL;

-- Create function to check if username exists
CREATE OR REPLACE FUNCTION public.username_exists(check_username text, exclude_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE username = check_username 
    AND (exclude_user_id IS NULL OR id != exclude_user_id)
  );
$function$;

-- Create function to search users by username (for autocomplete)
CREATE OR REPLACE FUNCTION public.search_users_by_username(search_term text, limit_count integer DEFAULT 10)
RETURNS TABLE(user_id uuid, username text, full_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT id, username, full_name
  FROM public.profiles 
  WHERE username ILIKE search_term || '%' 
  AND username IS NOT NULL
  ORDER BY username
  LIMIT limit_count;
$function$;

-- Recreate user_exists function to work with usernames
CREATE OR REPLACE FUNCTION public.user_exists(user_identifier text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE username = user_identifier OR id::text = user_identifier
  );
$function$;
