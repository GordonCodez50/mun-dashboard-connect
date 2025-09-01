import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, FolderOpen } from 'lucide-react';
import FileCard from './FileCard';

interface FileRecord {
  id: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
  is_public: boolean;
  description?: string;
  folder_path: string;
  access_count: number;
  last_accessed?: string;
}

interface FileListProps {
  files: FileRecord[];
  onDownload: (fileId: string, fileName: string) => void;
  onShare: (fileId: string) => void;
  onDelete?: (fileId: string) => void;
  showDeleteButton?: boolean;
  currentFolder?: string;
  folderLabel?: string;
}

const FileList: React.FC<FileListProps> = ({
  files,
  onDownload,
  onShare,
  onDelete,
  showDeleteButton = false,
  currentFolder,
  folderLabel
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Files ({files.length})
          </div>
          {currentFolder && folderLabel && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <FolderOpen className="h-4 w-4" />
              {folderLabel}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              {currentFolder ? 'No files in this folder' : 'No files uploaded yet'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onDownload={onDownload}
                onShare={onShare}
                onDelete={onDelete}
                showDeleteButton={showDeleteButton}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileList;