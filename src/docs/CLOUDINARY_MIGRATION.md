# Cloudinary Migration Documentation

## Overview
Successfully migrated the ISBMUN Dashboard file-sharing system from Supabase/Google Drive to Cloudinary while preserving Firebase Auth and Realtime Database alerts.

## What Was Implemented

### 1. CloudinaryService.js
- Created a new service module at `src/services/CloudinaryService.js`
- Configured Cloudinary Upload Widget with:
  - Cloud name: `dgnniyuqw`
  - Upload preset: `unsigned_mun_uploads`
  - Folder: `ISBMUN2025/`
  - File format restrictions: pdf, docx, doc, txt, png, jpg, jpeg, gif
  - Max file size: 10MB
  - Clean UI styling with theme configuration

### 2. Chair File Sharing (`/chair/files`)
- **Updated:** `src/pages/ChairFileSharing.tsx`
- **Features:**
  - Upload button using Cloudinary widget
  - Alert tag selection (printing/custom)
  - Files saved to Firebase Realtime DB: `/files/{councilId}/{asset_id}`
  - Real-time file listing with 10-second polling
  - Role-based visibility (own uploads + admin files sent to council)
  - Sortable table with download links
  - Manual refresh functionality

### 3. Admin File Sharing (`/admin/files`)
- **Created:** `src/pages/AdminFileSharing.tsx`
- **Features:**
  - Upload button using Cloudinary widget
  - Council selection (all councils or specific)
  - Alert tag selection (printing/custom)
  - Files saved to Firebase Realtime DB: `/files/admin/{asset_id}`
  - Complete file management view
  - Download functionality for all uploaded files

### 4. Firebase Realtime Database Integration
- **Enhanced:** `src/services/firebaseService.ts`
- **New Methods Added:**
  - `saveFileMetadata(councilId, assetId, fileMetadata)`
  - `saveAdminFileMetadata(assetId, fileMetadata)`
  - `getFiles(councilId)`
  - `getAdminFiles()`

### 5. File Metadata Structure
```javascript
{
  secure_url: string,        // Cloudinary download URL
  asset_id: string,          // Cloudinary asset ID
  original_filename: string, // Original file name
  bytes: number,             // File size
  format: string,            // File format
  uploadTime: number,        // Upload timestamp
  uploaderRole: string,      // 'chair' or 'admin'
  councilId: string,         // Council identifier
  toCouncil: string,         // Target council ('all' or specific)
  alertTag: string,          // 'printing' or custom tag
  originalName: string       // Display name
}
```

### 6. Real-Time Alerts
- **Preserved:** Existing Firebase alert logic unchanged
- Alerts triggered on file upload with metadata
- Toast notifications maintained
- Alert routing and handling preserved

## File Organization

### Chair Files
- **Storage:** `/files/{councilId}/{asset_id}`
- **Visibility:** Chair sees own uploads + admin files sent to their council
- **Filtering:** `uploaderRole==='chair' && councilId===thisCouncil` OR `uploaderRole==='admin' && toCouncil===thisCouncil`

### Admin Files
- **Storage:** `/files/admin/{asset_id}`
- **Visibility:** Admin sees all uploads
- **Distribution:** Can send to specific councils or all councils

## UI/UX Features
- Clean upload interface with Cloudinary widget
- Sortable file tables by date, name, size
- Role-based badges (Admin/Chair)
- Alert tag badges (printing/custom)
- Download functionality with proper file names
- 10-second auto-refresh + manual refresh button
- Responsive design with shadcn/ui components

## Security & Permissions
- Files uploaded using unsigned preset (secure for client-side)
- Role-based access control maintained
- Firebase Realtime Database rules can be applied for additional security
- All downloads go through Cloudinary secure URLs

## Dependencies Added
- Cloudinary Upload Widget (loaded via CDN in index.html)
- No additional npm packages required

## Routes
- `/chair/files` - Chair file sharing interface
- `/admin/files` - Admin file sharing interface
- Existing routes preserved and functional

## Migration Benefits
1. **Simplified Architecture:** No more Google Drive API complexity
2. **Better Performance:** Direct CDN delivery via Cloudinary
3. **Cost Effective:** Cloudinary's generous free tier
4. **Easier Maintenance:** No OAuth/API key management
5. **Better UX:** Modern upload widget with progress indicators
6. **Preserved Functionality:** All existing features maintained