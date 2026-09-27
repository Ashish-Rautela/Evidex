import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { CheckCircle2, AlertCircle, Clock, RefreshCw } from 'lucide-react';

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

  const getStatusDisplay = () => {
    switch (status) {
      case 'READY':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-black" />,
          classes: 'bg-neutral-100 text-black border-black',
          label: 'READY',
        };
      case 'FAILED':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-black" />,
          classes: 'bg-neutral-200 text-black border-black',
          label: 'FAILED',
        };
      case 'UPLOADED':
        return {
          icon: <Clock className="w-3.5 h-3.5 text-black" />,
          classes: 'bg-white text-black border-black',
          label: 'UPLOADED',
        };
      default: // EXTRACTING, CHUNKING, EMBEDDING, QUEUED
        return {
          icon: <RefreshCw className="w-3.5 h-3.5 text-black animate-spin" />,
          classes: 'bg-neutral-100 text-black border-black',
          label: status,
        };
    }
  };

  const { icon, classes, label } = getStatusDisplay();

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold rounded border-2 ${classes} shadow-[1.5px_1.5px_0px_#000]`}
      title={status === 'FAILED' ? errorMsg || 'Processing failed' : undefined}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
}
