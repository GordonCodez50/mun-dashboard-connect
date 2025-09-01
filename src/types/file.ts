export interface CloudinaryFile {
  secure_url: string;
  asset_id: string;
  original_filename: string;
  bytes: number;
  format: string;
  uploadTime: number;
  uploaderRole: string;
  councilId: string;
  toCouncil: string;
  alertTag: string;
  originalName: string;
  // Enhanced metadata for better file management
  sharedWith?: string;
  sharedBy?: string;
  visibility?: string;
  fileType?: string;
}