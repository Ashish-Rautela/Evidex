import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadForm } from '../components/UploadForm';
import { DocumentStatus } from '../components/DocumentStatus';
import { RetroMacIllustration } from '../components/RetroMacIllustration';
import { apiClient } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { 
  FileText, 
  ArrowUpRight, 
  Trash2, 
  Search, 
  Upload, 
  LayoutGrid, 
  List,
  FolderOpen
} from 'lucide-react';

export function DashboardPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const uploadSectionRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchDocs = async () => {
    try {
      const res = await apiClient.get('/api/v1/documents');
      setDocuments(res.documents || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const scrollToUpload = () => {
    uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto py-6">
      {/* HERO SECTION - Inspired by Screenshot */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-8 pt-4 pb-8 border-b-2 border-black">
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white border-2 border-black rounded text-xs font-mono font-bold shadow-[2px_2px_0px_#000]">
            <span className="w-2 h-2 rounded-full bg-black inline-block animate-pulse"></span>
            <span>SYSTEM STATUS: ONLINE</span>
            {user?.tenantId && <span className="text-neutral-500">[{user.tenantId}]</span>}
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-black tracking-tight leading-none">
            Hello.<br />
            I'm Evidex.
          </h1>

          <p className="text-neutral-700 text-lg font-serif italic max-w-lg leading-relaxed">
            AI-powered contract intelligence & semantic search engine. Ingest legal documents, extract structured clauses, and query agreements in natural language.
          </p>

          <div className="pt-2 flex flex-wrap gap-3 justify-center md:justify-start">
            <button
              onClick={scrollToUpload}
              className="ink-btn px-6 py-3 bg-black text-white hover:bg-neutral-800 font-mono font-bold text-sm rounded flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Ingest Contracts
            </button>
            <button
              onClick={() => navigate('/search')}
              className="ink-btn px-6 py-3 bg-white text-black hover:bg-neutral-100 font-mono font-bold text-sm rounded flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search Library
            </button>
          </div>
        </div>

        {/* Vintage Macintosh + Ink Pen SVG illustration */}
        <div className="shrink-0 flex items-center justify-center p-4">
          <RetroMacIllustration className="w-64 h-64 md:w-80 md:h-80" />
        </div>
      </section>

      {/* QUICK LINKS BAR - Exact Match to Screenshot */}
      <section className="space-y-2">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
          Quick links
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 border-2 border-black rounded bg-white shadow-[3px_3px_0px_#000] overflow-hidden divide-y md:divide-y-0 md:divide-x-2 divide-black">
          <button
            onClick={scrollToUpload}
            className="p-3 text-left hover:bg-neutral-100 transition-colors flex items-center justify-between group font-mono text-sm font-bold text-black"
          >
            <span>Ingest Document</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
          <button
            onClick={() => navigate('/search')}
            className="p-3 text-left hover:bg-neutral-100 transition-colors flex items-center justify-between group font-mono text-sm font-bold text-black"
          >
            <span>Semantic Search</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('contracts-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="p-3 text-left hover:bg-neutral-100 transition-colors flex items-center justify-between group font-mono text-sm font-bold text-black"
          >
            <span>Contract Library</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
          <button
            onClick={() => {
              if (documents.length > 0) {
                navigate(`/viewer/${documents[0].documentId}`);
              } else {
                alert('No contracts available to view yet. Ingest one below!');
              }
            }}
            className="p-3 text-left hover:bg-neutral-100 transition-colors flex items-center justify-between group font-mono text-sm font-bold text-black"
          >
            <span>Latest Contract</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* UPLOAD CONTRACT SECTION (Retro Mac Window Frame) */}
      <section ref={uploadSectionRef} className="border-2 border-black rounded-lg bg-white shadow-[4px_4px_0px_#000] overflow-hidden">
        {/* Retro Window Titlebar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-100 border-b-2 border-black font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full border border-black bg-white inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full border border-black bg-white inline-block"></span>
            </span>
            <span className="font-bold text-black ml-1">evidex // contract-ingestion.app</span>
          </div>
          <span className="text-neutral-500 font-mono text-[10px]">PDF · TEXTRACT · TITAN</span>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <h2 className="text-2xl font-black text-black">Upload New Contract</h2>
            <p className="text-neutral-600 text-sm mt-1 font-serif">
              Upload PDF agreements to trigger OCR extraction, clause segmentation, and vector embedding generation.
            </p>
          </div>
          <UploadForm onUploadComplete={fetchDocs} />
        </div>
      </section>

      {/* CONTRACTS / PROJECTS SECTION - Exactly in Screenshot Format */}
      <section id="contracts-section" className="space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black text-black tracking-tight">Contracts</h2>
            <span className="font-mono text-xs font-bold border-2 border-black px-2.5 py-0.5 rounded bg-white shadow-[1.5px_1.5px_0px_#000]">
              {documents.length} Total
            </span>
          </div>

          {/* Grid vs Table View Mode */}
          <div className="flex items-center gap-1 border-2 border-black rounded bg-white p-0.5 shadow-[1.5px_1.5px_0px_#000]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded text-xs font-mono font-bold flex items-center gap-1 ${
                viewMode === 'grid' ? 'bg-black text-white' : 'text-black hover:bg-neutral-100'
              }`}
              title="Card Grid View (Screenshot style)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded text-xs font-mono font-bold flex items-center gap-1 ${
                viewMode === 'table' ? 'bg-black text-white' : 'text-black hover:bg-neutral-100'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="border-2 border-dashed border-black rounded-lg p-12 text-center bg-white shadow-[3px_3px_0px_#000]">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 text-neutral-400 stroke-1" />
            <h3 className="font-bold text-lg text-black font-mono">No contracts found in repository</h3>
            <p className="text-neutral-600 text-sm font-serif mt-1 mb-4">
              Ingest your first contract PDF using the upload panel above.
            </p>
            <button
              onClick={scrollToUpload}
              className="ink-btn px-4 py-2 bg-black text-white font-mono font-bold text-xs rounded"
            >
              Upload Contract →
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* RETRO MAC PROJECT CARDS (Screenshot Style!) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div
                key={doc.documentId}
                className="border-2 border-black rounded-lg bg-white shadow-[4px_4px_0px_#000] overflow-hidden flex flex-col transition-transform hover:-translate-y-1"
              >
                {/* Retro Window Header bar: oo filename */}
                <div className="flex items-center justify-between px-3 py-2 bg-neutral-100 border-b-2 border-black font-mono text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="flex items-center gap-1 shrink-0">
                      <span className="w-2 h-2 rounded-full border border-black bg-white inline-block"></span>
                      <span className="w-2 h-2 rounded-full border border-black bg-white inline-block"></span>
                    </span>
                    <span className="truncate font-bold text-black" title={doc.fileName}>
                      {doc.fileName.length > 24 ? doc.fileName.substring(0, 24) + '…' : doc.fileName}
                    </span>
                  </div>
                  <DocumentStatus 
                    documentId={doc.documentId} 
                    initialStatus={doc.status} 
                    errorMessage={doc.errorMessage} 
                  />
                </div>

                {/* Ink Document Thumbnail / Graphic Header */}
                <div className="h-32 bg-neutral-100 border-b-2 border-black relative p-4 flex flex-col justify-between overflow-hidden">
                  {/* Subtle retro hatched background pattern */}
                  <div 
                    className="absolute inset-0 opacity-10 pointer-events-none" 
                    style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '8px 8px' }} 
                  />
                  <div className="flex justify-between items-start z-10">
                    <span className="bg-white border-2 border-black px-2 py-0.5 rounded font-mono text-[10px] font-bold shadow-[1px_1px_0px_#000]">
                      {doc.totalPages ? `${doc.totalPages} PAGES` : 'PDF'}
                    </span>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!window.confirm(`Delete ${doc.fileName}?`)) return;
                        try {
                          await apiClient.delete(`/api/v1/documents/${doc.documentId}`);
                          fetchDocs();
                        } catch (err) {
                          alert('Failed to delete document');
                        }
                      }}
                      className="p-1.5 bg-white border-2 border-black rounded hover:bg-black hover:text-white transition-colors shadow-[1px_1px_0px_#000]"
                      title="Delete contract"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="z-10">
                    <span className="font-mono text-[10px] text-neutral-500 font-bold block">INGESTION DATE</span>
                    <span className="font-mono text-xs font-bold text-black">
                      {new Date(doc.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Card Content & Action Button (matching screenshot "View project") */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-black tracking-tight mb-2 truncate" title={doc.fileName}>
                      {doc.fileName}
                    </h3>
                    <p className="font-serif text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                      Indexed document with legal clause semantic metadata and token embeddings.
                    </p>
                  </div>

                  <div className="pt-4 mt-2 border-t-2 border-black/10">
                    <button
                      onClick={() => navigate(`/viewer/${doc.documentId}`)}
                      className="ink-btn w-full py-2 bg-white hover:bg-black hover:text-white text-black font-mono font-bold text-xs rounded transition-colors"
                    >
                      View contract →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="border-2 border-black rounded-lg bg-white shadow-[4px_4px_0px_#000] overflow-hidden">
            <table className="min-w-full divide-y-2 divide-black text-sm">
              <thead className="bg-neutral-100 font-mono text-xs font-bold text-black">
                <tr>
                  <th className="px-6 py-3 text-left">File Name</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Pages</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 font-mono text-xs">
                {documents.map((doc) => (
                  <tr 
                    key={doc.documentId}
                    onClick={() => navigate(`/viewer/${doc.documentId}`)}
                    className="hover:bg-neutral-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 font-bold text-black flex items-center gap-2">
                      <FileText className="w-4 h-4 text-black shrink-0" />
                      {doc.fileName}
                    </td>
                    <td className="px-6 py-4">
                      <DocumentStatus documentId={doc.documentId} initialStatus={doc.status} errorMessage={doc.errorMessage} />
                    </td>
                    <td className="px-6 py-4 font-bold">{doc.totalPages || '-'}</td>
                    <td className="px-6 py-4 text-neutral-600">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!window.confirm(`Delete ${doc.fileName}?`)) return;
                          try {
                            await apiClient.delete(`/api/v1/documents/${doc.documentId}`);
                            fetchDocs();
                          } catch (err) {
                            alert('Failed to delete document');
                          }
                        }}
                        className="ink-btn p-1.5 bg-white text-black hover:bg-black hover:text-white rounded"
                        title="Delete contract"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
