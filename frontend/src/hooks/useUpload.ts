import { useState } from 'react';
import { apiClient } from '../api/client';

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setProgress(10);
    
    try {
      // 1. Intent
      const { uploadUrl, documentId } = await apiClient.post('/api/v1/documents/upload-intent', {
        fileName: file.name,
        fileSize: file.size,
        checksum: ''
      });
      setProgress(40);

      // 2. Direct Upload
      await apiClient.putDirect(uploadUrl, file, 'application/pdf');
      setProgress(80);

      // 3. Confirm
      await apiClient.post(`/api/v1/documents/${documentId}/confirm`, {});
      setProgress(100);
      
      return documentId;
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading, error, progress };
}
