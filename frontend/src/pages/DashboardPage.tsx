import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadForm } from '../components/UploadForm';
import { DocumentStatus } from '../components/DocumentStatus';
import { apiClient } from '../api/client';

export function DashboardPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const navigate = useNavigate();

  const fetchDocs = async () => {
    try {
      const res = await apiClient.get('/api/v1/documents');
      setDocuments(res.documents || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-8">
      <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Upload New Contract</h1>
          <p className="text-gray-500 mt-1">Upload a PDF document to begin the AI ingestion and analysis pipeline.</p>
        </div>
        <div className="mt-2">
          <UploadForm onUploadComplete={fetchDocs} />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Your Documents</h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {documents.length} Total
          </span>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 tracking-wide">File Name</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 tracking-wide">Status</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 tracking-wide">Pages</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 tracking-wide">Date</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-600 tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-gray-400 font-medium">No documents found. Upload one to get started.</p>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr 
                    key={doc.documentId} 
                    onClick={() => navigate(`/viewer/${doc.documentId}`)}
                    className="hover:bg-blue-50/50 cursor-pointer transition duration-150 ease-in-out group"
                  >
                    <td className="px-6 py-5 font-medium text-gray-900 flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      {doc.fileName}
                    </td>
                    <td className="px-6 py-5">
                      <DocumentStatus documentId={doc.documentId} initialStatus={doc.status} />
                    </td>
                    <td className="px-6 py-5 text-gray-500 font-medium">{doc.totalPages || '-'}</td>
                    <td className="px-6 py-5 text-gray-500">{new Date(doc.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!window.confirm(`Delete ${doc.fileName}?`)) return;
                          try {
                            await apiClient.delete(`/api/v1/documents/${doc.documentId}`);
                            fetchDocs();
                          } catch (err) {
                            console.error(err);
                            alert('Failed to delete document');
                          }
                        }}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        title="Delete Document"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
