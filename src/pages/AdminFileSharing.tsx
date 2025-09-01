import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { AdminMobileNav } from '@/components/layout/AdminMobileNav';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { cloudinaryService } from '@/services/CloudinaryService.js';
import { realtimeService, firestoreService } from '@/services/firebaseService';
import { useAlertsSound } from '@/hooks/useAlertsSound';
import { useFirebaseRealtime } from '@/hooks/useFirebaseRealtime';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FolderOpen, Upload, Download, RefreshCw, FileText, Grid, List } from 'lucide-react';
import { CloudinaryFile } from '@/types/file';
import FileTileView from '@/components/file-sharing/FileTileView';
import { useIsMobile } from '@/hooks/use-mobile';

const AdminFileSharing = () => {
  const [files, setFiles] = useState<CloudinaryFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [alertTag, setAlertTag] = useState('template');
  const [viewMode, setViewMode] = useState<'table' | 'tiles'>('table');
  const isMobile = useIsMobile();
  const [customTag, setCustomTag] = useState('');
  const [toCouncil, setToCouncil] = useState('all');
  const [councils, setCouncils] = useState(['all']);
  const [availableCouncils, setAvailableCouncils] = useState<string[]>([]);
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);
  const [alertsMuted, setAlertsMuted] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

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
        alert.type !== 'undefined' &&
        alert.council !== 'undefined'
      );
      setLiveAlerts(validAlerts);
    }
  }, [alertsData]);

  const loadFiles = async () => {
    try {
      console.log('Loading admin files...');
      
      // Get admin files from Firebase Realtime Database
      const adminFiles = await realtimeService.getAdminFiles();
      console.log('Admin files retrieved:', adminFiles);
      
      // Get chair files shared with admin (from all available councils)
      const chairFilesPromises = availableCouncils.map(async (council) => {
        try {
          const councilFiles = await realtimeService.getFiles(council);
          console.log(`Chair files from ${council}:`, councilFiles);
          return councilFiles || {};
        } catch (error) {
          console.error(`Error loading files from ${council}:`, error);
          return {};
        }
      });
      
      const allChairFiles = await Promise.all(chairFilesPromises);
      
      // Combine all file sources
      const combinedFiles: CloudinaryFile[] = [
        // Admin uploaded files
        ...Object.values(adminFiles || {}) as CloudinaryFile[],
        // Chair files that are shared with admin
        ...allChairFiles.flatMap(councilFiles => 
          Object.values(councilFiles).filter((file: any) => 
            file.uploaderRole === 'chair' && 
            (file.sharedWith === 'admin' || file.visibility === 'admin')
          ) as CloudinaryFile[]
        )
      ];
      
      console.log('Combined files array:', combinedFiles);
      setFiles(combinedFiles);
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
    setLoading(true);
    
    cloudinaryService.openUploadWidget({
      onSuccess: async (uploadInfo) => {
        try {
          const finalAlertTag = alertTag === 'custom' ? customTag : alertTag;
          
          const fileMetadata = {
            secure_url: uploadInfo.secure_url,
            asset_id: uploadInfo.asset_id,
            original_filename: uploadInfo.original_filename,
            bytes: uploadInfo.bytes,
            format: uploadInfo.format,
            uploadTime: Date.now(),
            uploaderRole: 'admin',
            councilId: user?.id || 'admin',
            toCouncil: toCouncil,
            alertTag: finalAlertTag,
            originalName: uploadInfo.original_filename,
            // Enhanced metadata
            sharedWith: toCouncil === 'all' ? 'all_councils' : toCouncil,
            sharedBy: user?.id || 'admin',
            visibility: 'public',
            fileType: uploadInfo.format || 'unknown'
          };
          
          console.log('Saving admin file metadata:', fileMetadata);

          // Save to Firebase Realtime Database
          const saveResult = await realtimeService.saveAdminFileMetadata(uploadInfo.asset_id, fileMetadata);
          console.log('Save result:', saveResult);
          
          if (!saveResult) {
            throw new Error('Failed to save file metadata to Firebase');
          }
          
          // Trigger alert
          await realtimeService.createAlert({
            message: `Admin uploaded file: ${uploadInfo.original_filename}`,
            councilId: toCouncil === 'all' ? 'all' : toCouncil,
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
            description: "Failed to save file metadata",
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

  // Load councils on component mount
  useEffect(() => {
    const loadCouncils = async () => {
      try {
        const councilsData = await firestoreService.getCouncilsFromUsers();
        const councilNames = councilsData.map((council: any) => council.name);
        console.log('Available councils:', councilNames);
        setAvailableCouncils(councilNames);
        setCouncils(['all', ...councilNames]);
      } catch (error) {
        console.error('Error loading councils:', error);
        // Set default councils if loading fails
        setAvailableCouncils(['ECOSOC', 'UNHRC', 'UNSC', 'SPECPOL', 'DISEC']);
        setCouncils(['all', 'ECOSOC', 'UNHRC', 'UNSC', 'SPECPOL', 'DISEC']);
      }
    };
    
    loadCouncils();
  }, []);

  // Set up real-time file updates
  useEffect(() => {
    if (availableCouncils.length === 0) return; // Wait for councils to load
    
    loadFiles();
    
    // Set up real-time listener using existing realtimeService
    const unsubscribe = realtimeService.onNewAlert(() => {
      console.log('Real-time admin files update detected');
      loadFiles(); // Reload all files when admin files change
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [availableCouncils]);

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
    <>
      <AdminMobileNav />
      <AdminLayout activeItem="files">
        <div className="space-y-6 md:ml-0 ml-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Admin File Sharing</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Upload and manage files for all councils</p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            <FolderOpen className="h-4 w-4" />
            Admin Files
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Send to Council</Label>
                <Select value={toCouncil} onValueChange={setToCouncil}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select council" />
                  </SelectTrigger>
                  <SelectContent>
                    {councils.map((council) => (
                      <SelectItem key={council} value={council}>
                        {council === 'all' ? 'All Councils' : council}
                      </SelectItem>
                    ))}
                    <SelectItem value="admin-rt">Admin R&T</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Alert Tag</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={alertTag === 'template' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAlertTag('template')}
                    className="text-xs sm:text-sm"
                  >
                    Template
                  </Button>
                  <Button
                    variant={alertTag === 'guideline' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAlertTag('guideline')}
                    className="text-xs sm:text-sm"
                  >
                    Guideline
                  </Button>
                  <Button
                    variant={alertTag === 'custom' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAlertTag('custom')}
                    className="text-xs sm:text-sm"
                  >
                    Custom
                  </Button>
                </div>
              </div>
            </div>
            {alertTag === 'custom' && (
              <Input
                placeholder="Enter custom alert tag"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
              />
            )}
            <Button
              onClick={handleFileUpload}
              disabled={loading || (alertTag === 'custom' && !customTag.trim())}
              className="w-full"
              size={isMobile ? "default" : "lg"}
            >
              <Upload className="h-4 w-4 mr-2" />
              {loading ? 'Loading...' : 'Choose Files to Upload'}
            </Button>
          </CardContent>
        </Card>

        {/* Files List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span className="text-base sm:text-lg">All Files ({files.length})</span>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="rounded-r-none px-2 sm:px-3"
                  >
                    <List className="h-4 w-4" />
                    {!isMobile && <span className="ml-1">Table</span>}
                  </Button>
                  <Button
                    variant={viewMode === 'tiles' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('tiles')}
                    className="rounded-l-none px-2 sm:px-3"
                  >
                    <Grid className="h-4 w-4" />
                    {!isMobile && <span className="ml-1">Tiles</span>}
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={loadFiles} className="w-full sm:w-auto">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">File Name</TableHead>
                      <TableHead className="min-w-[60px] hidden sm:table-cell">Type</TableHead>
                      <TableHead className="min-w-[80px] hidden lg:table-cell">Alert Tag</TableHead>
                      <TableHead className="min-w-[80px] hidden md:table-cell">Source</TableHead>
                      <TableHead className="min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files
                      .sort((a, b) => b.uploadTime - a.uploadTime)
                      .map((file) => (
                        <TableRow key={file.asset_id}>
                          <TableCell className="font-medium">
                            <div className="truncate max-w-[120px] sm:max-w-[160px]" title={file.originalName}>
                              {file.originalName}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline" className="text-xs">
                              {file.format.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge variant="outline" className="text-xs">{file.alertTag}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant={file.uploaderRole === 'admin' ? 'default' : 'secondary'} className="text-xs">
                              {file.uploaderRole === 'admin' ? 'Admin' : file.councilId}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(file)}
                              className="text-xs px-2"
                            >
                              <Download className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Download</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
          </div>
        </AdminLayout>
      </>
    );
};

export default AdminFileSharing;