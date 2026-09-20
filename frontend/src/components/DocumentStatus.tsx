import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

export function DocumentStatus({ documentId, initialStatus, errorMessage }: { documentId: string, initialStatus: string, errorMessage?: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [errorMsg, setErrorMsg] = useState<string | undefined>(errorMessage);

  useEffect(() => {
    if (status === 'READY' || status === 'FAILED') return;

    const interval = setInterval(async () => {
      try {
        const doc = await apiClient.get(`/api/v1/documents/${documentId}`);
        setStatus(doc.status);
        if (doc.errorMessage) setErrorMsg(doc.errorMessage);
      } catch (err) {
        console.error('Error fetching document status:', err);
        setStatus('FAILED');
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [documentId, status]);

  const getBadgeStyle = () => {
    switch (status) {
      case 'READY': return 'bg-green-100 text-green-800 border-green-200';
      case 'FAILED': return 'bg-red-100 text-red-800 border-red-200';
      case 'UPLOADED': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'QUEUED': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // EXTRACTING, CHUNKING, EMBEDDING
    }
  };

  return (
    <span 
      className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getBadgeStyle()}`}
      title={status === 'FAILED' ? errorMsg || 'Processing failed' : undefined}
    >
      {status}
    </span>
  );
}
