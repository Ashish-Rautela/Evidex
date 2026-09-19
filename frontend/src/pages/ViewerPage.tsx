import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ContractViewer } from '../components/ContractViewer';
import { apiClient } from '../api/client';

export function ViewerPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const [searchParams] = useSearchParams();
  const [docMeta, setDocMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get('page') || '1');
  const x1 = searchParams.get('x1');
  const y1 = searchParams.get('y1');
  const x2 = searchParams.get('x2');
  const y2 = searchParams.get('y2');

  const coordinates = x1 && y1 && x2 && y2 ? {
    x1: parseFloat(x1),
    y1: parseFloat(y1),
    x2: parseFloat(x2),
    y2: parseFloat(y2),
  } : undefined;

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await apiClient.get(`/api/v1/documents/${documentId}`);
        setDocMeta(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (documentId) fetchDoc();
  }, [documentId]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading document...</div>;
  if (!docMeta) return <div className="p-8 text-center text-red-500">Failed to load document metadata.</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link to="/" className="text-sm text-blue-600 hover:underline mr-4">&larr; Back to Dashboard</Link>
          <span className="font-semibold text-lg">{docMeta.fileName}</span>
        </div>
      </div>
      
      <ContractViewer 
        pdfUrl={docMeta.fileUrl || ''} // Assumes API returns a presigned url or direct path
        pageNumber={page}
        coordinates={coordinates}
      />
    </div>
  );
}
