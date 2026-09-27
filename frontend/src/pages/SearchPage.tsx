import { useEffect, useState } from 'react';
import { SearchBar } from '../components/SearchBar';
import { ResultsList } from '../components/ResultsList';
import { useSearch } from '../hooks/useSearch';
import { apiClient } from '../api/client';
import { Search, SlidersHorizontal, AlertCircle, FileSearch, HelpCircle } from 'lucide-react';

export function SearchPage() {
  const { search, results, isSearching, error } = useSearch();
  const [documents, setDocuments] = useState<Array<{ documentId: string; fileName: string; status: string }>>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('ALL');
  const [hasSearched, setHasSearched] = useState(false);
  const [lastQuery, setLastQuery] = useState('');

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await apiClient.get('/api/v1/documents');
        const readyDocs = (res.documents || []).filter((d: any) => d.status === 'READY');
        setDocuments(readyDocs);
      } catch (err) {
        console.error('Failed to fetch documents for search scope:', err);
      }
    };
    fetchDocuments();
  }, []);

  const handleSearch = (query: string) => {
    setHasSearched(true);
    setLastQuery(query);
    search(query, {
      documentIds: selectedDocId !== 'ALL' ? [selectedDocId] : undefined,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-6">
      {/* Top Banner in Retro Mac Window Format */}
      <div className="border-2 border-black rounded-lg bg-white shadow-[5px_5px_0px_#000] overflow-hidden">
        {/* Retro Window Titlebar */}
        <div className="flex items-center justify-between px-4 py-2 bg-neutral-100 border-b-2 border-black font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full border border-black bg-white inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full border border-black bg-white inline-block"></span>
            </span>
            <span className="font-bold text-black ml-1">evidex // semantic-search.exe</span>
          </div>
          <span className="text-neutral-500 font-mono text-[10px]">VECTOR INDEX · TITAN V2</span>
        </div>

        <div className="p-8 text-center max-w-2xl mx-auto">
          <div className="w-14 h-14 mx-auto mb-4 border-2 border-black rounded-full flex items-center justify-center bg-neutral-100 shadow-[3px_3px_0px_#000]">
            <Search className="w-7 h-7 text-black stroke-[2.5]" />
          </div>
          <h1 className="text-4xl font-black text-black mb-2 tracking-tight">Semantic Clause Search</h1>
          <p className="text-neutral-700 font-serif text-base mb-6 italic">
            Query your contract index using plain language concepts, legal provisions, and obligation queries.
          </p>

          {/* Document Scope Filter */}
          {documents.length > 0 && (
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-xs font-mono font-bold text-black flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                SCOPE:
              </span>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="bg-white border-2 border-black text-black text-xs font-mono font-bold rounded px-3 py-1.5 shadow-[2px_2px_0px_#000] focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Contracts ({documents.length} available)</option>
                {documents.map((doc) => (
                  <option key={doc.documentId} value={doc.documentId}>
                    {doc.fileName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Bar */}
          <div>
            <SearchBar onSearch={handleSearch} isSearching={isSearching} />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-white border-2 border-black text-black px-6 py-4 rounded-lg flex items-center gap-3 shadow-[3px_3px_0px_#000] font-mono text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span className="font-bold">{error}</span>
        </div>
      )}

      {results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-2 font-mono text-xs">
            <h2 className="text-lg font-black text-black">
              Found {results.length} result{results.length === 1 ? '' : 's'}
            </h2>
            {selectedDocId !== 'ALL' && (
              <span className="border-2 border-black px-2 py-0.5 rounded bg-white shadow-[1px_1px_0px_#000] font-bold">
                Filtered: Single Document
              </span>
            )}
          </div>
          <ResultsList results={results} />
        </div>
      ) : hasSearched && !isSearching && !error ? (
        <div className="text-center p-10 border-2 border-dashed border-black rounded-lg bg-white shadow-[3px_3px_0px_#000] max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-full border-2 border-black bg-neutral-100 flex items-center justify-center mx-auto mb-3 shadow-[2px_2px_0px_#000]">
            <HelpCircle className="w-6 h-6 text-black" />
          </div>
          <h3 className="text-base font-black font-mono text-black mb-1">No matching clauses found</h3>
          <p className="text-sm font-serif text-neutral-600 mb-3 italic">
            No clauses matched "{lastQuery}" with sufficient similarity score.
          </p>
          <p className="text-xs font-mono text-neutral-500">
            Tip: Try queries like "termination notice", "indemnification", or "governing law".
          </p>
        </div>
      ) : (
        !isSearching && !error && (
          <div className="text-center p-12 border-2 border-dashed border-black rounded-lg bg-white shadow-[3px_3px_0px_#000] max-w-xl mx-auto">
            <FileSearch className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
            <p className="font-mono font-bold text-sm text-black">Search Engine Ready</p>
            <p className="text-xs font-serif italic text-neutral-600 mt-1">
              Type your query above to scan across all indexed legal contracts.
            </p>
          </div>
        )
      )}
    </div>
  );
}
