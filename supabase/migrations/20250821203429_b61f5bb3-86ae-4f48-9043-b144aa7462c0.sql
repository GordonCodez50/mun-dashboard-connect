-- Create notification_logs table for storing all notification events
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  device_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  log_type TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  platform TEXT NOT NULL,
  browser TEXT,
  os_version TEXT,
  device_info JSONB,
  notification_data JSONB,
  error_message TEXT,
  error_stack TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own notification logs" 
ON public.notification_logs 
FOR INSERT 
WITH CHECK (true); -- Allow all inserts for logging purposes

CREATE POLICY "Users can view their own notification logs" 
ON public.notification_logs 
FOR SELECT 
USING (user_id = (auth.jwt() ->> 'sub'::text) OR user_id IS NULL);

CREATE POLICY "Admins can view all notification logs" 
ON public.notification_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = (auth.jwt() ->> 'sub'::text) 
  AND role = 'admin'
));

-- Create index for better performance
CREATE INDEX idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX idx_notification_logs_timestamp ON public.notification_logs(timestamp);
CREATE INDEX idx_notification_logs_device_id ON public.notification_logs(device_id);
CREATE INDEX idx_notification_logs_status ON public.notification_logs(status);