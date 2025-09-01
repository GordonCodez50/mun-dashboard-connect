import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Upload } from 'lucide-react';

interface FileUploadFormProps {
  onUpload: (file: File, metadata: FileUploadMetadata) => Promise<void>;
  loading?: boolean;
  showFolderSelect?: boolean;
  showPublicToggle?: boolean;
  defaultFolder?: string;
  folders?: Array<{ value: string; label: string }>;
}

export interface FileUploadMetadata {
  description: string;
  folder: string;
  isPublic: boolean;
}

const FileUploadForm: React.FC<FileUploadFormProps> = ({
  onUpload,
  loading = false,
  showFolderSelect = false,
  showPublicToggle = false,
  defaultFolder = '/general',
  folders = []
}) => {
  const [description, setDescription] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(defaultFolder);
  const [isPublic, setIsPublic] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await onUpload(file, {
        description,
        folder: selectedFolder,
        isPublic
      });
      
      // Reset form
      setDescription('');
      setIsPublic(false);
      event.target.value = '';
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload File
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {(showFolderSelect || showPublicToggle) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {showFolderSelect && (
                <div>
                  <Label htmlFor="folder-select">Folder</Label>
                  <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select folder" />
                    </SelectTrigger>
                    <SelectContent>
                      {folders.map((folder) => (
                        <SelectItem key={folder.value} value={folder.value}>
                          {folder.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {showPublicToggle && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="public-toggle"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                  />
                  <Label htmlFor="public-toggle">Make public</Label>
                </div>
              )}
            </div>
          )}
          <div>
            <Label htmlFor="file-description">Description (optional)</Label>
            <Textarea
              id="file-description"
              placeholder="Describe the file contents..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                type="file"
                onChange={handleFileUpload}
                disabled={loading}
                className="cursor-pointer"
              />
            </div>
            <Button disabled={loading} variant="default">
              <Upload className="h-4 w-4 mr-2" />
              {loading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUploadForm;