import React from 'react';
import { FileManager } from '@/components/FileManager';

const FileSharing = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Cloud File Sharing</h1>
        <FileManager />
      </div>
    </div>
  );
};

export default FileSharing;