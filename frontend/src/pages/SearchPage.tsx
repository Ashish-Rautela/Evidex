
import { SearchBar } from '../components/SearchBar';
import { ResultsList } from '../components/ResultsList';
import { useSearch } from '../hooks/useSearch';

export function SearchPage() {
  const { search, results, isSearching, error } = useSearch();

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in py-10">
      <div className="text-center mt-12 mb-10 max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-2xl mb-4 text-blue-600">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Semantic Search</h1>
        <p className="text-lg text-gray-500 mb-10">Search across all your legal contracts using natural language. Ask questions like "What is the liability cap?"</p>
        <div className="shadow-xl shadow-blue-900/5 rounded-full bg-white p-2 border border-gray-100">
          <SearchBar onSearch={search} isSearching={isSearching} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3 animate-fade-in-up">
          <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {results.length > 0 ? (
        <div className="animate-fade-in-up bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-gray-900">Found {results.length} result{results.length === 1 ? '' : 's'}</h2>
          </div>
          <ResultsList results={results} />
        </div>
      ) : (
        !isSearching && !error && (
          <div className="text-center text-gray-400 mt-16 p-12 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50 animate-fade-in-up">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <p className="text-lg font-medium">Ready to search</p>
            <p className="text-sm mt-1">Enter a query above to scan through your documents.</p>
          </div>
        )
      )}
    </div>
  );
}
