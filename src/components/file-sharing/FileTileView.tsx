import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileText, Image, File, Music, Video } from 'lucide-react';
import { CloudinaryFile } from '@/types/file';

interface FileTileViewProps {
  files: CloudinaryFile[];
  onDownload: (file: CloudinaryFile) => void;
  formatFileSize: (bytes: number) => string;
  formatDate: (timestamp: number) => string;
}

const getFileIcon = (format: string) => {
  const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const videoFormats = ['mp4', 'avi', 'mov', 'mkv', 'webm'];
  const audioFormats = ['mp3', 'wav', 'flac', 'aac'];
  
  if (imageFormats.includes(format.toLowerCase())) {
    return Image;
  } else if (videoFormats.includes(format.toLowerCase())) {
    return Video;
  } else if (audioFormats.includes(format.toLowerCase())) {
    return Music;
  } else if (format.toLowerCase() === 'pdf') {
    return FileText;
  }
  return File;
};

const isImageFile = (format: string) => {
  const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  return imageFormats.includes(format.toLowerCase());
};

const FileTileView: React.FC<FileTileViewProps> = ({
  files,
  onDownload,
  formatFileSize,
  formatDate
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {files
        .sort((a, b) => b.uploadTime - a.uploadTime)
        .map((file) => {
          const FileIcon = getFileIcon(file.format);
          
          return (
            <div key={file.asset_id} className="group overflow-hidden rounded-lg border bg-card hover:shadow-lg transition-all duration-300">
              {/* File Preview */}
              <div className="relative h-48 bg-muted/50 flex items-center justify-center overflow-hidden">
                {isImageFile(file.format) ? (
                  <img
                    src={file.secure_url}
                    alt={file.originalName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to icon if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : (
                  <FileIcon className="h-16 w-16 text-muted-foreground" />
                )}
                
                {/* Fallback icon for failed images */}
                <FileIcon className="hidden h-16 w-16 text-muted-foreground" />
                
                {/* File type badge */}
                <Badge 
                  variant="secondary" 
                  className="absolute top-2 right-2 text-xs font-medium bg-background/80 backdrop-blur-sm"
                >
                  {file.format.toUpperCase()}
                </Badge>
              </div>
              
              {/* File Info - Now positioned below the image */}
              <div className="p-4 bg-gradient-to-b from-background/95 to-background">
                <div className="space-y-3">
                  <h3 className="font-medium text-sm truncate text-foreground">
                    {file.originalName}
                  </h3>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatFileSize(file.bytes)}</span>
                    <Badge variant="outline" className="text-xs">
                      {file.alertTag}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {formatDate(file.uploadTime)}
                    </div>
                    <Badge variant={file.uploaderRole === 'admin' ? 'default' : 'secondary'} className="text-xs">
                      {file.uploaderRole === 'admin' ? 'Admin' : 'Chair'}
                    </Badge>
                  </div>
                  
                  {/* Download Button */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onDownload(file)}
                    className="w-full"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default FileTileView;