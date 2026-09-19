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
      setDocuments(res.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Upload New Contract</h1>
        <UploadForm onUploadComplete={fetchDocs} />
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4 text-gray-900">Your Documents</h2>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Pages</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No documents found. Upload one to get started.</td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr 
                    key={doc.id} 
                    onClick={() => navigate(`/viewer/${doc.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">{doc.fileName}</td>
                    <td className="px-6 py-4">
                      <DocumentStatus documentId={doc.id} initialStatus={doc.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-500">{doc.totalPages || '-'}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(doc.createdAt).toLocaleDateString()}</td>
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
