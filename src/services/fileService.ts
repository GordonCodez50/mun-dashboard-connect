import { supabase } from '@/integrations/supabase/client';

export interface FileRecord {
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

export interface FileActivity {
  id: string;
  activity_type: string;
  user_id: string;
  created_at: string;
  details: any;
  ip_address?: unknown;
  user_agent?: string;
}

export interface UploadOptions {
  file: File;
  description?: string;
  folderPath?: string;
  isPublic?: boolean;
  userId: string;
}

export interface ShareOptions {
  fileId: string;
  sharedWith: string;
  permissionLevel?: 'view' | 'edit';
  expiresAt?: string;
  userId: string;
}

class FileService {
  /**
   * Upload a file to Google Drive via Supabase Edge Function
   */
  async uploadFile(options: UploadOptions): Promise<void> {
    const { file, description = '', folderPath = '/general', isPublic = false, userId } = options;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);
    formData.append('firebaseUserId', userId);
    formData.append('isPublic', isPublic.toString());
    formData.append('description', description);
    formData.append('folderPath', folderPath);

    const { error } = await supabase.functions.invoke('google-drive-upload', {
      body: formData,
    });

    if (error) {
      throw new Error(error.message || 'Failed to upload file');
    }
  }

  /**
   * Download a file from Google Drive
   */
  async downloadFile(fileId: string, fileName: string, userId: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke('google-drive-download', {
      body: {
        fileId,
        firebaseUserId: userId
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to download file');
    }

    if (!data?.downloadUrl) {
      throw new Error('Download URL not available');
    }

    return data.downloadUrl;
  }

  /**
   * Share a file with another user
   */
  async shareFile(options: ShareOptions): Promise<void> {
    const { fileId, sharedWith, permissionLevel = 'view', expiresAt, userId } = options;

    const { error } = await supabase.functions.invoke('google-drive-share', {
      body: {
        fileId,
        sharedWith,
        permissionLevel,
        expiresAt,
        firebaseUserId: userId
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to share file');
    }
  }

  /**
   * Get files from a specific folder or all files
   */
  async getFiles(folderPath?: string): Promise<FileRecord[]> {
    let query = supabase.from('files').select('*');
    
    if (folderPath && folderPath !== 'all') {
      query = query.eq('folder_path', folderPath);
    }
    
    const { data, error } = await query.order('uploaded_at', { ascending: false });

    if (error) {
      throw new Error(error.message || 'Failed to load files');
    }

    return data || [];
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string): Promise<void> {
    const { error } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId);

    if (error) {
      throw new Error(error.message || 'Failed to delete file');
    }
  }

  /**
   * Get file activities for audit log
   */
  async getFileActivities(limit: number = 50): Promise<FileActivity[]> {
    const { data, error } = await supabase
      .from('file_activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message || 'Failed to load activities');
    }

    return data || [];
  }

  /**
   * Get shared files for current user
   */
  async getSharedFiles(userId: string): Promise<FileRecord[]> {
    const { data, error } = await supabase
      .from('files')
      .select(`
        *,
        file_shares!inner(shared_with, permission_level)
      `)
      .eq('file_shares.shared_with', userId);

    if (error) {
      throw new Error(error.message || 'Failed to load shared files');
    }

    return data || [];
  }

  /**
   * Update file metadata
   */
  async updateFile(fileId: string, updates: Partial<Pick<FileRecord, 'name' | 'description' | 'is_public'>>): Promise<void> {
    const { error } = await supabase
      .from('files')
      .update(updates)
      .eq('id', fileId);

    if (error) {
      throw new Error(error.message || 'Failed to update file');
    }
  }

  /**
   * Get file statistics for dashboard
   */
  async getFileStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    publicFiles: number;
    recentUploads: number;
  }> {
    const { data: files, error } = await supabase
      .from('files')
      .select('size_bytes, is_public, uploaded_at');

    if (error) {
      throw new Error(error.message || 'Failed to load file statistics');
    }

    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size_bytes, 0),
      publicFiles: files.filter(file => file.is_public).length,
      recentUploads: files.filter(file => new Date(file.uploaded_at) > lastWeek).length
    };

    return stats;
  }
}

export const fileService = new FileService();