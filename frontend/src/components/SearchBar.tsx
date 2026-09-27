import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

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
    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full bg-white border-2 border-black rounded-lg p-1.5 shadow-[4px_4px_0px_#000]">
      <div className="pl-3 text-black">
        <Search className="w-5 h-5 stroke-[2.5]" />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Query contracts (e.g. 'What is the liability cap?')..."
        className="flex-1 bg-transparent border-none px-3 py-3 focus:outline-none text-black placeholder-neutral-500 font-mono text-base"
      />
      <button
        type="submit"
        disabled={isSearching || !query.trim()}
        className="ink-btn px-6 py-2.5 bg-black text-white hover:bg-neutral-800 disabled:opacity-40 font-mono font-bold text-sm tracking-wide rounded"
      >
        {isSearching ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Searching…
          </span>
        ) : (
          'Search →'
        )}
      </button>
    </form>
  );
}
