-- Create files table for tracking shared files
CREATE TABLE public.files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  google_drive_id TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  download_url TEXT,
  preview_url TEXT,
  uploaded_by TEXT NOT NULL, -- Firebase user ID
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accessed TIMESTAMP WITH TIME ZONE,
  access_count INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  tags TEXT[],
  folder_path TEXT DEFAULT '/',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create file_shares table for tracking file access permissions
CREATE TABLE public.file_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  shared_with TEXT NOT NULL, -- Firebase user ID or email
  permission_level TEXT NOT NULL CHECK (permission_level IN ('view', 'download', 'edit')),
  shared_by TEXT NOT NULL, -- Firebase user ID
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER NOT NULL DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create file_activities table for audit trail
CREATE TABLE public.file_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Firebase user ID
  activity_type TEXT NOT NULL CHECK (activity_type IN ('upload', 'download', 'view', 'share', 'delete', 'rename', 'move')),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for files table
CREATE POLICY "Users can view files they uploaded or have access to" 
ON public.files 
FOR SELECT 
USING (
  uploaded_by = auth.jwt() ->> 'sub' OR
  is_public = true OR
  id IN (
    SELECT file_id FROM public.file_shares 
    WHERE shared_with = auth.jwt() ->> 'sub' OR shared_with = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Users can insert their own files" 
ON public.files 
FOR INSERT 
WITH CHECK (uploaded_by = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own files" 
ON public.files 
FOR UPDATE 
USING (uploaded_by = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete their own files" 
ON public.files 
FOR DELETE 
USING (uploaded_by = auth.jwt() ->> 'sub');

-- Create RLS policies for file_shares table
CREATE POLICY "Users can view shares for their files or shares with them" 
ON public.file_shares 
FOR SELECT 
USING (
  shared_by = auth.jwt() ->> 'sub' OR
  shared_with = auth.jwt() ->> 'sub' OR
  shared_with = auth.jwt() ->> 'email' OR
  file_id IN (SELECT id FROM public.files WHERE uploaded_by = auth.jwt() ->> 'sub')
);

CREATE POLICY "Users can create shares for their files" 
ON public.file_shares 
FOR INSERT 
WITH CHECK (
  shared_by = auth.jwt() ->> 'sub' AND
  file_id IN (SELECT id FROM public.files WHERE uploaded_by = auth.jwt() ->> 'sub')
);

CREATE POLICY "Users can update shares they created" 
ON public.file_shares 
FOR UPDATE 
USING (shared_by = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete shares they created" 
ON public.file_shares 
FOR DELETE 
USING (shared_by = auth.jwt() ->> 'sub');

-- Create RLS policies for file_activities table
CREATE POLICY "Users can view activities for their files or files shared with them" 
ON public.file_activities 
FOR SELECT 
USING (
  user_id = auth.jwt() ->> 'sub' OR
  file_id IN (
    SELECT id FROM public.files WHERE uploaded_by = auth.jwt() ->> 'sub'
  ) OR
  file_id IN (
    SELECT file_id FROM public.file_shares 
    WHERE shared_with = auth.jwt() ->> 'sub' OR shared_with = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Users can insert their own activities" 
ON public.file_activities 
FOR INSERT 
WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Create indexes for better performance
CREATE INDEX idx_files_uploaded_by ON public.files(uploaded_by);
CREATE INDEX idx_files_google_drive_id ON public.files(google_drive_id);
CREATE INDEX idx_files_is_public ON public.files(is_public);
CREATE INDEX idx_files_created_at ON public.files(created_at DESC);
CREATE INDEX idx_file_shares_file_id ON public.file_shares(file_id);
CREATE INDEX idx_file_shares_shared_with ON public.file_shares(shared_with);
CREATE INDEX idx_file_activities_file_id ON public.file_activities(file_id);
CREATE INDEX idx_file_activities_user_id ON public.file_activities(user_id);
CREATE INDEX idx_file_activities_created_at ON public.file_activities(created_at DESC);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_files_updated_at
  BEFORE UPDATE ON public.files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to log file activities
CREATE OR REPLACE FUNCTION public.log_file_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.file_activities (file_id, user_id, activity_type, details)
    VALUES (NEW.id, NEW.uploaded_by, 'upload', json_build_object('file_name', NEW.name, 'size_bytes', NEW.size_bytes));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.name != NEW.name THEN
      INSERT INTO public.file_activities (file_id, user_id, activity_type, details)
      VALUES (NEW.id, NEW.uploaded_by, 'rename', json_build_object('old_name', OLD.name, 'new_name', NEW.name));
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.file_activities (file_id, user_id, activity_type, details)
    VALUES (OLD.id, OLD.uploaded_by, 'delete', json_build_object('file_name', OLD.name));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for activity logging
CREATE TRIGGER log_file_activity_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.files
  FOR EACH ROW
  EXECUTE FUNCTION public.log_file_activity();

-- Enable realtime for real-time updates
ALTER TABLE public.files REPLICA IDENTITY FULL;
ALTER TABLE public.file_shares REPLICA IDENTITY FULL;
ALTER TABLE public.file_activities REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.files;
ALTER PUBLICATION supabase_realtime ADD TABLE public.file_shares;
ALTER PUBLICATION supabase_realtime ADD TABLE public.file_activities;