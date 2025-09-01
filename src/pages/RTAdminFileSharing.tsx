import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import RTAdminLayout from '@/components/layout/RTAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { CloudinaryFile } from '@/types/file';
import { cloudinaryService } from '@/services/CloudinaryService';
import { realtimeService } from '@/services/firebaseService';
import { useFirebaseRealtime } from '@/hooks/useFirebaseRealtime';
import { useAlertsSound } from '@/hooks/useAlertsSound';
import { 
  Upload, 
  FileText, 
  Download, 
  RefreshCw,
  Eye,
  Grid,
  Table as TableIcon,
  Users,
  UserCheck
} from 'lucide-react';
import { format } from 'date-fns';

const RTAdminFileSharing: React.FC = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<CloudinaryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [shareTarget, setShareTarget] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'tiles'>('table');

  // Firebase real-time listeners
  const { data: alertData } = useFirebaseRealtime('NEW_ALERT');
  const { notificationSound } = useAlertsSound([], false);

  // Share target options
  const shareTargets = [
    { value: 'HCC-all', label: 'HCC Members & Chairs', icon: <Users className="h-4 w-4" /> },
    { value: 'FCC-all', label: 'FCC Members & Chairs', icon: <Users className="h-4 w-4" /> },
    { value: 'HCC-chairs', label: 'HCC Chairs Only', icon: <UserCheck className="h-4 w-4" /> },
    { value: 'FCC-chairs', label: 'FCC Chairs Only', icon: <UserCheck className="h-4 w-4" /> }
  ];

  // Load files on component mount
  useEffect(() => {
    loadFiles();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (alertData && Array.isArray(alertData)) {
      const validAlerts = alertData.filter(alert => 
        alert && 
        typeof alert === 'object' && 
        alert.type === 'FILE_UPLOAD' &&
        alert.fromRole === 'admin-rt'
      );

      if (validAlerts.length > 0) {
        // Play sound for file uploads
        if (notificationSound.current) {
          notificationSound.current.play().catch(console.error);
        }
        loadFiles(); // Refresh files when new uploads detected
      }
    }
  }, [alertData, notificationSound]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const adminFiles = await realtimeService.getRTAdminFiles();
      const filesList: CloudinaryFile[] = Object.keys(adminFiles).map(assetId => ({
        ...adminFiles[assetId],
        asset_id: assetId
      }));
      
      // Sort by upload time (newest first)
      filesList.sort((a, b) => (b.uploadTime || 0) - (a.uploadTime || 0));
      setFiles(filesList);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = () => {
    if (!shareTarget) {
      toast.error('Please select a share target first');
      return;
    }

    setUploading(true);
    
    cloudinaryService.openUploadWidget({
      onSuccess: async (uploadInfo) => {
        try {
          const fileMetadata = {
            secure_url: uploadInfo.secure_url,
            asset_id: uploadInfo.asset_id,
            original_filename: uploadInfo.original_filename,
            bytes: uploadInfo.bytes,
            format: uploadInfo.format,
            uploadTime: Date.now(),
            uploaderRole: 'admin-rt',
            sharedWith: shareTarget,
            targetAudience: getTargetAudienceLabel(shareTarget),
            originalName: uploadInfo.original_filename
          };

          // Save to Firebase Realtime Database
          await realtimeService.saveRTAdminFileMetadata(uploadInfo.asset_id, fileMetadata);

          // Create alert for file sharing
          await realtimeService.createAlert({
            type: 'FILE_SHARE',
            message: `A file "${uploadInfo.original_filename}" was shared by R&T Admin`,
            alertTag: 'FILE_SHARE',
            fromRole: 'admin-rt',
            targetAudience: shareTarget,
            timestamp: Date.now(),
            fileInfo: {
              asset_id: uploadInfo.asset_id,
              filename: uploadInfo.original_filename,
              sharedWith: shareTarget
            }
          });

          toast.success(`File shared with ${getTargetAudienceLabel(shareTarget)} successfully`);
          loadFiles();
          setShareTarget(''); // Reset selection
        } catch (error) {
          console.error('Error saving file metadata:', error);
          toast.error('Failed to share file');
        } finally {
          setUploading(false);
        }
      },
      onError: (error) => {
        console.error('Upload error:', error);
        toast.error('File upload failed');
        setUploading(false);
      }
    });
  };

  const getTargetAudienceLabel = (target: string): string => {
    return shareTargets.find(t => t.value === target)?.label || target;
  };

  const handleDownload = (file: CloudinaryFile) => {
    const link = document.createElement('a');
    link.href = file.secure_url;
    link.download = file.originalName || file.original_filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Downloading ${file.originalName || file.original_filename}`);
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return format(new Date(timestamp), 'MMM dd, yyyy HH:mm');
  };

  const getTargetIcon = (target: string) => {
    if (target.includes('chairs')) {
      return <UserCheck className="h-4 w-4" />;
    }
    return <Users className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <RTAdminLayout activeItem="file-sharing">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </RTAdminLayout>
    );
  }

  return (
    <RTAdminLayout activeItem="file-sharing">
      <div className="space-y-3 sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">R&T Admin File Sharing</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Share files with HCC and FCC councils</p>
        </div>

        {/* Upload Section */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
              Share Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <Select value={shareTarget} onValueChange={setShareTarget}>
                  <SelectTrigger className="h-11 sm:h-10">
                    <SelectValue placeholder="Select target audience..." />
                  </SelectTrigger>
                  <SelectContent>
                    {shareTargets.map(target => (
                      <SelectItem key={target.value} value={target.value}>
                        <div className="flex items-center gap-2">
                          {target.icon}
                          {target.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleFileUpload}
                disabled={!shareTarget || uploading}
                className="h-11 sm:h-10 sm:w-auto text-sm sm:text-base font-medium"
              >
                {uploading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploading ? 'Uploading...' : 'Choose Files to Share'}
              </Button>
            </div>
            {shareTarget && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  {getTargetIcon(shareTarget)}
                  <span>Files will be shared with: <strong>{getTargetAudienceLabel(shareTarget)}</strong></span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Files Section */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                Shared Files ({files.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border p-1">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded transition-colors ${
                      viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    }`}
                  >
                    <TableIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('tiles')}
                    className={`p-1.5 rounded transition-colors ${
                      viewMode === 'tiles' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadFiles}
                  disabled={loading}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm sm:text-base">
                No files shared yet
              </div>
            ) : viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">File</th>
                      <th className="text-left p-2 font-medium hidden sm:table-cell">Size</th>
                      <th className="text-left p-2 font-medium hidden md:table-cell">Shared With</th>
                      <th className="text-left p-2 font-medium hidden lg:table-cell">Date</th>
                      <th className="text-right p-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file) => (
                      <tr key={file.asset_id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium text-sm">{file.originalName || file.original_filename}</div>
                              <div className="text-xs text-muted-foreground sm:hidden">
                                {formatFileSize(file.bytes)} • {getTargetAudienceLabel(file.sharedWith || '')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2 text-sm text-muted-foreground hidden sm:table-cell">
                          {formatFileSize(file.bytes)}
                        </td>
                        <td className="p-2 hidden md:table-cell">
                          <Badge variant="secondary" className="text-xs">
                            <div className="flex items-center gap-1">
                              {getTargetIcon(file.sharedWith || '')}
                              {getTargetAudienceLabel(file.sharedWith || '')}
                            </div>
                          </Badge>
                        </td>
                        <td className="p-2 text-xs text-muted-foreground hidden lg:table-cell">
                          {formatDate(file.uploadTime || 0)}
                        </td>
                        <td className="p-2">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(file)}
                              className="h-8 w-8 p-0"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {files.map((file) => (
                  <Card key={file.asset_id} className="p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {file.originalName || file.original_filename}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.bytes)}
                          </p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <Badge variant="secondary" className="text-xs w-fit">
                          <div className="flex items-center gap-1">
                            {getTargetIcon(file.sharedWith || '')}
                            {getTargetAudienceLabel(file.sharedWith || '')}
                          </div>
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(file.uploadTime || 0)}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(file)}
                          className="flex-1 h-8 text-xs"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RTAdminLayout>
  );
};

export default RTAdminFileSharing;