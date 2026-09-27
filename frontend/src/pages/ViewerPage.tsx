import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ContractViewer } from '../components/ContractViewer';
import { apiClient } from '../api/client';
import { ArrowLeft, Trash2, FileText, AlertCircle } from 'lucide-react';

export function ViewerPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const [searchParams] = useSearchParams();
  const [docMeta, setDocMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Failed to delete document');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center font-mono text-sm font-bold text-black border-2 border-black rounded bg-white shadow-[3px_3px_0px_#000] max-w-md mx-auto my-12">
        Loading Contract Metadata…
      </div>
    );
  }

  if (!docMeta) {
    return (
      <div className="p-8 text-center border-2 border-black rounded bg-white shadow-[4px_4px_0px_#000] max-w-md mx-auto my-12 flex flex-col items-center gap-4">
        <AlertCircle className="w-10 h-10 text-black" />
        <h3 className="font-mono font-bold text-lg text-black">Metadata Load Failed</h3>
        <p className="font-serif italic text-sm text-neutral-600">
          The document could not be retrieved from storage.
        </p>
        <div className="flex gap-3">
          <button 
            onClick={handleDelete}
            className="ink-btn bg-white hover:bg-neutral-100 text-black px-4 py-2 rounded text-xs font-mono font-bold"
          >
            Force Delete Record
          </button>
          <Link 
            to="/" 
            className="ink-btn bg-black text-white hover:bg-neutral-800 px-4 py-2 rounded text-xs font-mono font-bold"
          >
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto w-full py-4 space-y-4">
      {/* Top Controls Bar in Retro Window Frame */}
      <div className="border-2 border-black rounded-lg bg-white p-3 shadow-[4px_4px_0px_#000] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className="ink-btn bg-white hover:bg-neutral-100 text-black px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <div className="h-5 w-[2px] bg-black"></div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-black" />
            <span className="font-mono font-bold text-black text-sm tracking-tight truncate max-w-md">
              {docMeta.fileName}
            </span>
          </div>
        </div>

        <button 
          onClick={handleDelete}
          className="ink-btn bg-white hover:bg-black hover:text-white text-black px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
          title="Delete Document"
        >
          <Trash2 className="w-3.5 h-3.5" />
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
