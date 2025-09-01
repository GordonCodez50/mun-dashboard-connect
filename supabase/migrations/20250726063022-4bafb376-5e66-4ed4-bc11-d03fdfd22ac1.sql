-- Fix security issues by setting proper search_path for functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';