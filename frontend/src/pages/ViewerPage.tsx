import { useEffect, useState } from 'react';
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

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await apiClient.delete(`/api/v1/documents/${documentId}`);
      window.location.href = '/'; // Go back to dashboard after deletion
    } catch (err) {
      console.error(err);
      alert('Failed to delete document');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading document...</div>;
  if (!docMeta) return (
    <div className="p-8 text-center text-red-500 flex flex-col items-center gap-4">
      <p>Failed to load document metadata.</p>
      <button 
        onClick={handleDelete}
        className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded font-medium border border-red-200"
      >
        Force Delete Corrupted Document
      </button>
      <Link to="/" className="text-sm text-blue-600 hover:underline">Return to Dashboard</Link>
    </div>
  );

  return (
    <div className="flex flex-col h-full animate-fade-in max-w-7xl mx-auto w-full">
      <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className="text-gray-500 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-lg flex items-center gap-2 font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Dashboard
          </Link>
          <div className="h-6 w-px bg-gray-200"></div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">{docMeta.fileName}</span>
          </div>
        </div>
        <button 
          onClick={handleDelete}
          className="flex items-center gap-2 bg-white text-gray-500 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:border-red-200 transition-all shadow-sm focus:ring-2 focus:ring-red-500/20"
          title="Delete Document"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Delete
        </button>
      </div>
      
      <ContractViewer 
        pdfUrl={docMeta.fileUrl || ''} 
        pageNumber={page}
        coordinates={coordinates}
      />
    </div>
  );
}
