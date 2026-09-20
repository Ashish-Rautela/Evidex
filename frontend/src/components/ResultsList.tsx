
import { Link } from 'react-router-dom';
import { SearchResult } from '../hooks/useSearch';

export function ResultsList({ results }: { results: SearchResult[] }) {
  if (results.length === 0) return null;

  return (
    <div className="flex flex-col gap-6 mt-6">
      {results.map((result, idx) => (
        <div 
          key={`${result.documentId}-${idx}`} 
          className="group bg-white hover:bg-blue-50/30 border border-gray-100 hover:border-blue-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 ease-in-out"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-xl text-gray-900 flex items-center gap-3">
                {result.clauseTitle || 'Untitled Clause'}
                {result.clauseIdentifier && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md border border-gray-200 font-medium font-mono">
                    {result.clauseIdentifier}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 font-medium">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                {result.fileName} 
                <span className="text-gray-300">•</span> 
                Page {result.pageNumber}
              </div>
            </div>
            <div className="bg-emerald-50 text-emerald-700 text-sm font-bold px-3 py-1 rounded-full border border-emerald-200/60 shadow-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              {(result.relevanceScore * 100).toFixed(0)}% Match
            </div>
          </div>
          
          <div className="text-gray-700 my-5 text-sm bg-gray-50/80 p-5 rounded-xl italic border-l-4 border-blue-400 leading-relaxed group-hover:bg-white transition-colors">
            {result.matchedChunkText ? 
              (result.matchedChunkText.length > 300 ? result.matchedChunkText.substring(0, 300) + '...' : result.matchedChunkText)
              : (result.parentClauseText ? result.parentClauseText.substring(0, 300) + '...' : '')}
          </div>

          <Link
            to={`/viewer/${result.documentId}?page=${result.pageNumber}${result.coordinates ? `&x1=${result.coordinates.x1}&y1=${result.coordinates.y1}&x2=${result.coordinates.x2}&y2=${result.coordinates.y2}` : ''}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-bold bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors group/link"
          >
            View in PDF 
            <svg className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
      ))}
    </div>
  );
}
