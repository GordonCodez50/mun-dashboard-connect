import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Share, Trash2, Eye, Clock, Users } from 'lucide-react';

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

interface FileCardProps {
  file: FileRecord;
  onDownload: (fileId: string, fileName: string) => void;
  onShare: (fileId: string) => void;
  onDelete?: (fileId: string) => void;
  showDeleteButton?: boolean;
}

const FileCard: React.FC<FileCardProps> = ({
  file,
  onDownload,
  onShare,
  onDelete,
  showDeleteButton = false
}) => {
  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card className="border-l-4 border-l-primary/20 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-foreground truncate">{file.name}</h3>
              {file.is_public && (
                <Badge variant="outline" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  Public
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>{formatFileSize(file.size_bytes)} • {file.mime_type}</p>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(file.uploaded_at)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {file.access_count} views
                </span>
              </div>
              {file.description && (
                <p className="text-xs text-muted-foreground italic line-clamp-2">
                  {file.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onDownload(file.id, file.name)}
              title="Download file"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onShare(file.id)}
              title="Share file"
            >
              <Share className="h-4 w-4" />
            </Button>
            {showDeleteButton && onDelete && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onDelete(file.id)}
                title="Delete file"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileCard;