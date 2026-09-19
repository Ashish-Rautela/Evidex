
import { Link } from 'react-router-dom';
import { SearchResult } from '../hooks/useSearch';

export function ResultsList({ results }: { results: SearchResult[] }) {
  if (results.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 mt-8">
      {results.map((result, idx) => (
        <div key={`${result.documentId}-${idx}`} className="bg-white border border-gray-200 rounded p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                {result.clauseTitle || 'Untitled Clause'}
                {result.clauseIdentifier && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">
                    {result.clauseIdentifier}
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{result.fileName} • Page {result.pageNumber}</p>
            </div>
            <div className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-green-200">
              {(result.relevanceScore * 100).toFixed(0)}% Match
            </div>
          </div>
          
          <p className="text-gray-700 my-4 text-sm bg-gray-50 p-3 rounded italic border-l-4 border-gray-300">
            {result.parentClauseText ? 
              (result.parentClauseText.length > 200 ? result.parentClauseText.substring(0, 200) + '...' : result.parentClauseText)
              : result.matchedChunkText.substring(0, 200) + '...'}
          </p>

          <Link
            to={`/viewer/${result.documentId}?page=${result.pageNumber}${result.coordinates ? `&x1=${result.coordinates.x1}&y1=${result.coordinates.y1}&x2=${result.coordinates.x2}&y2=${result.coordinates.y2}` : ''}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1"
          >
            View in PDF &rarr;
          </Link>
        </div>
      ))}
    </div>
  );
}
