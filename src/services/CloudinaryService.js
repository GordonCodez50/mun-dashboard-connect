// Cloudinary Upload Service
class CloudinaryService {
  constructor() {
    this.cloudName = 'dgnniyuqw';
    this.uploadPreset = 'unsigned_mun_uploads';
    this.folder = 'ISBMUN2025/';
  }

  /**
   * Opens the Cloudinary Upload Widget
   * @param {Object} options - Configuration options
   * @param {Function} options.onSuccess - Callback for successful upload
   * @param {Function} options.onError - Callback for upload errors
   */
  openUploadWidget({ onSuccess, onError }) {
    // Check if Cloudinary is already loaded
    if (window.cloudinary) {
      this.createWidget({ onSuccess, onError });
    } else {
      // Wait for Cloudinary to load
      const checkCloudinary = setInterval(() => {
        if (window.cloudinary) {
          clearInterval(checkCloudinary);
          this.createWidget({ onSuccess, onError });
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkCloudinary);
        if (!window.cloudinary) {
          console.error('Cloudinary script failed to load');
          onError?.('Cloudinary failed to load');
        }
      }, 10000);
    }
  }

  createWidget({ onSuccess, onError }) {
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: this.cloudName,
        uploadPreset: this.uploadPreset,
        folder: this.folder,
        multiple: false,
        maxFiles: 1,
        clientAllowedFormats: ['pdf', 'docx', 'doc', 'txt', 'png', 'jpg', 'jpeg', 'gif'],
        maxFileSize: 10000000, // 10MB
        theme: 'minimal',
        styles: {
          palette: {
            window: '#FFFFFF',
            windowBorder: '#E5E7EB',
            tabIcon: '#6B7280',
            menuIcons: '#6B7280',
            textDark: '#111827',
            textLight: '#6B7280',
            link: '#3B82F6',
            action: '#3B82F6',
            inactiveTabIcon: '#9CA3AF',
            error: '#EF4444',
            inProgress: '#F59E0B',
            complete: '#10B981',
            sourceBg: '#F9FAFB'
          }
        }
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          onError?.(error);
          return;
        }

        if (result && result.event === 'success') {
          const uploadInfo = {
            secure_url: result.info.secure_url,
            asset_id: result.info.asset_id || result.info.public_id,
            original_filename: result.info.original_filename,
            bytes: result.info.bytes,
            format: result.info.format,
            resource_type: result.info.resource_type,
            created_at: result.info.created_at,
            public_id: result.info.public_id
          };
          
          onSuccess?.(uploadInfo);
        }
      }
    );

    widget.open();
  }
}

export const cloudinaryService = new CloudinaryService();