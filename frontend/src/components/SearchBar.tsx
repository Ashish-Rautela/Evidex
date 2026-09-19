import { useState } from 'react';

interface Props {
  onSearch: (query: string) => void;
  isSearching: boolean;
}

export function SearchBar({ onSearch, isSearching }: Props) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask a question about your contracts..."
        className="flex-1 bg-transparent border-none px-6 py-4 focus:outline-none text-gray-900 placeholder-gray-400 text-lg"
      />
      <button
        type="submit"
        disabled={isSearching || !query.trim()}
        className="mr-2 px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 font-semibold flex items-center justify-center min-w-[140px] transition-all shadow-md hover:shadow-lg"
      >
        {isSearching ? (
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Searching...
          </span>
        ) : (
          'Search'
        )}
      </button>
    </form>
  );
}
