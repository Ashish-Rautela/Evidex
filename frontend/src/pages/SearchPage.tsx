import React from 'react';
import { SearchBar } from '../components/SearchBar';
import { ResultsList } from '../components/ResultsList';
import { useSearch } from '../hooks/useSearch';

export function SearchPage() {
  const { search, results, isSearching, error } = useSearch();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mt-12 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Semantic Contract Search</h1>
        <p className="text-gray-600 mb-8">Search across all your legal contracts using natural language.</p>
        <SearchBar onSearch={search} isSearching={isSearching} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {results.length > 0 ? (
        <div>
          <h2 className="text-lg font-medium text-gray-700 border-b pb-2">Results ({results.length})</h2>
          <ResultsList results={results} />
        </div>
      ) : (
        !isSearching && !error && (
          <div className="text-center text-gray-500 mt-16 p-8 border-2 border-dashed border-gray-200 rounded-lg">
            No results yet. Try searching for something like "What is the termination clause?"
          </div>
        )
      )}
    </div>
  );
}
