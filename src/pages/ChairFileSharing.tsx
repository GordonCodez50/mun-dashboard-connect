import React, { useState, useEffect } from 'react';
import ChairLayout from '@/components/layout/ChairLayout';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { cloudinaryService } from '@/services/CloudinaryService.js';
import { realtimeService } from '@/services/firebaseService';
import { useAlertsSound } from '@/hooks/useAlertsSound';
import { useFirebaseRealtime } from '@/hooks/useFirebaseRealtime';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FolderOpen, Upload, Download, RefreshCw, FileText, Grid, List } from 'lucide-react';
import { CloudinaryFile } from '@/types/file';
import FileTileView from '@/components/file-sharing/FileTileView';
import { useIsMobile } from '@/hooks/use-mobile';

const ChairFileSharing = () => {
  const [files, setFiles] = useState<CloudinaryFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [alertTag, setAlertTag] = useState('printing');
  const [viewMode, setViewMode] = useState<'table' | 'tiles'>('table');
  const isMobile = useIsMobile();
  const [customTag, setCustomTag] = useState('');
  const [recipient, setRecipient] = useState<'admin' | 'r&t-admin' | 'members'>('admin');
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);
  const [alertsMuted, setAlertsMuted] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if user is HCC or FCC chair
  const isHCCOrFCCChair = user?.email === 'chair-hcc@bmunis.com' || user?.email === 'chair-fcc@bmunis.com';

  // Add alert notification system
  const { data: alertsData } = useFirebaseRealtime<any[]>('NEW_ALERT');
  useAlertsSound(liveAlerts, alertsMuted);

  // Process alerts data with proper validation
  useEffect(() => {
    if (alertsData && Array.isArray(alertsData)) {
      // Filter out invalid alerts to prevent "undefined from undefined" notifications
      const validAlerts = alertsData.filter(alert => 
        alert && 
        alert.id && 
        alert.type && 
        alert.council && 
        alert.message &&
        alert.chairName &&
        alert.type !== 'undefined' &&
        alert.council !== 'undefined' &&
        alert.message !== 'undefined' &&
        alert.chairName !== 'undefined' &&
        alert.message !== 'Demo alert message' &&
        !alert.chairName.includes('undefined') &&
        alert.chairName !== 'undefined by undefined'
      );

      // Check for R&T admin file shares specifically
      const rtAdminShares = alertsData.filter(alert => 
        alert && 
        alert.type === 'FILE_SHARE' && 
        alert.fromRole === 'admin-rt' &&
        alert.targetAudience && 
        (alert.targetAudience.includes(user?.council || '') || 
         alert.targetAudience.includes('chairs'))
      );

      if (rtAdminShares.length > 0) {
        toast({
          title: "File Shared",
          description: "A file was shared by R&T Admin",
        });
        loadFiles(); // Refresh files
      }

      setLiveAlerts(validAlerts);
    }
  }, [alertsData, user?.council, toast]);

  const loadFiles = async () => {
    try {
      if (!user?.council) return;
      
      // Get files from Firebase Realtime Database
      const [councilFiles, adminFiles, rtAdminFiles] = await Promise.all([
        realtimeService.getFiles(user.council),
        realtimeService.getAdminFiles(),
        realtimeService.getRTAdminFiles()
      ]);
      
      // Filter files for this chair
      const filteredFiles: CloudinaryFile[] = [
        ...Object.values(councilFiles || {}).filter((file: any) => 
          file.uploaderRole === 'chair' && file.councilId === user.council
        ) as CloudinaryFile[],
        ...Object.values(adminFiles || {}).filter((file: any) => 
          file.uploaderRole === 'admin' && (file.toCouncil === user.council || file.toCouncil === 'all')
        ) as CloudinaryFile[],
        ...Object.values(rtAdminFiles || {}).filter((file: any) => {
          const councilName = user.council;
          return file.sharedWith === `${councilName}-all` || file.sharedWith === `${councilName}-chairs`;
        }).map((file: any) => ({
          ...file,
          uploaderRole: 'admin-rt'
        })) as CloudinaryFile[]
      ];
      
      setFiles(filteredFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = () => {
    if (!user?.council) {
      toast({
        title: "Error",
        description: "No council found",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    cloudinaryService.openUploadWidget({
      onSuccess: async (uploadInfo) => {
        try {
          const finalAlertTag = alertTag === 'custom' ? customTag : alertTag;
          
          // Ensure all required fields have fallback values
          const fileName = uploadInfo.original_filename || uploadInfo.public_id || 'unknown_file';
          const fileFormat = uploadInfo.format || 'unknown';
          
          // Determine the recipient for HCC/FCC chairs
          let fileRecipient, sharedWithValue;
          
          if (isHCCOrFCCChair) {
            if (recipient === 'members') {
              fileRecipient = `${user.council}-members`;
              sharedWithValue = `${user.council}-members`;
            } else {
              fileRecipient = recipient;
              sharedWithValue = recipient;
            }
          } else {
            fileRecipient = finalAlertTag === 'printing' ? 'admin' : user.council || '';
            sharedWithValue = fileRecipient;
          }
          
          const fileMetadata = {
            secure_url: uploadInfo.secure_url || '',
            asset_id: uploadInfo.asset_id || uploadInfo.public_id || '',
            original_filename: fileName,
            bytes: uploadInfo.bytes || 0,
            format: fileFormat,
            uploadTime: Date.now(),
            uploaderRole: 'chair',
            councilId: user.council || 'unknown_council',
            toCouncil: user.council || 'unknown_council',
            alertTag: finalAlertTag || 'general',
            originalName: fileName,
            sharedWith: sharedWithValue || 'admin',
            sharedBy: user.id || user.council || 'unknown_user',
            visibility: isHCCOrFCCChair ? recipient : (finalAlertTag === 'printing' ? 'admin' : 'council'),
            fileType: fileFormat,
            recipient: recipient || 'admin',
            fromChair: isHCCOrFCCChair && recipient === 'members' ? user.council : 'unknown_council'
          };

          
          console.log('Saving chair file metadata:', fileMetadata);

          // Save to appropriate Firebase location based on recipient
          let saveResult;
          if (isHCCOrFCCChair && recipient === 'members') {
            // Save as chair-to-members file
            saveResult = await realtimeService.saveChairToMembersFile(user.council, uploadInfo.asset_id, fileMetadata);
          } else {
            // Save to normal location
            saveResult = await realtimeService.saveFileMetadata(user.council, uploadInfo.asset_id, fileMetadata);
          }
          
          console.log('Save result:', saveResult);
          
          if (!saveResult || !saveResult.success) {
            const errorMsg = saveResult?.error || 'Failed to save file metadata to Firebase';
            throw new Error(errorMsg);
          }
          
          // Trigger alert
          await realtimeService.createAlert({
            message: `Chair uploaded file: ${uploadInfo.original_filename}`,
            councilId: user.council,
            alertTag: finalAlertTag,
            type: 'FILE_UPLOAD'
          });

          toast({
            title: "Success",
            description: "File uploaded successfully",
          });
          
          loadFiles();
        } catch (error) {
          console.error('Upload error:', error);
          toast({
            title: "Error", 
            description: error.message || "Failed to save file metadata",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      },
      onError: (error) => {
        console.error('Cloudinary upload error:', error);
        toast({
          title: "Error",
          description: "Failed to upload file",
          variant: "destructive",
        });
        setLoading(false);
      }
    });
  };

  const handleDownload = (file: CloudinaryFile) => {
    try {
      const link = document.createElement('a');
      link.href = file.secure_url;
      link.download = file.originalName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: "File downloaded successfully",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  // Set up real-time file updates
  useEffect(() => {
    if (!user?.council) return;
    
    loadFiles();
    
    // Set up real-time listeners using existing realtimeService
    const unsubscribeCouncil = realtimeService.onNewAlert(() => {
      console.log('Real-time council files update detected');
      loadFiles();
    });
    
    const unsubscribeAdmin = realtimeService.onAlertStatusUpdates(() => {
      console.log('Real-time admin files update detected');
      loadFiles();
    });
    
    return () => {
      if (unsubscribeCouncil) unsubscribeCouncil();
      if (unsubscribeAdmin) unsubscribeAdmin();
    };
  }, [user?.council]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString();
  };

  return (
    <ChairLayout activeItem="files">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">File Sharing</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage and share files with your committee</p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            <FolderOpen className="h-4 w-4" />
            Committee Files
          </Badge>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Choose Files to Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>What's this file for?</Label>
              <div className="flex flex-col sm:flex-row gap-2" data-tour="file-mode-tabs">
                <Button
                  variant={alertTag === 'printing' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAlertTag('printing')}
                  className="w-full sm:w-auto"
                >
                  Printing
                </Button>
                <Button
                  variant={alertTag === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAlertTag('custom')}
                  className="w-full sm:w-auto"
                >
                  Custom
                </Button>
              </div>
              {alertTag === 'custom' && (
                <Input
                  placeholder="Enter custom alert tag"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                />
              )}
            </div>
            
            {/* Recipient Selection for HCC/FCC Chairs */}
            {isHCCOrFCCChair && (
              <div className="space-y-2">
                <Label>Send to:</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant={recipient === 'admin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRecipient('admin')}
                    className="w-full sm:w-auto"
                  >
                    Admin
                  </Button>
                  <Button
                    variant={recipient === 'r&t-admin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRecipient('r&t-admin')}
                    className="w-full sm:w-auto"
                  >
                    R&T Admin
                  </Button>
                  <Button
                    variant={recipient === 'members' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRecipient('members')}
                    className="w-full sm:w-auto"
                  >
                    {user?.council} Members
                  </Button>
                </div>
              </div>
            )}
            <Button
              onClick={handleFileUpload}
              disabled={loading || (alertTag === 'custom' && !customTag.trim())}
              className="w-full"
              data-tour="upload-button"
            >
              <Upload className="h-4 w-4 mr-2" />
              {loading ? '(Loading Screen)' : 'Choose Files to Upload'}
            </Button>
          </CardContent>
        </Card>

        {/* Files List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Files ({files.length})
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <div className="flex border rounded-md w-full sm:w-auto">
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="rounded-r-none flex-1 sm:flex-initial"
                  >
                    <List className="h-4 w-4 sm:mr-0 md:mr-1" />
                    <span className="sm:hidden md:inline">Table</span>
                  </Button>
                  <Button
                    variant={viewMode === 'tiles' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('tiles')}
                    className="rounded-l-none flex-1 sm:flex-initial"
                  >
                    <Grid className="h-4 w-4 sm:mr-0 md:mr-1" />
                    <span className="sm:hidden md:inline">Grid</span>
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={loadFiles} className="w-full sm:w-auto">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <span className="sm:hidden md:inline">Refresh</span>
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent data-tour="files-display">
            {files.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No files uploaded yet</p>
              </div>
            ) : (viewMode === 'tiles' || isMobile) ? (
              <FileTileView 
                files={files}
                onDownload={handleDownload}
                formatFileSize={formatFileSize}
                formatDate={formatDate}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Alert Tag</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files
                    .sort((a, b) => b.uploadTime - a.uploadTime)
                    .map((file) => (
                      <TableRow key={file.asset_id}>
                        <TableCell className="font-medium">
                          {file.originalName}
                        </TableCell>
                        <TableCell>{formatFileSize(file.bytes)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {file.format.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(file.uploadTime)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{file.alertTag}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={file.uploaderRole === 'admin' ? 'default' : file.uploaderRole === 'admin-rt' ? 'destructive' : 'secondary'}>
                            {file.uploaderRole === 'admin' ? 'Admin' : 
                             file.uploaderRole === 'admin-rt' ? 'R&T Admin' :
                             file.councilId}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(file)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ChairLayout>
  );
};

export default ChairFileSharing;
