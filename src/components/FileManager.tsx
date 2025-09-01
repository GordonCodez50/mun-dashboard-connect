import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Download, Share, Trash2, FileText } from 'lucide-react';

interface FileRecord {
  id: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
  is_public: boolean;
  description?: string;
}

export const FileManager = () => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('firebaseUserId', 'demo-user-id'); // Replace with actual Firebase user ID
      formData.append('isPublic', 'true');

      const response = await supabase.functions.invoke('google-drive-upload', {
        body: formData,
      });

      if (response.error) throw response.error;

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
      
      loadFiles();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error", 
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          File Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Input
            type="file"
            onChange={handleFileUpload}
            disabled={loading}
            className="flex-1"
          />
          <Button disabled={loading}>
            <Upload className="h-4 w-4 mr-2" />
            {loading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>

        <div className="grid gap-4">
          {files.map((file) => (
            <Card key={file.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{file.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {(file.size_bytes / 1024 / 1024).toFixed(2)} MB • {file.mime_type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(file.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Share className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};