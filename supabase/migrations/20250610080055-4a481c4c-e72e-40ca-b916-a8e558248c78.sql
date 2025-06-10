
-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create app role enum for permissions
CREATE TYPE public.permission_level AS ENUM ('owner', 'editor', 'viewer');

-- Create column type enum
CREATE TYPE public.column_type AS ENUM ('text', 'checkbox', 'select');

-- Create tables metadata table
CREATE TABLE public.tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table permissions table
CREATE TABLE public.table_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission permission_level NOT NULL DEFAULT 'viewer',
  granted_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(table_id, user_id)
);

-- Create table columns table
CREATE TABLE public.table_columns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  column_type column_type NOT NULL DEFAULT 'text',
  column_order INTEGER NOT NULL,
  options JSONB, -- For select type options
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(table_id, column_order)
);

-- Create table data table
CREATE TABLE public.table_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL,
  column_id UUID NOT NULL REFERENCES public.table_columns(id) ON DELETE CASCADE,
  value JSONB, -- Flexible storage for any value type
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(table_id, row_index, column_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_data ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check table permissions
CREATE OR REPLACE FUNCTION public.has_table_permission(table_id UUID, required_permission permission_level)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is owner
  IF EXISTS (
    SELECT 1 FROM public.tables 
    WHERE id = table_id AND owner_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has explicit permission
  IF required_permission = 'viewer' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.table_permissions 
      WHERE table_permissions.table_id = has_table_permission.table_id 
      AND user_id = auth.uid()
      AND permission IN ('owner', 'editor', 'viewer')
    );
  ELSIF required_permission = 'editor' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.table_permissions 
      WHERE table_permissions.table_id = has_table_permission.table_id 
      AND user_id = auth.uid()
      AND permission IN ('owner', 'editor')
    );
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for tables
CREATE POLICY "Users can view tables they have access to" ON public.tables 
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    public.has_table_permission(id, 'viewer')
  );

CREATE POLICY "Users can create their own tables" ON public.tables 
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Table owners can update their tables" ON public.tables 
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Table owners can delete their tables" ON public.tables 
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for table_permissions
CREATE POLICY "Users can view permissions for tables they own or have access to" ON public.table_permissions 
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.tables WHERE id = table_id AND owner_id = auth.uid())
  );

CREATE POLICY "Table owners can manage permissions" ON public.table_permissions 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tables WHERE id = table_id AND owner_id = auth.uid())
  );

-- RLS Policies for table_columns
CREATE POLICY "Users can view columns for accessible tables" ON public.table_columns 
  FOR SELECT USING (public.has_table_permission(table_id, 'viewer'));

CREATE POLICY "Table owners can manage columns" ON public.table_columns 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tables WHERE id = table_id AND owner_id = auth.uid())
  );

-- RLS Policies for table_data
CREATE POLICY "Users can view data for accessible tables" ON public.table_data 
  FOR SELECT USING (public.has_table_permission(table_id, 'viewer'));

CREATE POLICY "Users with edit permission can modify data" ON public.table_data 
  FOR ALL USING (public.has_table_permission(table_id, 'editor'));

-- Create trigger function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.tables
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.table_data
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for live updates
ALTER TABLE public.tables REPLICA IDENTITY FULL;
ALTER TABLE public.table_columns REPLICA IDENTITY FULL;
ALTER TABLE public.table_data REPLICA IDENTITY FULL;
ALTER TABLE public.table_permissions REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_columns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_data;
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_permissions;
