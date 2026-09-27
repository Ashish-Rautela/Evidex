import { Link } from 'react-router-dom';
import { SearchResult } from '../hooks/useSearch';
import { FileText, ArrowUpRight, Target } from 'lucide-react';

export function ResultsList({ results }: { results: SearchResult[] }) {
  if (results.length === 0) return null;

  return (
    <div className="flex flex-col gap-6 mt-6">
      {results.map((result, idx) => {
        const matchPercent = (result.relevanceScore * 100).toFixed(0);
        return (
          <div 
            key={`${result.documentId}-${idx}`} 
            className="border-2 border-black rounded-lg bg-white shadow-[4px_4px_0px_#000] overflow-hidden transition-transform hover:-translate-y-0.5"
          >
            {/* Retro Mac window header bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-neutral-100 border-b-2 border-black font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-black font-bold">
                  <span className="inline-block w-2.5 h-2.5 rounded-full border border-black bg-white"></span>
                  <span className="inline-block w-2.5 h-2.5 rounded-full border border-black bg-white"></span>
                </span>
                <span className="text-black font-bold ml-1">
                  result-{idx + 1}.clause
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-bold border-2 border-black px-2 py-0.5 rounded bg-white shadow-[1px_1px_0px_#000]">
                <Target className="w-3.5 h-3.5 text-black" />
                <span>{matchPercent}% Match</span>
              </div>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg text-black flex items-center gap-3">
                    {result.clauseTitle || 'Untitled Clause'}
                    {result.clauseIdentifier && (
                      <span className="text-xs bg-neutral-100 text-black px-2 py-0.5 rounded border border-black font-mono font-bold">
                        {result.clauseIdentifier}
                      </span>
                    )}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2 font-mono text-xs">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-100 text-black font-bold border border-black">
                      <FileText className="w-3.5 h-3.5 text-black" />
                      {result.fileName}
                    </span>
                    <span className="text-black font-bold">•</span> 
                    <span className="text-neutral-700 font-bold bg-white px-2 py-0.5 rounded border border-black">
                      Page {result.pageNumber}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="my-4 text-sm font-serif bg-neutral-50 p-4 rounded border-2 border-black leading-relaxed italic text-black">
                "{result.matchedChunkText ? 
                  (result.matchedChunkText.length > 300 ? result.matchedChunkText.substring(0, 300) + '...' : result.matchedChunkText)
                  : (result.parentClauseText ? result.parentClauseText.substring(0, 300) + '...' : '')}"
              </div>

              <div className="pt-2 flex justify-end">
                <Link
                  to={`/viewer/${result.documentId}?page=${result.pageNumber}${result.coordinates ? `&x1=${result.coordinates.x1}&y1=${result.coordinates.y1}&x2=${result.coordinates.x2}&y2=${result.coordinates.y2}` : ''}`}
                  className="ink-btn bg-white hover:bg-neutral-100 text-black text-xs font-mono font-bold px-4 py-2 rounded gap-2"
                >
                  View in PDF 
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
